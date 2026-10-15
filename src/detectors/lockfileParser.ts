import fs from "node:fs";
import path from "node:path";
import semver from "semver";
import YAML from "yaml";
import {
  DependencyResolution,
  LIBRARY_NPM_PACKAGE_MAP,
  SupportedLibrary,
} from "../types/common.js";
import { analyzeVersionSpec } from "../utils/versionUtils.js";

function cleanPnpmVersion(rawVersion: string): string | null {
  let cleaned = rawVersion.trim();
  if (cleaned.startsWith("link:") || cleaned.startsWith("file:")) {
    return null;
  }
  // Remove leading slash in pnpm v6 e.g. "/next@14.2.0(...)" or "/14.2.0"
  if (cleaned.startsWith("/")) {
    cleaned = cleaned.slice(1);
  }
  // Remove peer dependency suffix e.g. "15.0.3(@babel/core@7.26.0)" -> "15.0.3"
  const parenIdx = cleaned.indexOf("(");
  if (parenIdx !== -1) {
    cleaned = cleaned.slice(0, parenIdx);
  }
  // If formatted like "next@15.0.3", extract version after last @
  const lastAt = cleaned.lastIndexOf("@");
  if (lastAt > 0) {
    cleaned = cleaned.slice(lastAt + 1);
  }
  return semver.valid(cleaned);
}

function resolveFromNodeModules(
  projectPath: string,
  pkgName: string
): string | null {
  const dirsToCheck = [
    projectPath,
    path.resolve(projectPath, ".."),
    path.resolve(projectPath, "../.."),
  ];
  for (const dir of dirsToCheck) {
    const pkgJsonPath = path.join(dir, "node_modules", pkgName, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as {
          version?: string;
        };
        if (parsed.version && semver.valid(parsed.version)) {
          return parsed.version;
        }
      } catch {
        // ignore malformed package.json
      }
    }
  }
  return null;
}

