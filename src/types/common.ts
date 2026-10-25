export const SUPPORTED_LIBRARIES = [
  "node",
  "typescript",
  "react",
  "nextjs",
  "vite",
  "tailwindcss",
  "eslint",
  "python",
  "pydantic",
  "fastapi",
  "sqlalchemy",
  "langchain",
  "uv",
] as const;

export type SupportedLibrary = (typeof SUPPORTED_LIBRARIES)[number];

export const LIBRARY_NPM_PACKAGE_MAP: Record<SupportedLibrary, string[]> = {
  node: ["node"],
  typescript: ["typescript"],
  react: ["react", "react-dom"],
  nextjs: ["next"],
  vite: ["vite"],
  tailwindcss: ["tailwindcss", "@tailwindcss/vite", "@tailwindcss/postcss"],
  eslint: ["eslint", "@eslint/js"],
  python: ["python"],
  pydantic: ["pydantic", "pydantic-settings", "pydantic-core"],
  fastapi: ["fastapi"],
  sqlalchemy: ["sqlalchemy"],
  langchain: ["langchain", "langchain-core", "langchain-community", "langchain-openai"],
  uv: ["uv"],
};

export const SUPPORTED_PACKAGE_MANAGERS = [
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "uv",
  "poetry",
  "pip",
] as const;
export type SupportedPackageManager = (typeof SUPPORTED_PACKAGE_MANAGERS)[number];

export type ResponseStatus =
  | "ok"
  | "partial"
  | "ambiguous_version"
  | "unverified"
  | "unsupported_library";

export type DocType =
  | "migration_guide"
  | "release_note"
  | "deprecation"
  | "setup_guide";

export interface DocChunkMetadata {
  chunk_uid: string;
  collection_id: string;
  library: SupportedLibrary;
  version: string;
  major_version: number;
  semver_num: number;
  doc_type: DocType;
  is_breaking: boolean;
  framework_context: string | null;
  section: string;
  source_url: string;
  git_tag: string;
  content: string;
  code_tokens: string;
  content_sha256: string;
  collected_at: string;
}

export interface CommandTemplates {
  install_prod: string;
  install_dev: string;
  exec_local: string;
  exec_dlx: string;
  run_script: string;
}

export interface PackageManagerDetection {
  name: SupportedPackageManager;
  variant?: "classic" | "berry" | "standard";
  version: string | null;
  detected_from:
    | "package.json#packageManager"
    | "lockfile"
    | "pyproject.toml"
    | "default_fallback";
  lockfiles_found: string[];
  multiple_lockfiles_warning: string | null;
  command_templates: CommandTemplates;
}

export interface DependencyResolution {
  package_name: string;
  library_id: SupportedLibrary;
  declared_range: string | null;
  resolved_version: string | null;
  resolution_source:
    | "node_modules"
    | "pnpm-lock.yaml"
    | "package-lock.json"
    | "npm-shrinkwrap.json"
    | "yarn.lock"
    | "bun.lock"
    | "uv.lock"
    | "poetry.lock"
    | "requirements.txt"
    | "requirements-dev.txt"
    | "pyproject.toml#declared_exact"
    | "pyproject.toml#declared_range"
    | "pyproject.toml#tool.poetry"
    | "declared_range_exact"
    | "declared_range_min"
    | "workspace_catalog"
    | "ambiguous_range"
    | "unresolved";
  is_dev: boolean;
  note?: string;
}

export interface RuntimeDetection {
  node: {
    resolved_version: string | null;
    raw_spec: string | null;
    source:
      | ".nvmrc"
      | ".node-version"
      | "package.json#volta.node"
      | ".tool-versions"
      | "package.json#engines.node"
      | "not_specified";
    engines_field: string | null;
    host_process_node: string;
  };
  python?: {
    resolved_version: string | null;
    raw_spec: string | null;
    source:
      | ".python-version"
      | "pyproject.toml#project.requires-python"
      | "pyproject.toml#tool.poetry.dependencies.python"
      | ".tool-versions"
      | "runtime.txt"
      | "Pipfile"
      | "not_specified";
    requires_python_field: string | null;
    host_process_python?: string | null;
  };
}

export interface ConfigParadigms {
  eslint: {
    mode: "flat_config" | "legacy_eslintrc" | "none";
    config_files: string[];
    legacy_files_present: string[];
  };
  tailwindcss: {
    mode: "v4_css_first" | "v3_config_file" | "none";
    config_files: string[];
    css_entry_files: string[];
    legacy_config_present: boolean;
  };
  nextjs: {
    router_mode: "app_router" | "pages_router" | "hybrid" | "none";
    config_file: string | null;
  };
  typescript: {
    config_file: string | null;
    module_resolution: string | null;
    module: string | null;
    target: string | null;
    strict: boolean | null;
  };
  vite: {
    config_file: string | null;
  };
  python?: {
    packaging_standard: "pep621" | "poetry" | "flit" | "pipenv" | "requirements" | "none";
    config_files: string[];
    build_backend: string | null;
    uv_enabled: boolean;
  };
}

export interface DetectProjectEnvironmentOutput {
  status: ResponseStatus;
  project_path: string;
  runtime: RuntimeDetection;
  package_manager: PackageManagerDetection;
  core_dependencies: Record<string, DependencyResolution>;
  config_paradigms: ConfigParadigms;
  warnings: string[];
  guardrail_notes: string[];
}

export interface CompatibilityConflict {
  type:
    | "engine_mismatch"
    | "peer_dependency_conflict"
    | "missing_peer_dependency";
  package: string;
  peer_package?: string;
  requirement: string;
  actual: string;
  is_optional_peer?: boolean;
  source_url: string;
}

export interface DeprecationNotice {
  package: string;
  version: string;
  message: string;
  source_url: string;
}

export interface UnverifiedItem {
  package: string;
  spec: string;
  reason:
    | "LOCAL_WORKSPACE_PROTOCOL"
    | "GIT_OR_FILE_PROTOCOL"
    | "AMBIGUOUS_VERSION_RANGE"
    | "VERSION_NOT_FOUND_IN_REGISTRY"
    | "REGISTRY_FETCH_FAILED"
    | "RUNTIME_VERSION_NOT_PROVIDED";
  detail: string;
}

export interface CheckCompatibilityOutput {
  status: ResponseStatus;
  evaluated_context: {
    runtime_node: string | null;
    runtime_python?: string | null;
    evaluated_packages: Record<
      string,
      {
        input: string;
        evaluated_exact: string | null;
        resolution: "exact_input" | "registry_max_satisfying" | "unverified";
      }
    >;
  };
  compatible: boolean | null;
  conflicts: CompatibilityConflict[];
  deprecations: DeprecationNotice[];
  unverified: UnverifiedItem[];
  guardrail_notes: string[];
}
