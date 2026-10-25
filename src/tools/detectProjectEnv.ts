import fs from "node:fs";
import path from "node:path";
import { detectConfigParadigms } from "../detectors/configParadigmDetector.js";
import { resolveProjectDependencies } from "../detectors/lockfileParser.js";
import { detectPackageManager } from "../detectors/packageManager.js";
import { detectRuntimeEnvironment } from "../detectors/runtimeDetector.js";
import {
  DetectProjectEnvironmentOutput,
  ResponseStatus,
} from "../types/common.js";

export function handleDetectProjectEnvironment(input: {
  project_path: string;
}): DetectProjectEnvironmentOutput {
  const resolvedPath = path.resolve(input.project_path);
  const warnings: string[] = [];

  if (!fs.existsSync(resolvedPath)) {
    return {
      status: "unverified",
      project_path: resolvedPath,
      runtime: detectRuntimeEnvironment(resolvedPath, null),
      package_manager: detectPackageManager(resolvedPath, null),
      core_dependencies: {},
      config_paradigms: detectConfigParadigms(resolvedPath, null, {}),
      warnings: [`Directory does not exist: ${resolvedPath}`],
      guardrail_notes: [
        "Verify the project_path before assuming any versions or configuration format.",
      ],
    };
  }

  const pkgJsonPath = path.join(resolvedPath, "package.json");
  let pkgJson: Record<string, unknown> | null = null;
  if (fs.existsSync(pkgJsonPath)) {
    try {
      pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as Record<
        string,
        unknown
      >;
    } catch (err) {
      warnings.push(
        `Failed to parse package.json at ${pkgJsonPath}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const runtime = detectRuntimeEnvironment(resolvedPath, pkgJson);
  const packageManager = detectPackageManager(resolvedPath, pkgJson);
  if (packageManager.multiple_lockfiles_warning) {
    warnings.push(packageManager.multiple_lockfiles_warning);
  }

  const coreDependencies = resolveProjectDependencies(resolvedPath, pkgJson);
  const configParadigms = detectConfigParadigms(
    resolvedPath,
    pkgJson,
    coreDependencies
  );

  const isPythonProject = Boolean(configParadigms.python);
  if (!pkgJson && !isPythonProject) {
    warnings.push(`No package.json found at ${resolvedPath}`);
  }

  if (configParadigms.eslint.legacy_files_present.length > 0) {
    warnings.push(
      `Both ESLint Flat Config (${configParadigms.eslint.config_files.join(", ")}) and legacy config (${configParadigms.eslint.legacy_files_present.join(", ")}) are present.`
    );
  }
  if (configParadigms.tailwindcss.legacy_config_present) {
    warnings.push(
      `Tailwind CSS v4 CSS-first mode detected alongside legacy config file (${configParadigms.tailwindcss.config_files.join(", ")}).`
    );
  }

  const hasAmbiguousDep = Object.values(coreDependencies).some(
    (d) => d.resolution_source === "ambiguous_range"
  );
  let status: ResponseStatus = "ok";
  if (!pkgJson && !isPythonProject) {
    status = "unverified";
  } else if (hasAmbiguousDep) {
    status = "partial";
  }

  return {
    status,
    project_path: resolvedPath,
    runtime,
    package_manager: packageManager,
    core_dependencies: coreDependencies,
    config_paradigms: configParadigms,
    warnings,
    guardrail_notes: [
      `Always use ${packageManager.name} commands (${packageManager.command_templates.install_prod}, ${packageManager.command_templates.exec_dlx}) for this project.`,
      "Do not suggest configuration formats that conflict with 'config_paradigms' (e.g. do not suggest .eslintrc when eslint.mode is 'flat_config', or tailwind.config.js when tailwindcss.mode is 'v4_css_first').",
    ],
  };
}
