import { translateNpmCommand } from "../detectors/packageManager.js";
import { getIndexDatabase } from "../retrieval/dbClient.js";
import { executeFtsSearch, FtsSearchResultRow } from "../retrieval/ftsSearch.js";
import {
  DocType,
  ResponseStatus,
  SUPPORTED_LIBRARIES,
  SupportedPackageManager,
} from "../types/common.js";
import {
  analyzeVersionSpec,
  normalizeLibraryName,
  semverToNum,
} from "../utils/versionUtils.js";

export async function handleGetUpgradeSteps(input: {
  library: string;
  from_version: string;
  to_version: string;
  focus_area?: string;
  package_manager?: SupportedPackageManager;
}): Promise<Record<string, unknown>> {
  const library = normalizeLibraryName(input.library);
  if (!library) {
    return {
      status: "unsupported_library" satisfies ResponseStatus,
      requested_library: input.library,
      supported_libraries: SUPPORTED_LIBRARIES,
      guardrail_notes: [
        `Library "${input.library}" is not in the supported scope (${SUPPORTED_LIBRARIES.join(", ")}).`,
      ],
    };
  }

  const fromParsed = analyzeVersionSpec(input.from_version);
  const toParsed = analyzeVersionSpec(input.to_version);

  if (
    fromParsed.status === "ambiguous" ||
    fromParsed.status === "protocol" ||
    !fromParsed.resolvedVersion ||
    fromParsed.major === null ||
    toParsed.status === "ambiguous" ||
    toParsed.status === "protocol" ||
    !toParsed.resolvedVersion ||
    toParsed.major === null
  ) {
    return {
      status: "ambiguous_version" satisfies ResponseStatus,
      library,
      requested_from_version: input.from_version,
      requested_to_version: input.to_version,
      reason:
        "Both from_version and to_version must be concrete versions or single-major ranges (never 'latest' or '*').",
      guardrail_notes: [
        "Run detect_project_environment to get the exact current version and confirm the target version with the user.",
      ],
    };
  }

  const fromNum = semverToNum(fromParsed.resolvedVersion);
  const toNum = semverToNum(toParsed.resolvedVersion);
  if (fromNum === null || toNum === null || fromNum >= toNum) {
    return {
      status: "unverified" satisfies ResponseStatus,
      library,
      resolved_from_version: fromParsed.resolvedVersion,
      resolved_to_version: toParsed.resolvedVersion,
      reason: `to_version (${toParsed.resolvedVersion}) must be strictly greater than from_version (${fromParsed.resolvedVersion}).`,
      guardrail_notes: [
        "Verify the upgrade direction before suggesting migration changes.",
      ],
    };
  }

  const { db } = await getIndexDatabase();
  const pm = input.package_manager ?? "npm";

  // Target major ceiling: include all chunks in (fromNum, toMajor.999.999] up to target major
  const targetMajorCeiling = toParsed.major * 1_000_000 + 999_999;
  const effectiveUpperSemver = Math.max(toNum, targetMajorCeiling);

  let rows: FtsSearchResultRow[] = [];

  if (input.focus_area && input.focus_area.trim()) {
    // Search via FTS5 within target major(s), then filter to (fromNum, effectiveUpperSemver]
    const ftsRes = executeFtsSearch(db, {
      library,
      majorVersion: toParsed.major,
      maxSemverNum: effectiveUpperSemver,
      query: input.focus_area,
      docTypes: ["migration_guide", "release_note", "deprecation"],
      topK: 10,
    });
    rows = ftsRes.rows;
  }

  if (rows.length === 0) {
    const stmt = db.prepare(`
      SELECT
        chunk_uid,
        library,
        version,
        major_version,
        doc_type,
        is_breaking,
        codemod_command,
        section,
        source_url,
        git_tag,
        content,
        code_tokens,
        content_sha256,
        collected_at,
        0.0 AS rank_score
      FROM doc_chunks
      WHERE library = ?
        AND semver_num > ?
        AND semver_num <= ?
        AND doc_type IN ('migration_guide', 'release_note', 'deprecation')
      ORDER BY semver_num ASC, is_breaking DESC, id ASC
      LIMIT 20
    `);
    rows = stmt.all(
      library,
      fromNum,
      effectiveUpperSemver
    ) as unknown as FtsSearchResultRow[];
  }

  if (rows.length === 0) {
    return {
      status: "unverified" satisfies ResponseStatus,
      library,
      resolved_from_version: fromParsed.resolvedVersion,
      resolved_to_version: toParsed.resolvedVersion,
      is_major_upgrade: toParsed.major > fromParsed.major,
      breaking_changes: [],
      migration_steps: [],
      interpretation_guardrail: "NO_EVIDENCE_DO_NOT_ASSUME_REMOVED",
      guardrail_notes: [
        `No indexed migration chunks found between ${library} ${fromParsed.resolvedVersion} and ${toParsed.resolvedVersion}.`,
        "Do NOT assume there are no breaking changes or that an API was removed without explicit release note evidence.",
      ],
    };
  }

  const codemodsMap = new Map<string, { command: string; source_url: string }>();
  for (const r of rows) {
    if (r.codemod_command) {
      const formatted = translateNpmCommand(r.codemod_command, pm);
      if (!codemodsMap.has(formatted)) {
        codemodsMap.set(formatted, {
          command: formatted,
          source_url: r.source_url,
        });
      }
    }
  }

  const breakingChanges = rows
    .filter((r) => r.is_breaking === 1 || r.doc_type === "deprecation")
    .map((r) => ({
      chunk_uid: r.chunk_uid,
      library: r.library,
      version: r.version,
      doc_type: r.doc_type as DocType,
      section: r.section,
      git_tag: r.git_tag,
      source_url: r.source_url,
      content: r.content,
      collected_at: r.collected_at,
    }));

  const migrationSteps = rows.map((r, idx) => ({
    step: idx + 1,
    chunk_uid: r.chunk_uid,
    library: r.library,
    version: r.version,
    doc_type: r.doc_type as DocType,
    is_breaking: Boolean(r.is_breaking),
    section: r.section,
    git_tag: r.git_tag,
    source_url: r.source_url,
    content: r.content,
    collected_at: r.collected_at,
  }));

  return {
    status: "ok" satisfies ResponseStatus,
    library,
    resolved_from_version: fromParsed.resolvedVersion,
    resolved_to_version: toParsed.resolvedVersion,
    is_major_upgrade: toParsed.major > fromParsed.major,
    focus_area: input.focus_area ?? null,
    official_codemods: Array.from(codemodsMap.values()),
    breaking_changes: breakingChanges,
    migration_steps: migrationSteps,
    interpretation_guardrail: "CITE_SOURCE_URLS_ONLY",
    guardrail_notes: [
      "Every breaking change and migration step includes its exact git_tag and source_url.",
      "Do NOT conclude that an API or configuration option was removed if it is not explicitly mentioned in these chunks.",
      "Commands in official_codemods are returned for reference only and have NOT been executed.",
    ],
  };
}
