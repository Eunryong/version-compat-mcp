import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function getCacheDir(): string {
  if (process.env.SETUP_GUARD_CACHE_DIR) {
    return process.env.SETUP_GUARD_CACHE_DIR;
  }

  if (process.platform === "win32") {
    const localAppData =
      process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "setup-guard-mcp");
  }

  const xdgCache = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
  return path.join(xdgCache, "setup-guard-mcp");
}

export function ensureCacheSubdir(subdir?: string): string {
  const base = getCacheDir();
  const target = subdir ? path.join(base, subdir) : base;
  fs.mkdirSync(target, { recursive: true });
  return target;
}
