import { getIndexDatabase } from "../retrieval/dbClient.js";
import { executeFtsSearch } from "../retrieval/ftsSearch.js";
import {
  DocType,
  LIBRARY_NPM_PACKAGE_MAP,
  ResponseStatus,
  SUPPORTED_LIBRARIES,
} from "../types/common.js";
import {
  analyzeVersionSpec,
  normalizeLibraryName,
} from "../utils/versionUtils.js";
import { handleDetectProjectEnvironment } from "./detectProjectEnv.js";

export async function handleSearchVersionedDocs(input: {
  library: string;
  version?: string;
  project_path?: string;
  query: string;
  doc_types?: DocType[];
  top_k?: number;
}): Promise<Record<string, unknown>> {
  const library = normalizeLibraryName(input.library);
  if (!library) {
    return {
      status: "unsupported_library" satisfies ResponseStatus,
      requested_library: input.library,
      supported_libraries: SUPPORTED_LIBRARIES,
      guardrail_notes: [
        `Library "${input.library}" is not supported. Supported libraries: ${SUPPORTED_LIBRARIES.join(", ")}.`,
      ],
    };
  }

  let versionToParse = input.version?.trim() ?? "";
  let resolutionSource = "explicit_input";

  // If version is omitted, resolve from project_path lockfile/package.json (never silently default to latest!)
  if (!versionToParse && input.project_path) {
    const envResult = handleDetectProjectEnvironment({
      project_path: input.project_path,
    });
    if (library === "node") {
      if (envResult.runtime.node.resolved_version) {
        versionToParse = envResult.runtime.node.resolved_version;
        resolutionSource = `project_runtime:${envResult.runtime.node.source}`;
      }
    } else {
      const candidatePkgs = LIBRARY_NPM_PACKAGE_MAP[library];
      for (const pkgName of candidatePkgs) {
        const dep = envResult.core_dependencies[pkgName];
        if (dep?.resolved_version) {
          versionToParse = dep.resolved_version;
          resolutionSource = `project_dependency:${dep.resolution_source}`;
          break;
        }
      }
    }
  }

  if (!versionToParse) {
    return {
      status: "ambiguous_version" satisfies ResponseStatus,
      library,
      requested_version: input.version ?? null,
      project_path: input.project_path ?? null,
      reason:
        "No version was specified and could not resolve an installed version from project_path.",
      guardrail_notes: [
        "Do NOT silently assume the latest version. Call detect_project_environment first or ask the user which version they are using.",
      ],
    };
  }

  const parsedSpec = analyzeVersionSpec(versionToParse);
  if (
    parsedSpec.status === "ambiguous" ||
    parsedSpec.status === "protocol" ||
    parsedSpec.major === null ||
    !parsedSpec.resolvedVersion
  ) {
    return {
      status: "ambiguous_version" satisfies ResponseStatus,
      library,
      requested_version: versionToParse,
      reason:
        parsedSpec.reason ??
        `Version "${versionToParse}" is ambiguous. Specify a concrete version (e.g. "15.0.3" or "4.0.0").`,
      guardrail_notes: [
        "Never silently substitute 'latest' when the version is ambiguous.",
      ],
    };
  }

  const { db, indexInfo } = await getIndexDatabase();

  // Check if this major version is indexed in indexed_versions
  const indexedVersionRow = db
    .prepare(
      `SELECT version, git_tag FROM indexed_versions WHERE library = ? AND major = ? ORDER BY semver_num DESC LIMIT 1`
    )
    .get(library, parsedSpec.major) as
    | { version: string; git_tag: string }
    | undefined;

  if (!indexedVersionRow) {
    const availableMajors = db
      .prepare(
        `SELECT DISTINCT major FROM indexed_versions WHERE library = ? ORDER BY major ASC`
      )
      .all(library) as Array<{ major: number }>;

    return {
      status: "unverified" satisfies ResponseStatus,
      library,
      requested_version: input.version ?? null,
      resolved_version: parsedSpec.resolvedVersion,
      reason: `Version major v${parsedSpec.major} for ${library} is not indexed.`,
      indexed_majors_available: availableMajors.map((m) => m.major),
      guardrail_notes: [
        `Do not apply documentation from other majors (${availableMajors.map((m) => `v${m.major}`).join(", ")}) to ${library} v${parsedSpec.major} without warning the user.`,
      ],
    };
  }

  const topK = input.top_k ?? 5;
  const searchOutcome = executeFtsSearch(db, {
    library,
    majorVersion: parsedSpec.major,
    query: input.query,
    docTypes: input.doc_types,
    topK,
  });

  const results = searchOutcome.rows.map((r) => ({
    chunk_uid: r.chunk_uid,
    library: r.library,
    version: r.version,
    doc_type: r.doc_type,
    is_breaking: Boolean(r.is_breaking),
    section: r.section,
    git_tag: r.git_tag,
    source_url: r.source_url,
    score: r.rank_score,
    content: r.content,
    content_sha256: r.content_sha256,
    collected_at: r.collected_at,
  }));

  return {
    status: "ok" satisfies ResponseStatus,
    search_metadata: {
      library,
      requested_version: input.version ?? null,
      resolved_version: parsedSpec.resolvedVersion,
      version_resolution_source: resolutionSource,
      indexed_doc_version_matched: indexedVersionRow.version,
      index_source: indexInfo.source,
      sha256_verified: indexInfo.sha256Verified,
      search_mode: searchOutcome.matchStrategy,
      total_matches: results.length,
    },
    results,
    interpretation_guardrail:
      results.length === 0
        ? "NO_EVIDENCE_DO_NOT_ASSUME_REMOVED"
        : "CITE_SOURCE_URLS_ONLY",
    guardrail_notes: [
      `Search restricted strictly to ${library} v${parsedSpec.major} (resolved version: ${parsedSpec.resolvedVersion}).`,
      "If total_matches is 0, do NOT conclude that the queried feature or API was removed; absence of migration/deprecation hits only means no matching change chunk was found.",
    ],
  };
}
