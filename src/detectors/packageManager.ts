import fs from "node:fs";
import path from "node:path";
import {
  CommandTemplates,
  PackageManagerDetection,
  SupportedPackageManager,
} from "../types/common.js";

const LOCKFILE_CANDIDATES: Array<{
  filename: string;
  pm: SupportedPackageManager;
}> = [
  { filename: "pnpm-lock.yaml", pm: "pnpm" },
  { filename: "bun.lock", pm: "bun" },
  { filename: "bun.lockb", pm: "bun" },
  { filename: "yarn.lock", pm: "yarn" },
  { filename: "package-lock.json", pm: "npm" },
  { filename: "npm-shrinkwrap.json", pm: "npm" },
  { filename: "uv.lock", pm: "uv" },
  { filename: "poetry.lock", pm: "poetry" },
  { filename: "Pipfile.lock", pm: "pip" },
  { filename: "requirements.txt", pm: "pip" },
];

export function buildCommandTemplates(
  pm: SupportedPackageManager,
  yarnVariant: "classic" | "berry" | "standard" = "standard"
): CommandTemplates {
  switch (pm) {
    case "uv":
      return {
        install_prod: "uv add <pkg>",
        install_dev: "uv add --dev <pkg>",
        exec_local: "uv run <cmd>",
        exec_dlx: "uvx <pkg>",
        run_script: "uv run <script>",
      };
    case "poetry":
      return {
        install_prod: "poetry add <pkg>",
        install_dev: "poetry add --group dev <pkg>",
        exec_local: "poetry run <cmd>",
        exec_dlx: "poetry run <cmd>",
        run_script: "poetry run <script>",
      };
    case "pip":
      return {
        install_prod: "pip install <pkg>",
        install_dev: "pip install <pkg>",
        exec_local: "python -m <cmd>",
        exec_dlx: "pipx run <pkg>",
        run_script: "python <script>",
      };
    case "pnpm":
      return {
        install_prod: "pnpm add <pkg>",
        install_dev: "pnpm add -D <pkg>",
        exec_local: "pnpm exec <cmd>",
        exec_dlx: "pnpm dlx <pkg>",
        run_script: "pnpm <script>",
      };
    case "yarn":
      return {
        install_prod: "yarn add <pkg>",
        install_dev: "yarn add -D <pkg>",
        exec_local: "yarn <cmd>",
        exec_dlx:
          yarnVariant === "berry" ? "yarn dlx <pkg>" : "npx <pkg>",
        run_script: "yarn <script>",
      };
    case "bun":
      return {
        install_prod: "bun add <pkg>",
        install_dev: "bun add -d <pkg>",
        exec_local: "bunx <cmd>",
        exec_dlx: "bunx <pkg>",
        run_script: "bun run <script>",
      };
    case "npm":
    default:
      return {
        install_prod: "npm install <pkg>",
        install_dev: "npm install -D <pkg>",
        exec_local: "npx <cmd>",
        exec_dlx: "npx <pkg>",
        run_script: "npm run <script>",
      };
  }
}

