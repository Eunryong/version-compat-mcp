import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { logger } from "../utils/logger.js";
import { ensureCacheSubdir } from "./paths.js";

export interface CollectionManifestEntry {
  version: string;
  download_url: string;
  compressed_size_bytes: number;
  uncompressed_size_bytes: number;
  uncompressed_sha256: string;
  libraries: Record<
    string,
    {
      majors: number[];
      latest_indexed: string;
    }
  >;
}

export interface IndexManifest {
  manifest_version: number;
  generated_at: string;
  min_client_version: string;
  embedding_config: {
    enabled: boolean;
    model_name: string;
    model_revision: string;
    dimensions: number;
    distance_metric: "cosine" | "l2";
  };
  collections: Record<string, CollectionManifestEntry>;
}

export interface ResolvedIndexInfo {
  dbPath: string;
  source: "remote_cache" | "bundled_seed";
  collectionId: string;
  sha256Verified: boolean;
  vectorSearchAllowed: boolean;
  manifest: IndexManifest | null;
}

const DEFAULT_MANIFEST_URL =
  process.env.SETUP_GUARD_MANIFEST_URL ||
  "https://github.com/Eunryong/Version-Aware-Setup/releases/download/index-v1/manifest.json";

const EXPECTED_LOCAL_EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
const EXPECTED_LOCAL_EMBEDDING_DIM = 384;

let resolvedIndexPromise: Promise<ResolvedIndexInfo> | null = null;

export function computeFileSha256(filePath: string): string {
  const hash = crypto.createHash("sha256");
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest("hex");
}

function getBundledSeedDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const pkgRoot = path.resolve(path.dirname(currentFile), "../..");
  return path.join(pkgRoot, "seed");
}