function findFileUpwards(startDir: string, filename: string): string | null {
  const dirs = [
    startDir,
    path.resolve(startDir, ".."),
    path.resolve(startDir, "../.."),
  ];
  for (const dir of dirs) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveFromPackageLock(
  lockfilePath: string,
  pkgName: string
): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(lockfilePath, "utf8")) as {
      packages?: Record<string, { version?: string }>;
      dependencies?: Record<string, { version?: string }>;
    };
    const nodeModulesKey = `node_modules/${pkgName}`;
    if (data.packages && data.packages[nodeModulesKey]?.version) {
      const v = data.packages[nodeModulesKey].version!;
      if (semver.valid(v)) return v;
    }
    if (data.dependencies && data.dependencies[pkgName]?.version) {
      const v = data.dependencies[pkgName].version!;
      if (semver.valid(v)) return v;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function resolveFromPnpmLock(
  lockfilePath: string,
  projectPath: string,
  pkgName: string
): string | null {
  try {
    const content = fs.readFileSync(lockfilePath, "utf8");
    const parsed = YAML.parse(content) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;

    const lockDir = path.dirname(lockfilePath);
    const relImporter =
      path.relative(lockDir, projectPath).replace(/\\/g, "/") || ".";

    const extractFromDepMap = (
      depMap: Record<string, unknown> | undefined
    ): string | null => {
      if (!depMap || !(pkgName in depMap)) return null;
      const entry = depMap[pkgName];
      if (typeof entry === "string") {
        return cleanPnpmVersion(entry);
      }
      if (
        entry &&
        typeof entry === "object" &&
        "version" in entry &&
        typeof (entry as { version: unknown }).version === "string"
      ) {
        return cleanPnpmVersion((entry as { version: string }).version);
      }
      return null;
    };

    // Check importers[relImporter] or importers["."]
    if (parsed.importers && typeof parsed.importers === "object") {
      const importers = parsed.importers as Record<
        string,
        {
          dependencies?: Record<string, unknown>;
          devDependencies?: Record<string, unknown>;
        }
      >;
      const targetImporter = importers[relImporter] ?? importers["."];
      if (targetImporter) {
        const fromDeps =
          extractFromDepMap(targetImporter.dependencies) ??
          extractFromDepMap(targetImporter.devDependencies);
        if (fromDeps) return fromDeps;
      }
    }

    // Check root dependencies / devDependencies (pnpm v6 single-project format)
    const fromRoot =
      extractFromDepMap(
        parsed.dependencies as Record<string, unknown> | undefined
      ) ??
      extractFromDepMap(
        parsed.devDependencies as Record<string, unknown> | undefined
      );
    if (fromRoot) return fromRoot;

    // Fallback: scan packages keys e.g. "next@15.0.3" or "/next@15.0.3"
    if (parsed.packages && typeof parsed.packages === "object") {
      for (const key of Object.keys(parsed.packages)) {
        const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
        if (normalizedKey.startsWith(`${pkgName}@`)) {
          const ver = cleanPnpmVersion(normalizedKey);
          if (ver) return ver;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function resolveFromYarnLock(
  lockfilePath: string,
  pkgName: string
): string | null {
  try {
    const content = fs.readFileSync(lockfilePath, "utf8");
    const escapedPkg = pkgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match both Yarn Classic ("pkg@^1.0.0": \n version "1.2.3") and Yarn Berry ("pkg@npm:^1.0.0": \n version: 1.2.3)
    const regex = new RegExp(
      `(?:^|\\n)["']?${escapedPkg}@(?:npm:)?[^"':\\n]+["']?:[^\\n]*\\n(?:\\s+[^\\n]+\\n)*?\\s+version:?\\s+["']?([0-9]+\\.[0-9]+\\.[0-9]+[^"'\\s]*)["']?`,
      "m"
    );
    const match = content.match(regex);
    if (match && match[1] && semver.valid(match[1])) {
      return match[1];
    }
  } catch {
    // ignore
  }
  return null;
}

export function resolveFromBunLock(
  lockfilePath: string,
  pkgName: string
): string | null {
  try {
    const raw = fs.readFileSync(lockfilePath, "utf8");
    // bun.lock is JSONC (may contain trailing commas)
    const sanitized = raw.replace(/,(\s*[}\]])/g, "$1");
    const parsed = JSON.parse(sanitized) as {
      packages?: Record<string, unknown[]>;
    };
    const entry = parsed.packages?.[pkgName];
    if (Array.isArray(entry) && typeof entry[0] === "string") {
      // Format: "next@15.0.3"
      const spec = entry[0];
      const atIdx = spec.lastIndexOf("@");
      if (atIdx > 0) {
        const ver = spec.slice(atIdx + 1);
        if (semver.valid(ver)) return ver;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function resolveWorkspaceCatalogRange(
  projectPath: string,
  pkgName: string,
  rawRange: string
): string | null {
  if (rawRange.startsWith("catalog:")) {
    const workspaceYamlPath = findFileUpwards(
      projectPath,
      "pnpm-workspace.yaml"
    );
    if (workspaceYamlPath) {
      try {
        const ws = YAML.parse(fs.readFileSync(workspaceYamlPath, "utf8")) as {
          catalog?: Record<string, string>;
          catalogs?: Record<string, Record<string, string>>;
        };
        const catalogName = rawRange.slice("catalog:".length).trim();
        if (!catalogName && ws.catalog?.[pkgName]) {
          return ws.catalog[pkgName];
        }
        if (catalogName && ws.catalogs?.[catalogName]?.[pkgName]) {
          return ws.catalogs[catalogName][pkgName];
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export function resolveProjectDependencies(
  projectPath: string,
  pkgJson: Record<string, unknown> | null
): Record<string, DependencyResolution> {
  const result: Record<string, DependencyResolution> = {};
  if (!pkgJson) return result;

  const deps = (pkgJson.dependencies as Record<string, string> | undefined) ?? {};
  const devDeps =
    (pkgJson.devDependencies as Record<string, string> | undefined) ?? {};

  const pnpmLockPath = findFileUpwards(projectPath, "pnpm-lock.yaml");
  const bunLockPath = findFileUpwards(projectPath, "bun.lock");
  const yarnLockPath = findFileUpwards(projectPath, "yarn.lock");
  const pkgLockPath = findFileUpwards(projectPath, "package-lock.json");
  const shrinkwrapPath = findFileUpwards(projectPath, "npm-shrinkwrap.json");

  for (const [libKey, npmPackages] of Object.entries(
    LIBRARY_NPM_PACKAGE_MAP
  ) as Array<[SupportedLibrary, string[]]>) {
    if (libKey === "node") continue;

    for (const pkgName of npmPackages) {
      const inProd = pkgName in deps;
      const inDev = pkgName in devDeps;
      if (!inProd && !inDev) continue;

      const declaredRange = inProd ? deps[pkgName] : devDeps[pkgName];
      const isDev = !inProd && inDev;

      // Priority 1: node_modules/<pkg>/package.json
      const nmVersion = resolveFromNodeModules(projectPath, pkgName);
      if (nmVersion) {
        result[pkgName] = {
          package_name: pkgName,
          library_id: libKey,
          declared_range: declaredRange,
          resolved_version: nmVersion,
          resolution_source: "node_modules",
          is_dev: isDev,
        };
        continue;
      }

      // Priority 2: Lockfiles (pnpm -> bun -> yarn -> npm)
      if (pnpmLockPath) {
        const locked = resolveFromPnpmLock(pnpmLockPath, projectPath, pkgName);
        if (locked) {
          result[pkgName] = {
            package_name: pkgName,
            library_id: libKey,
            declared_range: declaredRange,
            resolved_version: locked,
            resolution_source: "pnpm-lock.yaml",
            is_dev: isDev,
          };
          continue;
        }
      }

      if (bunLockPath) {
        const locked = resolveFromBunLock(bunLockPath, pkgName);
        if (locked) {
          result[pkgName] = {
            package_name: pkgName,
            library_id: libKey,
            declared_range: declaredRange,
            resolved_version: locked,
            resolution_source: "bun.lock",
            is_dev: isDev,
          };
          continue;
        }
      }

      if (yarnLockPath) {
        const locked = resolveFromYarnLock(yarnLockPath, pkgName);
        if (locked) {
          result[pkgName] = {
            package_name: pkgName,
            library_id: libKey,
            declared_range: declaredRange,
            resolved_version: locked,
            resolution_source: "yarn.lock",
            is_dev: isDev,
          };
          continue;
        }
      }

      if (pkgLockPath) {
        const locked = resolveFromPackageLock(pkgLockPath, pkgName);
        if (locked) {
          result[pkgName] = {
            package_name: pkgName,
            library_id: libKey,
            declared_range: declaredRange,
            resolved_version: locked,
            resolution_source: "package-lock.json",
            is_dev: isDev,
          };
          continue;
        }
      }

      if (shrinkwrapPath) {
        const locked = resolveFromPackageLock(shrinkwrapPath, pkgName);
        if (locked) {
          result[pkgName] = {
            package_name: pkgName,
            library_id: libKey,
            declared_range: declaredRange,
            resolved_version: locked,
            resolution_source: "npm-shrinkwrap.json",
            is_dev: isDev,
          };
          continue;
        }
      }

      // Priority 3: Declared range analysis (including pnpm catalog lookup)
      const catalogResolved = resolveWorkspaceCatalogRange(
        projectPath,
        pkgName,
        declaredRange
      );
      const specToAnalyze = catalogResolved ?? declaredRange;
      const specAnalysis = analyzeVersionSpec(specToAnalyze);

      if (specAnalysis.status === "exact") {
        result[pkgName] = {
          package_name: pkgName,
          library_id: libKey,
          declared_range: declaredRange,
          resolved_version: specAnalysis.resolvedVersion,
          resolution_source: catalogResolved
            ? "workspace_catalog"
            : "declared_range_exact",
          is_dev: isDev,
        };
      } else if (specAnalysis.status === "single_major_range") {
        result[pkgName] = {
          package_name: pkgName,
          library_id: libKey,
          declared_range: declaredRange,
          resolved_version: specAnalysis.resolvedVersion,
          resolution_source: catalogResolved
            ? "workspace_catalog"
            : "declared_range_min",
          is_dev: isDev,
          note: `No lockfile or node_modules entry found for ${pkgName}; resolved to minimum satisfying version (${specAnalysis.resolvedVersion}) of range "${specToAnalyze}".`,
        };
      } else {
        result[pkgName] = {
          package_name: pkgName,
          library_id: libKey,
          declared_range: declaredRange,
          resolved_version: null,
          resolution_source: "ambiguous_range",
          is_dev: isDev,
          note:
            specAnalysis.reason ??
            `Range "${declaredRange}" cannot be deterministically resolved without a lockfile.`,
        };
      }
    }
  }

  return result;
}
