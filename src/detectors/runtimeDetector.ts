import fs from "node:fs";
import path from "node:path";
import semver from "semver";
import { RuntimeDetection } from "../types/common.js";

function normalizeNodeVersionSpec(raw: string): string | null {
  const trimmed = raw.trim();
  const clean = semver.clean(trimmed);
  if (clean) return clean;

  // Handle major-only or major.minor in .nvmrc (e.g. "20" or "20.11")
  if (/^v?\d+(\.\d+)?$/.test(trimmed)) {
    const coerced = semver.coerce(trimmed);
    return coerced ? coerced.version : null;
  }

  // Handle semver range in engines.node (e.g. ">=18.18.0" or "^20.0.0")
  const validRange = semver.validRange(trimmed);
  if (validRange && validRange !== "*") {
    const min = semver.minVersion(validRange);
    return min ? min.version : null;
  }

  return null;
}

export function detectRuntimeEnvironment(
  projectPath: string,
  pkgJson: Record<string, unknown> | null
): RuntimeDetection {
  const hostNode = process.versions.node;
  const enginesObj = pkgJson?.engines as Record<string, string> | undefined;
  const enginesNode =
    typeof enginesObj?.node === "string" ? enginesObj.node.trim() : null;

  // 1. .nvmrc
  const nvmrcPath = path.join(projectPath, ".nvmrc");
  if (fs.existsSync(nvmrcPath)) {
    const raw = fs.readFileSync(nvmrcPath, "utf8").split(/\r?\n/)[0].trim();
    if (raw) {
      return {
        node: {
          resolved_version: normalizeNodeVersionSpec(raw),
          raw_spec: raw,
          source: ".nvmrc",
          engines_field: enginesNode,
          host_process_node: hostNode,
        },
      };
    }
  }

  // 2. .node-version
  const nodeVersionPath = path.join(projectPath, ".node-version");
  if (fs.existsSync(nodeVersionPath)) {
    const raw = fs
      .readFileSync(nodeVersionPath, "utf8")
      .split(/\r?\n/)[0]
      .trim();
    if (raw) {
      return {
        node: {
          resolved_version: normalizeNodeVersionSpec(raw),
          raw_spec: raw,
          source: ".node-version",
          engines_field: enginesNode,
          host_process_node: hostNode,
        },
      };
    }
  }

  // 3. package.json#volta.node
  const voltaObj = pkgJson?.volta as Record<string, string> | undefined;
  if (typeof voltaObj?.node === "string" && voltaObj.node.trim()) {
    const raw = voltaObj.node.trim();
    return {
      node: {
        resolved_version: normalizeNodeVersionSpec(raw),
        raw_spec: raw,
        source: "package.json#volta.node",
        engines_field: enginesNode,
        host_process_node: hostNode,
      },
    };
  }

  // 4. .tool-versions (asdf / mise)
  const toolVersionsPath = path.join(projectPath, ".tool-versions");
  if (fs.existsSync(toolVersionsPath)) {
    const lines = fs.readFileSync(toolVersionsPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const match = line.trim().match(/^nodejs\s+([^\s#]+)/);
      if (match && match[1]) {
        const raw = match[1].trim();
        return {
          node: {
            resolved_version: normalizeNodeVersionSpec(raw),
            raw_spec: raw,
            source: ".tool-versions",
            engines_field: enginesNode,
            host_process_node: hostNode,
          },
        };
      }
    }
  }

  // 5. package.json#engines.node
  if (enginesNode) {
    return {
      node: {
        resolved_version: normalizeNodeVersionSpec(enginesNode),
        raw_spec: enginesNode,
        source: "package.json#engines.node",
        engines_field: enginesNode,
        host_process_node: hostNode,
      },
    };
  }

  return {
    node: {
      resolved_version: null,
      raw_spec: null,
      source: "not_specified",
      engines_field: null,
      host_process_node: hostNode,
    },
  };
}
