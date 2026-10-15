import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import {
  computeFileSha256,
  IndexManifest,
} from "../src/cache/indexManager.js";
import { INDEX_DDL } from "../src/retrieval/dbClient.js";
import { semverToNum } from "../src/utils/versionUtils.js";
import { chunkMarkdownDocument } from "./chunkers/markdownAstChunker.js";
import {
  INDEXED_VERSIONS_SEED,
  RAW_DOCUMENT_SNAPSHOTS,
  SETUP_TEMPLATES_SEED,
} from "./curatedCorpus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SEED_DIR = path.join(ROOT_DIR, "seed");

function buildIndex(): void {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  const dbPath = path.join(SEED_DIR, "index-js-ts.db");
  const gzPath = path.join(SEED_DIR, "index-js-ts.db.gz");
  const manifestPath = path.join(SEED_DIR, "manifest.json");

  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec(INDEX_DDL);
  // Use DELETE journal mode before closing so the single .db file is self-contained without -wal/-shm sidecars
  db.exec("PRAGMA journal_mode = DELETE;");

  const nowIso = new Date().toISOString();

  // 1. Insert index metadata
  const insertMeta = db.prepare(
    `INSERT OR REPLACE INTO index_metadata (key, value) VALUES (?, ?)`
  );
  insertMeta.run("schema_version", "1");
  insertMeta.run("collection_id", "js-ts");
  insertMeta.run("embedding_model", "none");
  insertMeta.run("embedding_dim", "0");
  insertMeta.run("generated_at", nowIso);

  // 2. Insert indexed versions
  const insertVer = db.prepare(`
    INSERT INTO indexed_versions (
      library, version, major, minor, patch, semver_num, git_tag, release_date, required_node
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const v of INDEXED_VERSIONS_SEED) {
    const num = semverToNum(v.version) ?? v.major * 1_000_000;
    insertVer.run(
      v.library,
      v.version,
      v.major,
      v.minor,
      v.patch,
      num,
      v.git_tag,
      v.release_date,
      v.required_node
    );
  }

  // 3. Insert setup templates
  const insertTemplate = db.prepare(`
    INSERT INTO setup_templates (
      library, major_version, version, framework_context, required_node,
      install_commands_json, config_examples_json, obsolete_patterns_json,
      source_url, git_tag
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const tpl of SETUP_TEMPLATES_SEED) {
    insertTemplate.run(
      tpl.library,
      tpl.major_version,
      tpl.version,
      tpl.framework_context,
      tpl.required_node,
      JSON.stringify(tpl.install_commands),
      JSON.stringify(tpl.config_examples),
      JSON.stringify(tpl.obsolete_patterns),
      tpl.source_url,
      tpl.git_tag
    );
  }

  // 4. Chunk & insert documents
  const insertChunk = db.prepare(`
    INSERT INTO doc_chunks (
      chunk_uid, collection_id, library, version, major_version, semver_num,
      doc_type, is_breaking, codemod_command, framework_context,
      section, content, code_tokens, source_url, git_tag, content_sha256, collected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalChunks = 0;
  const chunkCountByLibrary: Record<string, number> = {};

  for (const snapshot of RAW_DOCUMENT_SNAPSHOTS) {
    const chunks = chunkMarkdownDocument(snapshot);
    for (const chunk of chunks) {
      insertChunk.run(
        chunk.chunk_uid,
        chunk.collection_id,
        chunk.library,
        chunk.version,
        chunk.major_version,
        chunk.semver_num,
        chunk.doc_type,
        chunk.is_breaking ? 1 : 0,
        snapshot.codemod_command ?? null,
        chunk.framework_context,
        chunk.section,
        chunk.content,
        chunk.code_tokens,
        chunk.source_url,
        chunk.git_tag,
        chunk.content_sha256,
        chunk.collected_at
      );
      totalChunks++;
      chunkCountByLibrary[chunk.library] =
        (chunkCountByLibrary[chunk.library] ?? 0) + 1;
    }
  }

  // Optimize FTS5 index and compact DB
  db.exec(`INSERT INTO doc_chunks_fts(doc_chunks_fts) VALUES('optimize');`);
  db.exec(`VACUUM;`);
  db.exec(`ANALYZE;`);
  db.close();

  // Quality gate: verify all 7 libraries have chunks
  const requiredLibs = [
    "tailwindcss",
    "eslint",
    "nextjs",
    "react",
    "vite",
    "typescript",
    "node",
  ];
  for (const lib of requiredLibs) {
    if (!chunkCountByLibrary[lib] || chunkCountByLibrary[lib] < 1) {
      throw new Error(
        `Quality gate failed: library "${lib}" has 0 indexed chunks!`
      );
    }
  }

  // Generate compressed .gz and manifest.json
  const rawBuffer = fs.readFileSync(dbPath);
  const gzBuffer = zlib.gzipSync(rawBuffer, { level: 9 });
  fs.writeFileSync(gzPath, gzBuffer);

  const sha256 = computeFileSha256(dbPath);

  const librariesManifest: IndexManifest["collections"]["js-ts"]["libraries"] =
    {};
  for (const v of INDEXED_VERSIONS_SEED) {
    if (!librariesManifest[v.library]) {
      librariesManifest[v.library] = {
        majors: [],
        latest_indexed: v.version,
      };
    }
    if (!librariesManifest[v.library].majors.includes(v.major)) {
      librariesManifest[v.library].majors.push(v.major);
    }
    librariesManifest[v.library].latest_indexed = v.version;
  }

  const manifest: IndexManifest = {
    manifest_version: 1,
    generated_at: nowIso,
    min_client_version: "0.1.0",
    embedding_config: {
      enabled: false,
      model_name: "Xenova/bge-small-en-v1.5",
      model_revision: "main",
      dimensions: 384,
      distance_metric: "cosine",
    },
    collections: {
      "js-ts": {
        version: "2026.10.15.1",
        download_url:
          "https://github.com/Eunryong/Version-Aware-Setup/releases/download/index-v1/index-js-ts.db.gz",
        compressed_size_bytes: gzBuffer.byteLength,
        uncompressed_size_bytes: rawBuffer.byteLength,
        uncompressed_sha256: sha256,
        libraries: librariesManifest,
      },
    },
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.error(
    `[indexer] Built seed/index-js-ts.db (${rawBuffer.byteLength} bytes, gz: ${gzBuffer.byteLength} bytes, chunks: ${totalChunks}, sha256: ${sha256.slice(0, 16)}...)`
  );
}

buildIndex();
