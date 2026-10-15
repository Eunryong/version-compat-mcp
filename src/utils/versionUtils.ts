import semver from "semver";
import { SUPPORTED_LIBRARIES, SupportedLibrary } from "../types/common.js";

const ALIAS_MAP: Record<string, SupportedLibrary> = {
  node: "node",
  nodejs: "node",
  "node.js": "node",
  typescript: "typescript",
  ts: "typescript",
  react: "react",
  "react-dom": "react",
  next: "nextjs",
  nextjs: "nextjs",
  "next.js": "nextjs",
  vite: "vite",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  "@tailwindcss/vite": "tailwindcss",
  "@tailwindcss/postcss": "tailwindcss",
  eslint: "eslint",
  "@eslint/js": "eslint",
};

export function normalizeLibraryName(raw: string): SupportedLibrary | null {
  const cleaned = raw.trim().toLowerCase();
  if (cleaned in ALIAS_MAP) {
    return ALIAS_MAP[cleaned];
  }
  if ((SUPPORTED_LIBRARIES as readonly string[]).includes(cleaned)) {
    return cleaned as SupportedLibrary;
  }
  return null;
}

export function getPrimaryNpmPackage(library: SupportedLibrary): string {
  switch (library) {
    case "nextjs":
      return "next";
    case "node":
      return "node";
    default:
      return library;
  }
}

export function semverToNum(version: string): number | null {
  const parsed = semver.parse(version, { loose: true });
  if (!parsed) {
    const coerced = semver.coerce(version);
    if (!coerced) return null;
    return coerced.major * 1_000_000 + coerced.minor * 1_000 + coerced.patch;
  }
  return parsed.major * 1_000_000 + parsed.minor * 1_000 + parsed.patch;
}

export interface ParsedVersionSpec {
  status: "exact" | "single_major_range" | "ambiguous" | "protocol";
  resolvedVersion: string | null;
  major: number | null;
  raw: string;
  reason?: string;
}

const AMBIGUOUS_TAGS = new Set([
  "latest",
  "*",
  "x",
  "X",
  "next",
  "canary",
  "beta",
  "alpha",
  "rc",
  "",
]);

export function analyzeVersionSpec(rawSpec: string): ParsedVersionSpec {
  const raw = rawSpec.trim();

  if (AMBIGUOUS_TAGS.has(raw.toLowerCase())) {
    return {
      status: "ambiguous",
      resolvedVersion: null,
      major: null,
      raw,
      reason: `Spec "${raw}" is a floating tag or wildcard without a concrete major version.`,
    };
  }

  if (
    raw.startsWith("workspace:") ||
    raw.startsWith("catalog:") ||
    raw.startsWith("file:") ||
    raw.startsWith("link:") ||
    raw.startsWith("git+") ||
    raw.startsWith("github:") ||
    raw.startsWith("http:") ||
    raw.startsWith("https:")
  ) {
    return {
      status: "protocol",
      resolvedVersion: null,
      major: null,
      raw,
      reason: `Spec "${raw}" uses a non-semver protocol.`,
    };
  }

  // Strip leading 'v' if exact version like "v20.11.0"
  const cleanExact = semver.clean(raw);
  if (cleanExact) {
    const parsed = semver.parse(cleanExact);
    if (parsed) {
      return {
        status: "exact",
        resolvedVersion: parsed.version,
        major: parsed.major,
        raw,
      };
    }
  }

  // Check if it is a valid semver range (e.g. "^15.0.0", "~4.0.0", "15.x", "15")
  const validRange = semver.validRange(raw);
  if (!validRange || validRange === "*") {
    return {
      status: "ambiguous",
      resolvedVersion: null,
      major: null,
      raw,
      reason: `Spec "${raw}" cannot be resolved to a specific major version.`,
    };
  }

  // If raw contains "||", check if multiple majors are spanned
  const minVer = semver.minVersion(validRange);
  if (!minVer) {
    return {
      status: "ambiguous",
      resolvedVersion: null,
      major: null,
      raw,
      reason: `Could not compute minimum version for range "${raw}".`,
    };
  }

  // Test if next major satisfies this range (meaning the range spans multiple majors)
  const nextMajorProbe = `${minVer.major + 1}.0.0`;
  const prevMajorProbe = minVer.major > 0 ? `${minVer.major - 1}.99.99` : null;
  const spansNextMajor = semver.satisfies(nextMajorProbe, validRange);
  const spansPrevMajor = prevMajorProbe
    ? semver.satisfies(prevMajorProbe, validRange)
    : false;

  if (spansNextMajor || spansPrevMajor) {
    return {
      status: "ambiguous",
      resolvedVersion: null,
      major: null,
      raw,
      reason: `Range "${raw}" spans multiple major versions.`,
    };
  }

  return {
    status: "single_major_range",
    resolvedVersion: minVer.version,
    major: minVer.major,
    raw,
  };
}
