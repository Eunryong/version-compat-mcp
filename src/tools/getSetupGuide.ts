import semver from "semver";
import { translateNpmCommand } from "../detectors/packageManager.js";
import { getIndexDatabase } from "../retrieval/dbClient.js";
import {
  ResponseStatus,
  SUPPORTED_LIBRARIES,
  SupportedPackageManager,
} from "../types/common.js";
import {
  analyzeVersionSpec,
  normalizeLibraryName,
} from "../utils/versionUtils.js";

interface StoredInstallCommand {
  step: number;
  description: string;
  npm_command: string;
  source_url: string;
}

interface StoredConfigExample {
  file_path: string;
  description?: string;
  content: string;
  source_url: string;
}

export async function handleGetVersionedSetupGuide(input: {
  library: string;
  target_version: string;
  package_manager: SupportedPackageManager;
  runtime_version?: string;
  framework_context?: string;
}): Promise<Record<string, unknown>> {
  const library = normalizeLibraryName(input.library);
  if (!library) {
    return {
      status: "unsupported_library" satisfies ResponseStatus,
      requested_library: input.library,
      supported_libraries: SUPPORTED_LIBRARIES,
      guardrail_notes: [
        `Library "${input.library}" is outside the supported scope (${SUPPORTED_LIBRARIES.join(", ")}). Do not guess setup commands without official verification.`,
      ],
    };
  }

  const parsedVersion = analyzeVersionSpec(input.target_version);
  if (
    parsedVersion.status === "ambiguous" ||
    parsedVersion.status === "protocol" ||
    parsedVersion.major === null ||
    !parsedVersion.resolvedVersion
  ) {
    return {
      status: "ambiguous_version" satisfies ResponseStatus,
      library,
      requested_version: input.target_version,
      reason:
        parsedVersion.reason ??
        `Target version "${input.target_version}" is ambiguous. Specify an explicit version or run detect_project_environment first.`,
      guardrail_notes: [
        "Never silently substitute 'latest' when the target version is ambiguous. Ask the user or check package.json/lockfile.",
      ],
    };
  }

  const { db } = await getIndexDatabase();
  const contextToTry = input.framework_context ?? "standalone";

  const stmt = db.prepare(`
    SELECT
      library,
      major_version,
      version,
      framework_context,
      required_node,
      install_commands_json,
      config_examples_json,
      obsolete_patterns_json,
      source_url,
      git_tag
    FROM setup_templates
    WHERE library = ?
      AND major_version = ?
      AND framework_context IN (?, 'standalone')
    ORDER BY CASE WHEN framework_context = ? THEN 0 ELSE 1 END
    LIMIT 1
  `);

  const row = stmt.get(
    library,
    parsedVersion.major,
    contextToTry,
    contextToTry
  ) as
    | {
        library: string;
        major_version: number;
        version: string;
        framework_context: string;
        required_node: string | null;
        install_commands_json: string;
        config_examples_json: string;
        obsolete_patterns_json: string;
        source_url: string;
        git_tag: string;
      }
    | undefined;

  if (!row) {
    const supportedMajorsRows = db
      .prepare(
        `SELECT DISTINCT major_version FROM setup_templates WHERE library = ? ORDER BY major_version ASC`
      )
      .all(library) as Array<{ major_version: number }>;

    return {
      status: "unverified" satisfies ResponseStatus,
      library,
      requested_version: input.target_version,
      resolved_major: parsedVersion.major,
      indexed_setup_majors: supportedMajorsRows.map((r) => r.major_version),
      guardrail_notes: [
        `No verified setup template indexed for ${library} v${parsedVersion.major}. Do not fabricate commands without source_url.`,
      ],
    };
  }

  const rawCommands = JSON.parse(
    row.install_commands_json
  ) as StoredInstallCommand[];
  const configExamples = JSON.parse(
    row.config_examples_json
  ) as StoredConfigExample[];
  const obsoletePatterns = JSON.parse(row.obsolete_patterns_json) as string[];

  const installCommands = rawCommands.map((cmd) => ({
    step: cmd.step,
    description: cmd.description,
    command: translateNpmCommand(cmd.npm_command, input.package_manager),
    source_url: cmd.source_url,
  }));

  let runtimeCheck: {
    required_node: string | null;
    provided_node: string | null;
    is_compatible: boolean | null;
  } = {
    required_node: row.required_node,
    provided_node: input.runtime_version ?? null,
    is_compatible: null,
  };

  if (row.required_node && input.runtime_version) {
    const cleanNode =
      semver.clean(input.runtime_version) ??
      semver.coerce(input.runtime_version)?.version ??
      null;
    if (cleanNode) {
      runtimeCheck = {
        required_node: row.required_node,
        provided_node: cleanNode,
        is_compatible: semver.satisfies(cleanNode, row.required_node, {
          includePrerelease: true,
        }),
      };
    }
  }

  return {
    status: "ok" satisfies ResponseStatus,
    library,
    requested_version: input.target_version,
    resolved_version: parsedVersion.resolvedVersion,
    indexed_template_version: row.version,
    git_tag: row.git_tag,
    package_manager: input.package_manager,
    framework_context: row.framework_context,
    runtime_check: runtimeCheck,
    install_commands: installCommands,
    config_examples: configExamples,
    obsolete_patterns_to_avoid: obsoletePatterns,
    source_url: row.source_url,
    guardrail_notes: [
      "All commands are formatted for the specified package_manager and backed by official source_url.",
      "Do not execute these commands automatically without user confirmation.",
    ],
  };
}
