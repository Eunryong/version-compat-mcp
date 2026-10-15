import fs from "node:fs";
import path from "node:path";
import { ensureCacheSubdir } from "../cache/paths.js";
import { logger } from "../utils/logger.js";

export interface NpmVersionAbbreviatedMeta {
  name: string;
  version: string;
  deprecated?: string;
  engines?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

export interface NpmPackageAbbreviatedMeta {
  name: string;
  "dist-tags": Record<string, string>;
  versions: Record<string, NpmVersionAbbreviatedMeta>;
}

interface DiskCacheEntry {
  etag?: string;
  cachedAtMs: number;
  data: NpmPackageAbbreviatedMeta;
}

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour TTL for abbreviated metadata
const memoryCache = new Map<string, DiskCacheEntry>();

function getPackageCacheFilePath(pkgName: string): string {
  const dir = ensureCacheSubdir("registry");
  const safeName = pkgName.replace(/\//g, "__").replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(dir, `${safeName}.json`);
}

export async function fetchNpmPackageMeta(
  pkgName: string,
  timeoutMs = 6000
): Promise<NpmPackageAbbreviatedMeta | null> {
  const now = Date.now();
  const memEntry = memoryCache.get(pkgName);
  if (memEntry && now - memEntry.cachedAtMs < CACHE_TTL_MS) {
    return memEntry.data;
  }

  const cacheFile = getPackageCacheFilePath(pkgName);
  let diskEntry: DiskCacheEntry | null = null;

  if (fs.existsSync(cacheFile)) {
    try {
      diskEntry = JSON.parse(
        fs.readFileSync(cacheFile, "utf8")
      ) as DiskCacheEntry;
      if (now - diskEntry.cachedAtMs < CACHE_TTL_MS) {
        memoryCache.set(pkgName, diskEntry);
        return diskEntry.data;
      }
    } catch {
      diskEntry = null;
    }
  }

  const encodedPkg = pkgName.startsWith("@")
    ? `@${encodeURIComponent(pkgName.slice(1))}`
    : encodeURIComponent(pkgName);
  const url = `https://registry.npmjs.org/${encodedPkg}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.npm.install-v1+json",
      "User-Agent": "version-compat-mcp/0.1.0",
    };
    if (diskEntry?.etag) {
      headers["If-None-Match"] = diskEntry.etag;
    }

    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if (res.status === 304 && diskEntry) {
      diskEntry.cachedAtMs = now;
      memoryCache.set(pkgName, diskEntry);
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(diskEntry), "utf8");
      } catch {
        // ignore cache write failure
      }
      return diskEntry.data;
    }

    if (!res.ok) {
      logger.warn(`npm registry returned ${res.status} for ${pkgName}`);
      return diskEntry?.data ?? null;
    }

    const data = (await res.json()) as NpmPackageAbbreviatedMeta;
    const newEntry: DiskCacheEntry = {
      etag: res.headers.get("etag") ?? undefined,
      cachedAtMs: now,
      data,
    };

    memoryCache.set(pkgName, newEntry);
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(newEntry), "utf8");
    } catch {
      // ignore cache write failure
    }

    return data;
  } catch (err) {
    logger.warn(`Failed to fetch npm registry metadata for ${pkgName}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    // Fallback to stale disk cache if available
    return diskEntry?.data ?? null;
  } finally {
    clearTimeout(timer);
  }
}
