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

function normalizePythonVersionSpec(raw: string): string | null {
  const trimmed = raw.trim().replace(/^python-?/i, "");
  const clean = semver.clean(trimmed);
  if (clean) return clean;

  // Handle major.minor (e.g. "3.12" or "3.11")
  if (/^v?\d+\.\d+$/.test(trimmed)) {
    const coerced = semver.coerce(trimmed);
    return coerced ? coerced.version : null;
  }

  // Handle semver / PEP 440 ranges (e.g. ">=3.10", "^3.11", ">=3.11,<3.13")
  const firstPart = trimmed.split(",")[0].trim();
  const validRange = semver.validRange(firstPart);
  if (validRange && validRange !== "*") {
    const min = semver.minVersion(validRange);
    if (min) return min.version;
  }

  const coerced = semver.coerce(trimmed);
  return coerced ? coerced.version : null;
}

function detectPythonRuntime(projectPath: string): RuntimeDetection["python"] | undefined {
  // 1. .python-version (pyenv, asdf, mise, uv)
  const pyVersionPath = path.join(projectPath, ".python-version");
  if (fs.existsSync(pyVersionPath)) {
    const raw = fs.readFileSync(pyVersionPath, "utf8").split(/\r?\n/)[0].trim();
    if (raw) {
      return {
        resolved_version: normalizePythonVersionSpec(raw),
        raw_spec: raw,
        source: ".python-version",
        requires_python_field: null,
      };
    }
  }

  // 2. pyproject.toml
  const pyprojectPath = path.join(projectPath, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, "utf8");
      // PEP 621 [project] requires-python = ">=3.10"
      const reqMatch = content.match(/requires-python\s*=\s*["']([^"']+)["']/i);
      if (reqMatch && reqMatch[1]) {
        const raw = reqMatch[1].trim();
        return {
          resolved_version: normalizePythonVersionSpec(raw),
          raw_spec: raw,
          source: "pyproject.toml#project.requires-python",
          requires_python_field: raw,
        };
      }

      // Poetry [tool.poetry.dependencies] python = "^3.11"
      const poetryMatch = content.match(/\[tool\.poetry\.dependencies\][\s\S]*?python\s*=\s*["']([^"']+)["']/i);
      if (poetryMatch && poetryMatch[1]) {
        const raw = poetryMatch[1].trim();
        return {
          resolved_version: normalizePythonVersionSpec(raw),
          raw_spec: raw,
          source: "pyproject.toml#tool.poetry.dependencies.python",
          requires_python_field: raw,
        };
      }
    } catch {
      // ignore parse errors
    }
  }

  // 3. .tool-versions (asdf / mise)
  const toolVersionsPath = path.join(projectPath, ".tool-versions");
  if (fs.existsSync(toolVersionsPath)) {
    try {
      const lines = fs.readFileSync(toolVersionsPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const match = line.trim().match(/^python\s+([^\s#]+)/);
        if (match && match[1]) {
          const raw = match[1].trim();
          return {
            resolved_version: normalizePythonVersionSpec(raw),
            raw_spec: raw,
            source: ".tool-versions",
            requires_python_field: null,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. runtime.txt (Heroku / cloud)
  const runtimeTxtPath = path.join(projectPath, "runtime.txt");
  if (fs.existsSync(runtimeTxtPath)) {
    try {
      const raw = fs.readFileSync(runtimeTxtPath, "utf8").split(/\r?\n/)[0].trim();
      if (raw.toLowerCase().startsWith("python-")) {
        return {
          resolved_version: normalizePythonVersionSpec(raw),
          raw_spec: raw,
          source: "runtime.txt",
          requires_python_field: null,
        };
      }
    } catch {
      // ignore
    }
  }

  // 5. Pipfile
  const pipfilePath = path.join(projectPath, "Pipfile");
  if (fs.existsSync(pipfilePath)) {
    try {
      const content = fs.readFileSync(pipfilePath, "utf8");
      const match = content.match(/python_version\s*=\s*["']([^"']+)["']/i);
      if (match && match[1]) {
        const raw = match[1].trim();
        return {
          resolved_version: normalizePythonVersionSpec(raw),
          raw_spec: raw,
          source: "Pipfile",
          requires_python_field: raw,
        };
      }
    } catch {
      // ignore
    }
  }

  return undefined;
}

export function detectRuntimeEnvironment(
  projectPath: string,
  pkgJson: Record<string, unknown> | null
): RuntimeDetection {
  const hostNode = process.versions.node;
  const enginesObj = pkgJson?.engines as Record<string, string> | undefined;
  const enginesNode =
    typeof enginesObj?.node === "string" ? enginesObj.node.trim() : null;
  const pythonRuntime = detectPythonRuntime(projectPath);

  let nodeRuntime: RuntimeDetection["node"] = {
    resolved_version: null,
    raw_spec: null,
    source: "not_specified",
    engines_field: null,
    host_process_node: hostNode,
  };

  // 1. .nvmrc
  const nvmrcPath = path.join(projectPath, ".nvmrc");
  if (fs.existsSync(nvmrcPath)) {
    const raw = fs.readFileSync(nvmrcPath, "utf8").split(/\r?\n/)[0].trim();
    if (raw) {
      nodeRuntime = {
        resolved_version: normalizeNodeVersionSpec(raw),
        raw_spec: raw,
        source: ".nvmrc",
        engines_field: enginesNode,
        host_process_node: hostNode,
      };
      return { node: nodeRuntime, ...(pythonRuntime ? { python: pythonRuntime } : {}) };
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
      nodeRuntime = {
        resolved_version: normalizeNodeVersionSpec(raw),
        raw_spec: raw,
        source: ".node-version",
        engines_field: enginesNode,
        host_process_node: hostNode,
      };
      return { node: nodeRuntime, ...(pythonRuntime ? { python: pythonRuntime } : {}) };
    }
  }

  // 3. package.json#volta.node
  const voltaObj = pkgJson?.volta as Record<string, string> | undefined;
  if (typeof voltaObj?.node === "string" && voltaObj.node.trim()) {
    const raw = voltaObj.node.trim();
    nodeRuntime = {
      resolved_version: normalizeNodeVersionSpec(raw),
      raw_spec: raw,
      source: "package.json#volta.node",
      engines_field: enginesNode,
      host_process_node: hostNode,
    };
    return { node: nodeRuntime, ...(pythonRuntime ? { python: pythonRuntime } : {}) };
  }

  // 4. .tool-versions (asdf / mise)
  const toolVersionsPath = path.join(projectPath, ".tool-versions");
  if (fs.existsSync(toolVersionsPath)) {
    const lines = fs.readFileSync(toolVersionsPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const match = line.trim().match(/^nodejs\s+([^\s#]+)/);
      if (match && match[1]) {
        const raw = match[1].trim();
        nodeRuntime = {
          resolved_version: normalizeNodeVersionSpec(raw),
          raw_spec: raw,
          source: ".tool-versions",
          engines_field: enginesNode,
          host_process_node: hostNode,
        };
        return { node: nodeRuntime, ...(pythonRuntime ? { python: pythonRuntime } : {}) };
      }
    }
  }

  // 5. package.json#engines.node
  if (enginesNode) {
    nodeRuntime = {
      resolved_version: normalizeNodeVersionSpec(enginesNode),
      raw_spec: enginesNode,
      source: "package.json#engines.node",
      engines_field: enginesNode,
      host_process_node: hostNode,
    };
    return { node: nodeRuntime, ...(pythonRuntime ? { python: pythonRuntime } : {}) };
  }

  return {
    node: nodeRuntime,
    ...(pythonRuntime ? { python: pythonRuntime } : {}),
  };
}
