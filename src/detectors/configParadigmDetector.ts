import fs from "node:fs";
import path from "node:path";
import { ConfigParadigms, DependencyResolution } from "../types/common.js";

const ESLINT_FLAT_CONFIGS = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts",
];

const ESLINT_LEGACY_CONFIGS = [
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.yaml",
  ".eslintrc.yml",
  ".eslintrc.json",
];

const TAILWIND_V3_CONFIGS = [
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.mjs",
  "tailwind.config.ts",
];

const CSS_CANDIDATE_PATHS = [
  "src/app/globals.css",
  "app/globals.css",
  "src/index.css",
  "src/App.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/main.css",
];

const NEXT_CONFIGS = [
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
  "next.config.cjs",
];

const VITE_CONFIGS = [
  "vite.config.ts",
  "vite.config.mts",
  "vite.config.js",
  "vite.config.mjs",
];

function stripJsonComments(raw: string): string {
  // Strip single-line and multi-line comments while preserving strings
  return raw
    .replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
      (match, group) => (group ? "" : match)
    )
    .replace(/,(\s*[}\]])/g, "$1");
}

export function detectConfigParadigms(
  projectPath: string,
  pkgJson: Record<string, unknown> | null,
  coreDeps: Record<string, DependencyResolution>
): ConfigParadigms {
  // 1. ESLint detection
  const flatConfigs = ESLINT_FLAT_CONFIGS.filter((f) =>
    fs.existsSync(path.join(projectPath, f))
  );
  const legacyConfigs = ESLINT_LEGACY_CONFIGS.filter((f) =>
    fs.existsSync(path.join(projectPath, f))
  );
  if (pkgJson && "eslintConfig" in pkgJson) {
    legacyConfigs.push("package.json#eslintConfig");
  }

  let eslintMode: "flat_config" | "legacy_eslintrc" | "none" = "none";
  if (flatConfigs.length > 0) {
    eslintMode = "flat_config";
  } else if (legacyConfigs.length > 0) {
    eslintMode = "legacy_eslintrc";
  }

  // 2. Tailwind CSS detection
  const twConfigFiles = TAILWIND_V3_CONFIGS.filter((f) =>
    fs.existsSync(path.join(projectPath, f))
  );
  const cssEntryFiles: string[] = [];
  let hasV4CssImport = false;
  let hasV3TailwindDirective = false;

  for (const relCss of CSS_CANDIDATE_PATHS) {
    const fullCss = path.join(projectPath, relCss);
    if (fs.existsSync(fullCss)) {
      cssEntryFiles.push(relCss);
      try {
        const cssContent = fs.readFileSync(fullCss, "utf8");
        if (
          cssContent.includes('@import "tailwindcss"') ||
          cssContent.includes("@import 'tailwindcss'") ||
          cssContent.includes("@theme")
        ) {
          hasV4CssImport = true;
        }
        if (cssContent.includes("@tailwind base")) {
          hasV3TailwindDirective = true;
        }
      } catch {
        // ignore
      }
    }
  }

  const twResolvedVer = coreDeps["tailwindcss"]?.resolved_version;
  const hasTwV4Plugin =
    "@tailwindcss/vite" in coreDeps || "@tailwindcss/postcss" in coreDeps;
  const isTwMajor4 = twResolvedVer ? twResolvedVer.startsWith("4.") : false;

  let tailwindMode: "v4_css_first" | "v3_config_file" | "none" = "none";
  if (hasV4CssImport || hasTwV4Plugin || isTwMajor4) {
    tailwindMode = "v4_css_first";
  } else if (twConfigFiles.length > 0 || hasV3TailwindDirective) {
    tailwindMode = "v3_config_file";
  }

  // 3. Next.js router & config detection
  const nextConfigFile =
    NEXT_CONFIGS.find((f) => fs.existsSync(path.join(projectPath, f))) ?? null;
  const hasAppDir =
    fs.existsSync(path.join(projectPath, "src/app")) ||
    fs.existsSync(path.join(projectPath, "app"));
  const hasPagesDir =
    fs.existsSync(path.join(projectPath, "src/pages")) ||
    fs.existsSync(path.join(projectPath, "pages"));

  let nextRouterMode: "app_router" | "pages_router" | "hybrid" | "none" =
    "none";
  if (hasAppDir && hasPagesDir) {
    nextRouterMode = "hybrid";
  } else if (hasAppDir) {
    nextRouterMode = "app_router";
  } else if (hasPagesDir) {
    nextRouterMode = "pages_router";
  }

  // 4. TypeScript tsconfig.json detection
  const tsconfigPath = path.join(projectPath, "tsconfig.json");
  let tsConfigFile: string | null = null;
  let moduleResolution: string | null = null;
  let tsModule: string | null = null;
  let tsTarget: string | null = null;
  let tsStrict: boolean | null = null;

  if (fs.existsSync(tsconfigPath)) {
    tsConfigFile = "tsconfig.json";
    try {
      const rawTs = fs.readFileSync(tsconfigPath, "utf8");
      const parsedTs = JSON.parse(stripJsonComments(rawTs)) as {
        compilerOptions?: {
          moduleResolution?: string;
          module?: string;
          target?: string;
          strict?: boolean;
        };
      };
      moduleResolution = parsedTs.compilerOptions?.moduleResolution ?? null;
      tsModule = parsedTs.compilerOptions?.module ?? null;
      tsTarget = parsedTs.compilerOptions?.target ?? null;
      tsStrict =
        typeof parsedTs.compilerOptions?.strict === "boolean"
          ? parsedTs.compilerOptions.strict
          : null;
    } catch {
      // ignore malformed tsconfig
    }
  }

  // 5. Vite config detection
  const viteConfigFile =
    VITE_CONFIGS.find((f) => fs.existsSync(path.join(projectPath, f))) ?? null;

  return {
    eslint: {
      mode: eslintMode,
      config_files: flatConfigs.length > 0 ? flatConfigs : legacyConfigs,
      legacy_files_present: flatConfigs.length > 0 ? legacyConfigs : [],
    },
    tailwindcss: {
      mode: tailwindMode,
      config_files: twConfigFiles,
      css_entry_files: cssEntryFiles,
      legacy_config_present:
        tailwindMode === "v4_css_first" && twConfigFiles.length > 0,
    },
    nextjs: {
      router_mode: nextRouterMode,
      config_file: nextConfigFile,
    },
    typescript: {
      config_file: tsConfigFile,
      module_resolution: moduleResolution,
      module: tsModule,
      target: tsTarget,
      strict: tsStrict,
    },
    vite: {
      config_file: viteConfigFile,
    },
  };
}
