import { z } from "zod";

export const DetectProjectEnvironmentInputSchema = z.object({
  project_path: z
    .string()
    .min(1)
    .describe(
      "Absolute path to the project or workspace package root directory (containing package.json or pyproject.toml / uv.lock / requirements.txt)"
    ),
});

export const CheckDependencyCompatibilityInputSchema = z.object({
  dependencies: z
    .record(z.string(), z.string())
    .describe(
      'Map of production dependencies and their version or range (e.g. {"next": "15.0.3", "react": "18.2.0"} or {"pydantic": "2.10.6", "fastapi": "0.115.6"})'
    ),
  devDependencies: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      'Optional map of devDependencies and their version or range (e.g. {"eslint": "9.14.0", "typescript": "5.7.2"} or {"pytest": "8.3.0", "ruff": "0.8.0"})'
    ),
  runtime_version: z
    .string()
    .optional()
    .describe(
      'Target runtime version (e.g. Node.js "20.11.0" or Python "3.12.0"). If omitted, runtime checks are reported as unverified.'
    ),
  ecosystem: z
    .enum(["npm", "pypi"])
    .optional()
    .describe(
      'Target package registry ecosystem ("npm" or "pypi"). Auto-detected if omitted based on dependencies and runtime.'
    ),
});

export const GetVersionedSetupGuideInputSchema = z.object({
  library: z
    .string()
    .min(1)
    .describe(
      "Target library name (supported: node, typescript, react, nextjs, vite, tailwindcss, eslint, python, pydantic, fastapi, sqlalchemy, langchain, uv)"
    ),
  target_version: z
    .string()
    .min(1)
    .describe(
      'Target version to set up (e.g. "4.0.0", "15.0.3", "9.14.0", "2.10.6", "0.115.6"). Do NOT pass "latest" without checking project versions.'
    ),
  package_manager: z
    .enum(["npm", "pnpm", "yarn", "bun", "uv", "poetry", "pip"])
    .describe("Project package manager detected from detect_project_environment"),
  runtime_version: z
    .string()
    .optional()
    .describe('Optional runtime version (e.g. Node "20.11.0" or Python "3.12.0")'),
  framework_context: z
    .enum([
      "nextjs",
      "vite",
      "react",
      "postcss",
      "standalone",
      "fastapi",
      "django",
      "flask",
    ])
    .optional()
    .describe(
      "Optional host framework context (e.g. setting up tailwindcss v4 inside vite vs nextjs, or pydantic v2 inside fastapi)"
    ),
});

export const GetUpgradeStepsInputSchema = z.object({
  library: z
    .string()
    .min(1)
    .describe(
      "Target library name (supported: node, typescript, react, nextjs, vite, tailwindcss, eslint, python, pydantic, fastapi, sqlalchemy, langchain, uv)"
    ),
  from_version: z
    .string()
    .min(1)
    .describe('Current version before upgrade (e.g. "3.4.1", "8.57.0", "14.2.0", "1.10.19")'),
  to_version: z
    .string()
    .min(1)
    .describe('Target version after upgrade (e.g. "4.0.0", "9.14.0", "15.0.3", "2.10.6")'),
  focus_area: z
    .string()
    .optional()
    .describe(
      'Optional keyword or section filter (e.g. "flat config", "caching", "async request", "model_dump", "lifespan", "select")'
    ),
  package_manager: z
    .enum(["npm", "pnpm", "yarn", "bun", "uv", "poetry", "pip"])
    .optional()
    .describe(
      "Optional package manager to format codemod and upgrade commands accurately"
    ),
});

export const SearchVersionedDocsInputSchema = z.object({
  library: z
    .string()
    .min(1)
    .describe(
      "Target library name (supported: node, typescript, react, nextjs, vite, tailwindcss, eslint, python, pydantic, fastapi, sqlalchemy, langchain, uv)"
    ),
  version: z
    .string()
    .optional()
    .describe(
      'Target library version (e.g. "15.0.3", "4.0.0", "2.10.6"). If omitted, project_path must be provided to resolve version from lockfile/config.'
    ),
  project_path: z
    .string()
    .optional()
    .describe(
      "Optional path to the project root so the tool can resolve the installed version from lockfile/package.json when version is omitted."
    ),
  query: z
    .string()
    .min(1)
    .describe(
      "Search query: config key, API symbol, error message, or migration topic"
    ),
  doc_types: z
    .array(
      z.enum(["migration_guide", "release_note", "deprecation", "setup_guide"])
    )
    .optional()
    .describe("Optional filter by document type"),
  top_k: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .optional()
    .describe("Maximum number of chunks to return (default: 5)"),
});
