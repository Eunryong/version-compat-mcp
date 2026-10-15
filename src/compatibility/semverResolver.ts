import semver from "semver";
import {
  CheckCompatibilityOutput,
  CompatibilityConflict,
  DeprecationNotice,
  ResponseStatus,
  UnverifiedItem,
} from "../types/common.js";
import { analyzeVersionSpec } from "../utils/versionUtils.js";
import {
  fetchNpmPackageMeta,
  NpmPackageAbbreviatedMeta,
} from "./npmRegistryClient.js";

export type RegistryFetcher = (
  pkgName: string
) => Promise<NpmPackageAbbreviatedMeta | null>;

function satisfiesWithPrereleaseFallback(
  version: string,
  range: string
): boolean {
  if (semver.satisfies(version, range, { includePrerelease: true })) {
    return true;
  }
  // If range has complex OR clauses with canary/rc tags (like Next 15's react peerDep),
  // test each OR branch individually
  const branches = range.split("||").map((b) => b.trim());
  for (const branch of branches) {
    if (!branch) continue;
    const validBranch = semver.validRange(branch);
    if (
      validBranch &&
      semver.satisfies(version, validBranch, { includePrerelease: true })
    ) {
      return true;
    }
  }
  return false;
}

export async function verifyDependencyCompatibility(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string> = {},
  runtimeVersion?: string,
  fetcher: RegistryFetcher = fetchNpmPackageMeta
): Promise<CheckCompatibilityOutput> {
  const mergedDeps: Record<string, string> = {
    ...devDependencies,
    ...dependencies,
  };

  const evaluatedPackages: CheckCompatibilityOutput["evaluated_context"]["evaluated_packages"] =
    {};
  const conflicts: CompatibilityConflict[] = [];
  const deprecations: DeprecationNotice[] = [];
  const unverified: UnverifiedItem[] = [];

  const normalizedRuntime = runtimeVersion
    ? semver.clean(runtimeVersion) ?? semver.coerce(runtimeVersion)?.version ?? null
    : null;

  const pkgNames = Object.keys(mergedDeps);
  const packagesToFetch: Array<{
    pkgName: string;
    rawSpec: string;
    specStatus: "exact" | "single_major_range";
    exactVersion: string | null;
  }> = [];

  for (const pkgName of pkgNames) {
    const rawSpec = mergedDeps[pkgName];
    const parsed = analyzeVersionSpec(rawSpec);

    if (parsed.status === "protocol") {
      const isWorkspace =
        rawSpec.startsWith("workspace:") || rawSpec.startsWith("catalog:");
      unverified.push({
        package: pkgName,
        spec: rawSpec,
        reason: isWorkspace
          ? "LOCAL_WORKSPACE_PROTOCOL"
          : "GIT_OR_FILE_PROTOCOL",
        detail:
          parsed.reason ??
          `Cannot verify npm registry metadata for protocol spec "${rawSpec}".`,
      });
      evaluatedPackages[pkgName] = {
        input: rawSpec,
        evaluated_exact: null,
        resolution: "unverified",
      };
      continue;
    }

    if (parsed.status === "ambiguous") {
      unverified.push({
        package: pkgName,
        spec: rawSpec,
        reason: "AMBIGUOUS_VERSION_RANGE",
        detail:
          parsed.reason ??
          `Version spec "${rawSpec}" is ambiguous. Provide an exact version or lockfile-resolved version.`,
      });
      evaluatedPackages[pkgName] = {
        input: rawSpec,
        evaluated_exact: null,
        resolution: "unverified",
      };
      continue;
    }

    packagesToFetch.push({
      pkgName,
      rawSpec,
      specStatus: parsed.status,
      exactVersion:
        parsed.status === "exact" ? parsed.resolvedVersion : null,
    });
  }

  // Fetch registry metadata concurrently
  const metaEntries = await Promise.all(
    packagesToFetch.map(async (item) => ({
      ...item,
      meta: await fetcher(item.pkgName),
    }))
  );

  const resolvedVersionMap = new Map<string, string>();
  const resolvedMetaMap = new Map<
    string,
    NpmPackageAbbreviatedMeta["versions"][string]
  >();

  for (const item of metaEntries) {
    if (!item.meta || !item.meta.versions) {
      unverified.push({
        package: item.pkgName,
        spec: item.rawSpec,
        reason: "REGISTRY_FETCH_FAILED",
        detail: `Could not fetch metadata for "${item.pkgName}" from npm registry.`,
      });
      evaluatedPackages[item.pkgName] = {
        input: item.rawSpec,
        evaluated_exact: null,
        resolution: "unverified",
      };
      continue;
    }

    let targetExact: string | null = item.exactVersion;
    let resolutionType: "exact_input" | "registry_max_satisfying" =
      "exact_input";

    if (!targetExact) {
      const allVersions = Object.keys(item.meta.versions);
      targetExact = semver.maxSatisfying(allVersions, item.rawSpec);
      resolutionType = "registry_max_satisfying";
    }

    if (!targetExact || !item.meta.versions[targetExact]) {
      unverified.push({
        package: item.pkgName,
        spec: item.rawSpec,
        reason: "VERSION_NOT_FOUND_IN_REGISTRY",
        detail: `No version matching "${item.rawSpec}" was found in npm registry for "${item.pkgName}".`,
      });
      evaluatedPackages[item.pkgName] = {
        input: item.rawSpec,
        evaluated_exact: null,
        resolution: "unverified",
      };
      continue;
    }

    evaluatedPackages[item.pkgName] = {
      input: item.rawSpec,
      evaluated_exact: targetExact,
      resolution: resolutionType,
    };
    resolvedVersionMap.set(item.pkgName, targetExact);
    resolvedMetaMap.set(item.pkgName, item.meta.versions[targetExact]);
  }

  // Evaluate deprecations, engines.node, and peerDependencies
  for (const [pkgName, exactVer] of resolvedVersionMap.entries()) {
    const verMeta = resolvedMetaMap.get(pkgName);
    if (!verMeta) continue;

    const sourceUrl = `https://registry.npmjs.org/${pkgName}/${exactVer}`;

    // 1. Deprecation check
    if (typeof verMeta.deprecated === "string" && verMeta.deprecated.trim()) {
      deprecations.push({
        package: pkgName,
        version: exactVer,
        message: verMeta.deprecated.trim(),
        source_url: sourceUrl,
      });
    }

    // 2. Runtime engines.node check
    const requiredNodeRange = verMeta.engines?.node;
    if (requiredNodeRange) {
      if (!normalizedRuntime) {
        unverified.push({
          package: `${pkgName}@${exactVer}`,
          spec: `engines.node: ${requiredNodeRange}`,
          reason: "RUNTIME_VERSION_NOT_PROVIDED",
          detail: `${pkgName}@${exactVer} requires node "${requiredNodeRange}", but runtime_version was not provided.`,
        });
      } else if (
        !satisfiesWithPrereleaseFallback(normalizedRuntime, requiredNodeRange)
      ) {
        conflicts.push({
          type: "engine_mismatch",
          package: `${pkgName}@${exactVer}`,
          requirement: `node ${requiredNodeRange}`,
          actual: normalizedRuntime,
          source_url: sourceUrl,
        });
      }
    }

    // 3. PeerDependencies check
    const peerDeps = verMeta.peerDependencies ?? {};
    const peerDepsMeta = verMeta.peerDependenciesMeta ?? {};

    for (const [peerPkg, peerRange] of Object.entries(peerDeps)) {
      const isOptional = Boolean(peerDepsMeta[peerPkg]?.optional);
      const installedPeerExact = resolvedVersionMap.get(peerPkg);
      const rawPeerInProject = mergedDeps[peerPkg];

      if (!installedPeerExact && !rawPeerInProject) {
        if (!isOptional) {
          conflicts.push({
            type: "missing_peer_dependency",
            package: `${pkgName}@${exactVer}`,
            peer_package: peerPkg,
            requirement: peerRange,
            actual: "not_installed",
            is_optional_peer: false,
            source_url: sourceUrl,
          });
        }
        continue;
      }

      if (installedPeerExact) {
        if (!satisfiesWithPrereleaseFallback(installedPeerExact, peerRange)) {
          conflicts.push({
            type: "peer_dependency_conflict",
            package: `${pkgName}@${exactVer}`,
            peer_package: peerPkg,
            requirement: peerRange,
            actual: installedPeerExact,
            is_optional_peer: isOptional,
            source_url: sourceUrl,
          });
        }
      }
    }
  }

  let status: ResponseStatus = "ok";
  if (resolvedVersionMap.size === 0 && unverified.length > 0) {
    status = unverified.some((u) => u.reason === "AMBIGUOUS_VERSION_RANGE")
      ? "ambiguous_version"
      : "unverified";
  } else if (unverified.length > 0) {
    status = "partial";
  }

  const compatible =
    status === "unverified" || status === "ambiguous_version"
      ? null
      : conflicts.length === 0;

  return {
    status,
    evaluated_context: {
      runtime_node: normalizedRuntime,
      evaluated_packages: evaluatedPackages,
    },
    compatible,
    conflicts,
    deprecations,
    unverified,
    guardrail_notes: [
      "Compatibility results are computed deterministically from npm registry metadata (engines, peerDependencies, deprecated).",
      "Items listed in 'unverified' could not be verified deterministically and must not be assumed compatible without checking.",
    ],
  };
}
