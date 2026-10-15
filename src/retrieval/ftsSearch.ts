import { DatabaseSync } from "node:sqlite";
import { DocType, SupportedLibrary } from "../types/common.js";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "why",
  "with",
  "after",
  "before",
  "upgrade",
  "upgrading",
  "migration",
  "migrate",
  "working",
  "not",
  "error",
  "issue",
  "problem",
  "does",
  "do",
  "use",
  "using",
  "간",
  "시",
  "후",
  "전",
  "에서",
  "으로",
  "로",
  "의",
  "가",
  "이",
  "은",
  "는",
  "을",
  "를",
  "안",
  "됨",
  "안됨",
  "방법",
  "설정",
  "에러",
  "오류",
  "업그레이드",
  "마이그레이션",
]);

export function extractQueryTokens(rawQuery: string): string[] {
  // Keep @, /, _, -, . inside tokens (matching our FTS5 unicode61 tokenchars)
  const matches = rawQuery
    .toLowerCase()
    .match(/[a-z0-9@/_.-]+|[가-힣]+/g);
  if (!matches) return [];

  const filtered: string[] = [];
  for (const rawToken of matches) {
    // Trim leading/trailing dots or hyphens unless it's a dotfile like .eslintrc or flag like --flat
    const token = rawToken.replace(/^[.-]+|[.-]+$/g, "");
    if (!token || token.length < 2) continue;
    if (STOPWORDS.has(token)) continue;
    if (!filtered.includes(token)) {
      filtered.push(token);
    }
  }

  // If all tokens were stopwords, keep non-empty tokens from original
  if (filtered.length === 0) {
    return matches
      .map((t) => t.replace(/^["']+|["']+$/g, ""))
      .filter((t) => t.length >= 2);
  }
  return filtered;
}

export function buildFtsMatchExpression(
  tokens: string[],
  operator: "AND" | "OR"
): string {
  return tokens
    .map((t) => `"${t.replace(/"/g, '""')}"`)
    .join(` ${operator} `);
}

export interface FtsSearchResultRow {
  chunk_uid: string;
  library: SupportedLibrary;
  version: string;
  major_version: number;
  doc_type: DocType;
  is_breaking: number;
  codemod_command: string | null;
  section: string;
  source_url: string;
  git_tag: string;
  content: string;
  code_tokens: string;
  content_sha256: string;
  collected_at: string;
  rank_score: number;
}

export function executeFtsSearch(
  db: DatabaseSync,
  params: {
    library: SupportedLibrary;
    majorVersion: number;
    maxSemverNum?: number;
    query: string;
    docTypes?: DocType[];
    topK: number;
  }
): {
  rows: FtsSearchResultRow[];
  matchStrategy: "fts5_bm25_strict_and" | "fts5_bm25_relaxed_or";
} {
  const tokens = extractQueryTokens(params.query);
  if (tokens.length === 0) {
    return { rows: [], matchStrategy: "fts5_bm25_strict_and" };
  }

  const runWithExpr = (ftsExpr: string): FtsSearchResultRow[] => {
    const conditions: string[] = [
      "doc_chunks_fts MATCH ?",
      "c.library = ?",
      "c.major_version = ?",
    ];
    const sqlArgs: Array<string | number> = [
      ftsExpr,
      params.library,
      params.majorVersion,
    ];

    if (typeof params.maxSemverNum === "number") {
      conditions.push("c.semver_num <= ?");
      sqlArgs.push(params.maxSemverNum);
    }

    if (params.docTypes && params.docTypes.length > 0) {
      const placeholders = params.docTypes.map(() => "?").join(", ");
      conditions.push(`c.doc_type IN (${placeholders})`);
      sqlArgs.push(...params.docTypes);
    }

    sqlArgs.push(params.topK);

    const sql = `
      SELECT
        c.chunk_uid,
        c.library,
        c.version,
        c.major_version,
        c.doc_type,
        c.is_breaking,
        c.codemod_command,
        c.section,
        c.source_url,
        c.git_tag,
        c.content,
        c.code_tokens,
        c.content_sha256,
        c.collected_at,
        bm25(doc_chunks_fts, 5.0, 3.0, 1.0) AS rank_score
      FROM doc_chunks_fts f
      JOIN doc_chunks c ON c.id = f.rowid
      WHERE ${conditions.join(" AND ")}
      ORDER BY rank_score ASC
      LIMIT ?
    `;

    const stmt = db.prepare(sql);
    return stmt.all(...sqlArgs) as unknown as FtsSearchResultRow[];
  };

  // Pass 1: Strict AND match
  const strictExpr = buildFtsMatchExpression(tokens, "AND");
  const strictRows = runWithExpr(strictExpr);
  if (strictRows.length > 0 || tokens.length === 1) {
    return {
      rows: strictRows.map((r) => ({
        ...r,
        rank_score: Math.round(Math.abs(r.rank_score) * 1000) / 1000,
      })),
      matchStrategy: "fts5_bm25_strict_and",
    };
  }

  // Pass 2: Relaxed OR match if strict AND returned 0 results
  const relaxedExpr = buildFtsMatchExpression(tokens, "OR");
  const relaxedRows = runWithExpr(relaxedExpr);
  return {
    rows: relaxedRows.map((r) => ({
      ...r,
      rank_score: Math.round(Math.abs(r.rank_score) * 1000) / 1000,
    })),
    matchStrategy: "fts5_bm25_relaxed_or",
  };
}
