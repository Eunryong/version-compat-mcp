import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prefetchIndexInBackground } from "./cache/indexManager.js";
import { handleCheckDependencyCompatibility } from "./tools/checkCompatibility.js";
import { handleDetectProjectEnvironment } from "./tools/detectProjectEnv.js";
import { handleGetSetupGuideForMcp } from "./tools/mcpToolWrappers.js";
import {
  CheckDependencyCompatibilityInputSchema,
  DetectProjectEnvironmentInputSchema,
  GetUpgradeStepsInputSchema,
  GetVersionedSetupGuideInputSchema,
  SearchVersionedDocsInputSchema,
} from "./types/schemas.js";
import { handleGetUpgradeSteps } from "./tools/getUpgradeSteps.js";
import { handleSearchVersionedDocs } from "./tools/searchVersionedDocs.js";

const SERVER_INSTRUCTIONS = `
version-compat-mcp supplies deterministic, version-grounded setup, compatibility, and migration facts for JS/TS (Node.js, TypeScript, React, Next.js, Vite, Tailwind CSS, ESLint) and Python (Python 3.10-3.13, Pydantic, FastAPI, SQLAlchemy, LangChain, uv, Poetry, pip) ecosystems.

Mandatory workflow for host agents (Google Antigravity, OpenAI Codex, Claude Code, Cursor):
1. Before suggesting package install commands, config files, or framework migrations, call 'detect_project_environment' on the workspace root to determine the exact package manager (npm/pnpm/yarn/bun/uv/poetry/pip), installed dependency versions, and config paradigms (e.g., ESLint Flat Config, Tailwind v4 CSS-first, pyproject.toml PEP 621).
2. Before proposing dependency version changes or major upgrades, call 'check_dependency_compatibility' to verify engines.node / requires_python, peerDependencies, and deprecations against npm / PyPI.
3. Use 'get_versioned_setup_guide', 'get_upgrade_steps', and 'search_versioned_docs' to retrieve tag-pinned official documentation chunks with source_url citations.
4. Safety Guardrails:
   - Never silently assume 'latest' when a version is unknown or ambiguous.
   - Never assume a feature/API was removed just because search results are empty.
   - Always cite 'source_url' and state the 'resolved_version' in your response.
`.trim();

export function createVersionCompatServer(): McpServer {
  const server = new McpServer(
    {
      name: "version-compat-mcp",
      version: "0.2.0",
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  // Trigger non-blocking index check/prefetch in background so initialize handshake is instant (<50ms)
  prefetchIndexInBackground();

  server.tool(
    "detect_project_environment",
    "Detects Node.js & Python runtime, package manager (npm/pnpm/yarn/bun/uv/poetry/pip), locked dependency versions, and config paradigms (ESLint flat config, Tailwind v4 CSS-first, Next.js App/Pages router, tsconfig, pyproject.toml PEP 621) from local project files without network calls.",
    DetectProjectEnvironmentInputSchema.shape,
    async (args) => {
      const result = handleDetectProjectEnvironment(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "check_dependency_compatibility",
    "Verifies engines.node, peerDependencies cross-compatibility, and deprecation notices deterministically using npm registry abbreviated metadata.",
    CheckDependencyCompatibilityInputSchema.shape,
    async (args) => {
      const result = await handleCheckDependencyCompatibility(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_versioned_setup_guide",
    "Returns citation-backed installation commands (formatted for the project's package manager), initial configuration file examples, and obsolete patterns to avoid for a specific library version.",
    GetVersionedSetupGuideInputSchema.shape,
    async (args) => {
      const result = await handleGetSetupGuideForMcp(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_upgrade_steps",
    "Retrieves step-by-step migration guides, breaking changes, and official codemod commands between two versions of a library (e.g. Tailwind v3 -> v4, ESLint v8 -> v9, Next.js v14 -> v15) with GitHub tag source URLs.",
    GetUpgradeStepsInputSchema.shape,
    async (args) => {
      const result = await handleGetUpgradeSteps(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "search_versioned_docs",
    "Searches tag-pinned migration guides, release notes, and deprecation notices for a specific library version using SQLite FTS5 (BM25). Resolves version from project_path lockfile if version is omitted.",
    SearchVersionedDocsInputSchema.shape,
    async (args) => {
      const result = await handleSearchVersionedDocs(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  return server;
}