export function translateNpmCommand(
  npmCommand: string,
  pm: SupportedPackageManager,
  yarnVariant: "classic" | "berry" | "standard" = "standard"
): string {
  const trimmed = npmCommand.trim();
  if (pm === "npm") return trimmed;

  // Handle Python PM translations
  if (pm === "uv") {
    if (trimmed.startsWith("npx ")) return `uvx ${trimmed.slice(4).trim()}`;
    if (trimmed.startsWith("pip install -r ")) return `uv sync`;
    const pipMatch = trimmed.match(/^pip\s+install\s+(.+)$/);
    if (pipMatch) return `uv add ${pipMatch[1]}`;
    const devMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(?:-D|--save-dev)\s+(.+)$/);
    if (devMatch) return `uv add --dev ${devMatch[1]}`;
    const prodMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(.+)$/);
    if (prodMatch) return `uv add ${prodMatch[1]}`;
    if (trimmed.startsWith("poetry add --group dev ")) return `uv add --dev ${trimmed.slice(23).trim()}`;
    if (trimmed.startsWith("poetry add ")) return `uv add ${trimmed.slice(11).trim()}`;
    return trimmed;
  }

  if (pm === "poetry") {
    if (trimmed.startsWith("npx ") || trimmed.startsWith("uvx ")) {
      const rest = trimmed.replace(/^(?:npx|uvx)\s+/, "").trim();
      return `poetry run ${rest}`;
    }
    const pipMatch = trimmed.match(/^pip\s+install\s+(.+)$/);
    if (pipMatch) return `poetry add ${pipMatch[1]}`;
    if (trimmed.startsWith("uv add --dev ")) return `poetry add --group dev ${trimmed.slice(13).trim()}`;
    if (trimmed.startsWith("uv add ")) return `poetry add ${trimmed.slice(7).trim()}`;
    const devMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(?:-D|--save-dev)\s+(.+)$/);
    if (devMatch) return `poetry add --group dev ${devMatch[1]}`;
    const prodMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(.+)$/);
    if (prodMatch) return `poetry add ${prodMatch[1]}`;
    return trimmed;
  }

  if (pm === "pip") {
    if (trimmed.startsWith("uv add --dev ")) return `pip install ${trimmed.slice(13).trim()}`;
    if (trimmed.startsWith("uv add ")) return `pip install ${trimmed.slice(7).trim()}`;
    if (trimmed.startsWith("poetry add --group dev ")) return `pip install ${trimmed.slice(23).trim()}`;
    if (trimmed.startsWith("poetry add ")) return `pip install ${trimmed.slice(11).trim()}`;
    if (trimmed.startsWith("npx ") || trimmed.startsWith("uvx ")) {
      const rest = trimmed.replace(/^(?:npx|uvx)\s+/, "").trim();
      return `pipx run ${rest}`;
    }
    const devMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(?:-D|--save-dev)\s+(.+)$/);
    if (devMatch) return `pip install ${devMatch[1]}`;
    const prodMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(.+)$/);
    if (prodMatch) return `pip install ${prodMatch[1]}`;
    return trimmed;
  }

  // Handle JS PM translations
  // Handle npx <pkg> ...
  if (trimmed.startsWith("npx ")) {
    const rest = trimmed.slice(4).trim();
    if (pm === "pnpm") return `pnpm dlx ${rest}`;
    if (pm === "bun") return `bunx ${rest}`;
    if (pm === "yarn") {
      return yarnVariant === "berry" ? `yarn dlx ${rest}` : `npx ${rest}`;
    }
  }

  // Handle npm install -D / --save-dev
  const devMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(?:-D|--save-dev)\s+(.+)$/);
  if (devMatch) {
    const pkgs = devMatch[1];
    if (pm === "pnpm") return `pnpm add -D ${pkgs}`;
    if (pm === "yarn") return `yarn add -D ${pkgs}`;
    if (pm === "bun") return `bun add -d ${pkgs}`;
  }

  // Handle npm install <pkgs>
  const prodMatch = trimmed.match(/^npm\s+(?:install|i|add)\s+(.+)$/);
  if (prodMatch) {
    const pkgs = prodMatch[1];
    if (pm === "pnpm") return `pnpm add ${pkgs}`;
    if (pm === "yarn") return `yarn add ${pkgs}`;
    if (pm === "bun") return `bun add ${pkgs}`;
  }

  // Handle npm init @eslint/config@latest etc.
  const initMatch = trimmed.match(/^npm\s+init\s+(.+)$/);
  if (initMatch) {
    const target = initMatch[1];
    if (pm === "pnpm") return `pnpm create ${target}`;
    if (pm === "yarn") return `yarn create ${target}`;
    if (pm === "bun") return `bun create ${target}`;
  }

  return trimmed;
}

function findLockfiles(projectPath: string): {
  found: Array<{ filename: string; fullPath: string; pm: SupportedPackageManager; mtimeMs: number }>;
} {
  const dirsToCheck = [
    projectPath,
    path.resolve(projectPath, ".."),
    path.resolve(projectPath, "../.."),
  ];

  const found: Array<{
    filename: string;
    fullPath: string;
    pm: SupportedPackageManager;
    mtimeMs: number;
  }> = [];

  for (const dir of dirsToCheck) {
    for (const candidate of LOCKFILE_CANDIDATES) {
      const fullPath = path.join(dir, candidate.filename);
      if (fs.existsSync(fullPath)) {
        try {
          const stat = fs.statSync(fullPath);
          if (!found.some((f) => f.filename === candidate.filename)) {
            found.push({
              filename: candidate.filename,
              fullPath,
              pm: candidate.pm,
              mtimeMs: stat.mtimeMs,
            });
          }
        } catch {
          // ignore stat errors
        }
      }
    }
    if (found.length > 0) {
      break;
    }
  }

  return { found };
}

