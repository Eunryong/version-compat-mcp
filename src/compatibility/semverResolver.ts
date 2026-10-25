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
import {
  fetchPypiPackageMeta,
  PypiPackageMeta,
} from "./pypiRegistryClient.js";

export type RegistryFetcher = (
  pkgName: string
) => Promise<NpmPackageAbbreviatedMeta | null>;

export type PypiRegistryFetcher = (
  pkgName: string
) => Promise<PypiPackageMeta | null>;

export function satisfiesPythonRange(
  version: string,
  pythonSpec: string
): boolean {
  const normalizedVer =
    semver.clean(version) ?? semver.coerce(version)?.version;
  if (!normalizedVer) return false;

  const clauses = pythonSpec
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  for (const clause of clauses) {
    if (clause.startsWith("!=")) {
      const excluded =
        semver.clean(clause.slice(2).trim()) ??
        semver.coerce(clause.slice(2).trim())?.version;
      if (excluded && semver.eq(normalizedVer, excluded)) {
        return false;
      }
      continue;
    }
    let semverClause = clause;
    if (semverClause.startsWith("==")) {
      semverClause = semverClause.slice(2).trim();
    } else if (semverClause.startsWith("~=")) {
      semverClause = `~${semverClause.slice(2).trim()}`;
    }
    let valid = semver.validRange(semverClause);
    if (!valid) {
      const coerced = semverClause.replace(
        /([><=~^]+)\s*(\d+)\.(\d+)$/,
        "$1$2.$3.0"
      );
      valid = semver.validRange(coerced);
    }
    if (
      valid &&
      !semver.satisfies(normalizedVer, valid, { includePrerelease: true })
    ) {
      return false;
    }
  }
  return true;
}

const PYTHON_LIBRARIES = new Set([
  "python",
  "pydantic",
  "fastapi",
  "sqlalchemy",
  "langchain",
  "uv",
  "flask",
  "django",
  "pytest",
  "ruff",
  "black",
  "numpy",
  "pandas",
  "requests",
  "httpx",
  "starlette",
  "alembic",
  "celery",
  "gunicorn",
  "uvicorn",
]);

function isPythonEcosystem(
  ecosystem: "npm" | "pypi" | undefined,
  packages: string[],
  runtimeVersion?: string
): boolean {
  if (ecosystem === "pypi") return true;
  if (ecosystem === "npm") return false;
  if (
    packages.some(
      (p) =>
        PYTHON_LIBRARIES.has(p.toLowerCase()) ||
        p.toLowerCase().startsWith("pydantic-") ||
        p.toLowerCase().startsWith("langchain-") ||
        p.toLowerCase().startsWith("langchain_")
    )
  ) {
    return true;
  }
  if (runtimeVersion && /^3\.\d+/.test(runtimeVersion)) {
    return true;
  }
  return false;
}

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

async function verifyPythonDependencies(
  mergedDeps: Record<string, string>,
  runtimeVersion?: string,
  fetcher: PypiRegistryFetcher = fetchPypiPackageMeta
): Promise<CheckCompatibilityOutput> {
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
      unverified.push({
        package: pkgName,
        spec: rawSpec,
        reason: "GIT_OR_FILE_PROTOCOL",
        detail:
          parsed.reason ??
          `Cannot verify PyPI metadata for protocol spec "${rawSpec}".`,
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
      exactVersion: parsed.status === "exact" ? parsed.resolvedVersion : null,
    });
  }

  const metaEntries = await Promise.all(
    packagesToFetch.map(async (item) => ({
      ...item,
      meta: await fetcher(item.pkgName),
    }))
  );

  const resolvedVersionMap = new Map<string, string>();
  const resolvedMetaMap = new Map<string, PypiPackageMeta>();

  for (const item of metaEntries) {
    if (!item.meta || !item.meta.releases) {
      unverified.push({
        package: item.pkgName,
        spec: item.rawSpec,
        reason: "REGISTRY_FETCH_FAILED",
        detail: `Could not fetch metadata for "${item.pkgName}" from PyPI registry.`,
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

    const allReleases = Object.keys(item.meta.releases);
    if (
      targetExact &&
      !item.meta.releases[targetExact] &&
      item.meta.info.version !== targetExact
    ) {
      targetExact = null;
    }

    if (!targetExact) {
      const normalizedRange = item.rawSpec
        .replace(/^==\s*/, "")
        .replace(/^~=\s*/, "~");
      targetExact = semver.maxSatisfying(allReleases, normalizedRange);
      resolutionType = "registry_max_satisfying";
    }

    if (!targetExact) {
      unverified.push({
        package: item.pkgName,
        spec: item.rawSpec,
        reason: "VERSION_NOT_FOUND_IN_REGISTRY",
        detail: `No version matching "${item.rawSpec}" was found in PyPI registry for "${item.pkgName}".`,
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
    resolvedMetaMap.set(item.pkgName, item.meta);
  }

  for (const [pkgName, exactVer] of resolvedVersionMap.entries()) {
    const pypiMeta = resolvedMetaMap.get(pkgName);
    if (!pypiMeta) continue;

    const sourceUrl = `https://pypi.org/project/${pkgName}/${exactVer}/`;

    // 1. Yanked check
    const releaseFiles = pypiMeta.releases[exactVer] ?? [];
    const isYanked = Boolean(pypiMeta.info.yanked || releaseFiles.some((f) => f.yanked));
    if (isYanked) {
      deprecations.push({
        package: pkgName,
        version: exactVer,
        message: pypiMeta.info.yanked_reason || "Yanked release from PyPI",
        source_url: sourceUrl,
      });
    }

    // 2. Python runtime engine check
    const reqPython =
      releaseFiles.find((f) => f.requires_python)?.requires_python ??
      pypiMeta.info.requires_python;

    if (reqPython) {
      if (!normalizedRuntime) {
        unverified.push({
          package: `${pkgName}@${exactVer}`,
          spec: `requires-python: ${reqPython}`,
          reason: "RUNTIME_VERSION_NOT_PROVIDED",
          detail: `${pkgName}@${exactVer} requires python "${reqPython}", but runtime_version was not provided.`,
        });
      } else if (!satisfiesPythonRange(normalizedRuntime, reqPython)) {
        conflicts.push({
          type: "engine_mismatch",
          package: `${pkgName}@${exactVer}`,
          requirement: `python ${reqPython}`,
          actual: normalizedRuntime,
          source_url: sourceUrl,
        });
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
      runtime_node: null,
      runtime_python: normalizedRuntime,
      evaluated_packages: evaluatedPackages,
    },
    compatible,
    conflicts,
    deprecations,
    unverified,
    guardrail_notes: [
      "Compatibility results are computed deterministically from PyPI registry metadata (requires_python, yanked).",
      "Items listed in 'unverified' could not be verified deterministically and must not be assumed compatible without checking.",
    ],
  };
}

export async function verifyDependencyCompatibility(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string> = {},
  runtimeVersion?: string,
  fetcher: RegistryFetcher = fetchNpmPackageMeta,
  pypiFetcher: PypiRegistryFetcher = fetchPypiPackageMeta,
  ecosystem?: "npm" | "pypi"
): Promise<CheckCompatibilityOutput> {
  const mergedDeps: Record<string, string> = {
    ...devDependencies,
    ...dependencies,
  };

  const isPython = isPythonEcosystem(
    ecosystem,
    Object.keys(mergedDeps),
    runtimeVersion
  );

  if (isPython) {
    return verifyPythonDependencies(mergedDeps, runtimeVersion, pypiFetcher);
  }

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
