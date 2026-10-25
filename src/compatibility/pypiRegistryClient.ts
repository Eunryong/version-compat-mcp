import fs from "node:fs";
import path from "node:path";
import { ensureCacheSubdir } from "../cache/paths.js";
import { logger } from "../utils/logger.js";

export interface PypiReleaseFile {
  requires_python?: string | null;
  yanked?: boolean;
  filename?: string;
}

export interface PypiPackageMeta {
  info: {
    name: string;
    version: string;
    requires_python?: string | null;
    summary?: string;
    yanked?: boolean;
    yanked_reason?: string | null;
  };
  releases: Record<string, PypiReleaseFile[]>;
}

interface DiskCacheEntry {
  etag?: string;
  cachedAtMs: number;
  data: PypiPackageMeta;
}

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour TTL
const memoryCache = new Map<string, DiskCacheEntry>();

function getPypiCacheFilePath(pkgName: string): string {
  const dir = ensureCacheSubdir("pypi_registry");
  const safeName = pkgName.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  return path.join(dir, `${safeName}.json`);
}

export async function fetchPypiPackageMeta(
  pkgName: string,
  timeoutMs = 6000
): Promise<PypiPackageMeta | null> {
  const normalizedName = pkgName.trim().toLowerCase();
  const now = Date.now();
  const memEntry = memoryCache.get(normalizedName);
  if (memEntry && now - memEntry.cachedAtMs < CACHE_TTL_MS) {
    return memEntry.data;
  }

  const cacheFile = getPypiCacheFilePath(normalizedName);
  let diskEntry: DiskCacheEntry | null = null;

  if (fs.existsSync(cacheFile)) {
    try {
      diskEntry = JSON.parse(
        fs.readFileSync(cacheFile, "utf8")
      ) as DiskCacheEntry;
      if (now - diskEntry.cachedAtMs < CACHE_TTL_MS) {
        memoryCache.set(normalizedName, diskEntry);
        return diskEntry.data;
      }
    } catch {
      diskEntry = null;
    }
  }

  const url = `https://pypi.org/pypi/${encodeURIComponent(normalizedName)}/json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "version-compat-mcp/0.2.0",
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
      memoryCache.set(normalizedName, diskEntry);
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(diskEntry), "utf8");
      } catch {
        // ignore write error
      }
      return diskEntry.data;
    }

    if (!res.ok) {
      logger.warn(`PyPI registry returned ${res.status} for ${normalizedName}`);
      return diskEntry?.data ?? null;
    }

    const data = (await res.json()) as PypiPackageMeta;
    const newEntry: DiskCacheEntry = {
      etag: res.headers.get("etag") ?? undefined,
      cachedAtMs: now,
      data,
    };

    memoryCache.set(normalizedName, newEntry);
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(newEntry), "utf8");
    } catch {
      // ignore write error
    }

    return data;
  } catch (err) {
    logger.warn(`Failed to fetch PyPI metadata for ${normalizedName}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return diskEntry?.data ?? null;
  } finally {
    clearTimeout(timer);
  }
}