function detectYarnVariant(
  projectPath: string,
  pmVersion: string | null,
  yarnLockPath?: string
): "classic" | "berry" {
  if (pmVersion) {
    const major = parseInt(pmVersion.split(".")[0], 10);
    if (!Number.isNaN(major) && major >= 2) return "berry";
    if (!Number.isNaN(major) && major === 1) return "classic";
  }
  if (fs.existsSync(path.join(projectPath, ".yarnrc.yml"))) {
    return "berry";
  }
  if (yarnLockPath && fs.existsSync(yarnLockPath)) {
    try {
      const head = fs.readFileSync(yarnLockPath, "utf8").slice(0, 512);
      if (head.includes("__metadata:")) return "berry";
    } catch {
      // ignore
    }
  }
  return "classic";
}

export function detectPackageManager(
  projectPath: string,
  pkgJson: Record<string, unknown> | null
): PackageManagerDetection {
  const { found: lockfiles } = findLockfiles(projectPath);
  const lockfileNames = lockfiles.map((l) => l.filename);
  const uniquePmsInLockfiles = Array.from(new Set(lockfiles.map((l) => l.pm)));

  let multipleLockfilesWarning: string | null = null;
  if (uniquePmsInLockfiles.length > 1) {
    multipleLockfilesWarning = `Multiple lockfiles from different package managers found (${lockfileNames.join(", ")}). This can cause inconsistent dependency installations.`;
  }

  // Priority 1: package.json#packageManager
  if (pkgJson && typeof pkgJson.packageManager === "string") {
    const rawPm = pkgJson.packageManager.trim();
    const match = rawPm.match(/^(npm|pnpm|yarn|bun)@([^+]+)/);
    if (match) {
      const name = match[1] as SupportedPackageManager;
      const version = match[2];
      const yarnLock = lockfiles.find((l) => l.pm === "yarn");
      const variant =
        name === "yarn"
          ? detectYarnVariant(projectPath, version, yarnLock?.fullPath)
          : "standard";

      return {
        name,
        variant,
        version,
        detected_from: "package.json#packageManager",
        lockfiles_found: lockfileNames,
        multiple_lockfiles_warning: multipleLockfilesWarning,
        command_templates: buildCommandTemplates(name, variant),
      };
    }
  }

  // Priority 2: Lockfiles (ordered by priority: pnpm > bun > yarn > npm)
  if (lockfiles.length > 0) {
    const primary = lockfiles[0];
    const variant =
      primary.pm === "yarn"
        ? detectYarnVariant(projectPath, null, primary.fullPath)
        : "standard";

    return {
      name: primary.pm,
      variant,
      version: null,
      detected_from: "lockfile",
      lockfiles_found: lockfileNames,
      multiple_lockfiles_warning: multipleLockfilesWarning,
      command_templates: buildCommandTemplates(primary.pm, variant),
    };
  }

  // Priority 3: pyproject.toml without lockfile
  const pyprojectPath = path.join(projectPath, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, "utf8");
      if (content.includes("[tool.poetry]")) {
        return {
          name: "poetry",
          variant: "standard",
          version: null,
          detected_from: "pyproject.toml",
          lockfiles_found: lockfileNames,
          multiple_lockfiles_warning: multipleLockfilesWarning,
          command_templates: buildCommandTemplates("poetry", "standard"),
        };
      }
    } catch {
      // ignore
    }

    return {
      name: "uv",
      variant: "standard",
      version: null,
      detected_from: "pyproject.toml",
      lockfiles_found: lockfileNames,
      multiple_lockfiles_warning: multipleLockfilesWarning,
      command_templates: buildCommandTemplates("uv", "standard"),
    };
  }

  // Priority 4: Default fallback to npm
  return {
    name: "npm",
    variant: "standard",
    version: null,
    detected_from: "default_fallback",
    lockfiles_found: [],
    multiple_lockfiles_warning: null,
    command_templates: buildCommandTemplates("npm", "standard"),
  };
}