function loadBundledFallback(collectionId = "js-ts"): ResolvedIndexInfo {
  const seedDir = getBundledSeedDir();
  const seedDbPath = path.join(seedDir, `index-${collectionId}.db`);
  const seedManifestPath = path.join(seedDir, "manifest.json");

  let manifest: IndexManifest | null = null;
  let sha256Verified = false;
  let vectorSearchAllowed = false;

  if (fs.existsSync(seedManifestPath)) {
    try {
      manifest = JSON.parse(
        fs.readFileSync(seedManifestPath, "utf8")
      ) as IndexManifest;
      const expectedHash =
        manifest.collections?.[collectionId]?.uncompressed_sha256;
      if (expectedHash && fs.existsSync(seedDbPath)) {
        const actualHash = computeFileSha256(seedDbPath);
        sha256Verified = actualHash === expectedHash;
      }
      if (
        manifest.embedding_config?.enabled &&
        manifest.embedding_config.model_name === EXPECTED_LOCAL_EMBEDDING_MODEL &&
        manifest.embedding_config.dimensions === EXPECTED_LOCAL_EMBEDDING_DIM
      ) {
        vectorSearchAllowed = true;
      }
    } catch (err) {
      logger.warn("Failed to parse bundled seed manifest.json", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    dbPath: seedDbPath,
    source: "bundled_seed",
    collectionId,
    sha256Verified,
    vectorSearchAllowed,
    manifest,
  };
}

async function resolveIndexInternal(
  collectionId = "js-ts"
): Promise<ResolvedIndexInfo> {
  const cacheDir = ensureCacheSubdir("indices");
  const cachedDbPath = path.join(cacheDir, `index-${collectionId}.db`);
  const cachedManifestPath = path.join(cacheDir, "manifest.json");

  // If offline mode is explicitly requested or in tests, use bundled seed if valid
  if (process.env.SETUP_GUARD_OFFLINE === "1") {
    const seed = loadBundledFallback(collectionId);
    if (fs.existsSync(seed.dbPath)) {
      return seed;
    }
  }

  // Try remote manifest check with short timeout (2.5s) so it never stalls tool execution
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(DEFAULT_MANIFEST_URL, {
      headers: { "User-Agent": "setup-guard-mcp/0.1.0" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const remoteManifest = (await res.json()) as IndexManifest;
      const collectionMeta = remoteManifest.collections?.[collectionId];

      if (collectionMeta) {
        // Check if existing cached DB already matches SHA-256
        if (fs.existsSync(cachedDbPath)) {
          const currentHash = computeFileSha256(cachedDbPath);
          if (currentHash === collectionMeta.uncompressed_sha256) {
            fs.writeFileSync(
              cachedManifestPath,
              JSON.stringify(remoteManifest, null, 2),
              "utf8"
            );
            return {
              dbPath: cachedDbPath,
              source: "remote_cache",
              collectionId,
              sha256Verified: true,
              vectorSearchAllowed:
                remoteManifest.embedding_config.enabled &&
                remoteManifest.embedding_config.model_name ===
                  EXPECTED_LOCAL_EMBEDDING_MODEL &&
                remoteManifest.embedding_config.dimensions ===
                  EXPECTED_LOCAL_EMBEDDING_DIM,
              manifest: remoteManifest,
            };
          }
        }

        // Download compressed or uncompressed DB to temporary path
        const dlController = new AbortController();
        const dlTimer = setTimeout(() => dlController.abort(), 8000);
        const dlRes = await fetch(collectionMeta.download_url, {
          headers: { "User-Agent": "setup-guard-mcp/0.1.0" },
          signal: dlController.signal,
        });
        clearTimeout(dlTimer);

        if (dlRes.ok) {
          const arrayBuf = await dlRes.arrayBuffer();
          const rawBuf = Buffer.from(arrayBuf);
          const dbBuf = collectionMeta.download_url.endsWith(".gz")
            ? zlib.gunzipSync(rawBuf)
            : rawBuf;

          const tmpPath = `${cachedDbPath}.tmp.${process.pid}`;
          fs.writeFileSync(tmpPath, dbBuf);

          const downloadedHash = computeFileSha256(tmpPath);
          if (downloadedHash === collectionMeta.uncompressed_sha256) {
            fs.renameSync(tmpPath, cachedDbPath);
            fs.writeFileSync(
              cachedManifestPath,
              JSON.stringify(remoteManifest, null, 2),
              "utf8"
            );
            return {
              dbPath: cachedDbPath,
              source: "remote_cache",
              collectionId,
              sha256Verified: true,
              vectorSearchAllowed:
                remoteManifest.embedding_config.enabled &&
                remoteManifest.embedding_config.model_name ===
                  EXPECTED_LOCAL_EMBEDDING_MODEL &&
                remoteManifest.embedding_config.dimensions ===
                  EXPECTED_LOCAL_EMBEDDING_DIM,
              manifest: remoteManifest,
            };
          } else {
            logger.error(
              `Downloaded index SHA-256 mismatch! Expected ${collectionMeta.uncompressed_sha256}, got ${downloadedHash}`
            );
            fs.rmSync(tmpPath, { force: true });
          }
        }
      }
    }
  } catch (err) {
    logger.info(
      "Remote index fetch skipped or unreachable; using local cache or bundled seed.",
      {
        reason: err instanceof Error ? err.message : String(err),
      }
    );
  }

  // Fallback 1: Previously cached remote DB if its SHA-256 matches cached manifest
  if (fs.existsSync(cachedDbPath) && fs.existsSync(cachedManifestPath)) {
    try {
      const cachedManifest = JSON.parse(
        fs.readFileSync(cachedManifestPath, "utf8")
      ) as IndexManifest;
      const expected =
        cachedManifest.collections?.[collectionId]?.uncompressed_sha256;
      const actual = computeFileSha256(cachedDbPath);
      if (expected && actual === expected) {
        return {
          dbPath: cachedDbPath,
          source: "remote_cache",
          collectionId,
          sha256Verified: true,
          vectorSearchAllowed:
            cachedManifest.embedding_config.enabled &&
            cachedManifest.embedding_config.model_name ===
              EXPECTED_LOCAL_EMBEDDING_MODEL,
          manifest: cachedManifest,
        };
      }
    } catch {
      // ignore and fall back to bundled seed
    }
  }

  // Fallback 2: Bundled prebuilt seed index in seed/index-js-ts.db
  return loadBundledFallback(collectionId);
}

/**
 * Starts index resolution asynchronously in the background.
 * Safe to call during MCP server startup without blocking initialize handshake.
 */
export function prefetchIndexInBackground(): void {
  if (!resolvedIndexPromise) {
    resolvedIndexPromise = resolveIndexInternal("js-ts");
  }
}

export async function getResolvedIndex(): Promise<ResolvedIndexInfo> {
  if (!resolvedIndexPromise) {
    resolvedIndexPromise = resolveIndexInternal("js-ts");
  }
  return resolvedIndexPromise;
}

export function resetIndexCacheForTests(): void {
  resolvedIndexPromise = null;
}
