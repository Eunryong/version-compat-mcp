import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { getResolvedIndex, ResolvedIndexInfo } from "../cache/indexManager.js";

export const INDEX_DDL = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS index_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS indexed_versions (
    library TEXT NOT NULL,
    version TEXT NOT NULL,
    major INTEGER NOT NULL,
    minor INTEGER NOT NULL,
    patch INTEGER NOT NULL,
    semver_num INTEGER NOT NULL,
    git_tag TEXT NOT NULL,
    release_date TEXT,
    required_node TEXT,
    PRIMARY KEY (library, version)
);

CREATE INDEX IF NOT EXISTS idx_versions_lookup
ON indexed_versions(library, major, semver_num DESC);

CREATE TABLE IF NOT EXISTS setup_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library TEXT NOT NULL,
    major_version INTEGER NOT NULL,
    version TEXT NOT NULL,
    framework_context TEXT NOT NULL DEFAULT 'standalone',
    required_node TEXT,
    install_commands_json TEXT NOT NULL,
    config_examples_json TEXT NOT NULL,
    obsolete_patterns_json TEXT NOT NULL,
    source_url TEXT NOT NULL,
    git_tag TEXT NOT NULL,
    UNIQUE(library, major_version, framework_context)
);

CREATE TABLE IF NOT EXISTS doc_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk_uid TEXT NOT NULL UNIQUE,
    collection_id TEXT NOT NULL DEFAULT 'js-ts',
    library TEXT NOT NULL,
    version TEXT NOT NULL,
    major_version INTEGER NOT NULL,
    semver_num INTEGER NOT NULL,
    doc_type TEXT NOT NULL CHECK(doc_type IN ('migration_guide', 'release_note', 'deprecation', 'setup_guide')),
    is_breaking INTEGER NOT NULL DEFAULT 0,
    codemod_command TEXT,
    framework_context TEXT,
    section TEXT NOT NULL,
    content TEXT NOT NULL,
    code_tokens TEXT NOT NULL,
    source_url TEXT NOT NULL,
    git_tag TEXT NOT NULL,
    content_sha256 TEXT NOT NULL,
    collected_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_filter
ON doc_chunks(library, major_version, doc_type);

CREATE INDEX IF NOT EXISTS idx_chunks_semver
ON doc_chunks(library, semver_num);

CREATE VIRTUAL TABLE IF NOT EXISTS doc_chunks_fts USING fts5(
    section,
    code_tokens,
    content,
    content='doc_chunks',
    content_rowid='id',
    tokenize="unicode61 tokenchars '@/_-.'"
);

CREATE TRIGGER IF NOT EXISTS doc_chunks_ai AFTER INSERT ON doc_chunks BEGIN
    INSERT INTO doc_chunks_fts(rowid, section, code_tokens, content)
    VALUES (new.id, new.section, new.code_tokens, new.content);
END;
`;

let cachedDb: DatabaseSync | null = null;
let cachedDbPath: string | null = null;

export async function getIndexDatabase(): Promise<{
  db: DatabaseSync;
  indexInfo: ResolvedIndexInfo;
}> {
  const indexInfo = await getResolvedIndex();
  if (!fs.existsSync(indexInfo.dbPath)) {
    throw new Error(
      `Index database file not found at ${indexInfo.dbPath}. Run 'npm run build:index' to generate it.`
    );
  }

  if (cachedDb && cachedDbPath === indexInfo.dbPath) {
    return { db: cachedDb, indexInfo };
  }

  if (cachedDb) {
    try {
      cachedDb.close();
    } catch {
      // ignore
    }
  }

  cachedDb = new DatabaseSync(indexInfo.dbPath, { open: true, readOnly: true });
  cachedDbPath = indexInfo.dbPath;
  return { db: cachedDb, indexInfo };
}
