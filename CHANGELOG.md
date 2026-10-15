# Changelog

All notable changes to `setup-guard-mcp` will be documented in this file.

## [0.1.0] - 2026-10-15

### Added
- **5 Core MCP Tools (`stdio` transport)**:
  - `detect_project_environment`: Deterministic detection of Node.js runtime (`.nvmrc`, `.node-version`, `volta`, `engines`), package manager (`packageManager` field, `pnpm-lock.yaml`, `bun.lock`, `yarn.lock` Classic/Berry, `package-lock.json`), locked dependency versions (`node_modules` > lockfile > `pnpm-workspace.yaml` catalog > `package.json`), and configuration paradigms (ESLint Flat Config, Tailwind CSS v4 CSS-first, Next.js App/Pages Router, `tsconfig.json`, `vite.config.*`).
  - `check_dependency_compatibility`: Deterministic `semver` verification of `engines.node`, `peerDependencies` (including optional peers and React 19 RC ranges), and `deprecated` notices against npm registry abbreviated metadata (`Accept: application/vnd.npm.install-v1+json`) with local ETag disk caching.
  - `get_versioned_setup_guide`: Version-pinned setup commands and config templates automatically formatted for `npm`, `pnpm`, `yarn`, and `bun`.
  - `get_upgrade_steps`: Tag-pinned migration steps, breaking changes, and official codemods between major versions (Tailwind v3→v4, ESLint v8→v9, Next.js 14→15, React 18→19, Vite 5→6, TypeScript 5, Node 18→22).
  - `search_versioned_docs`: Weighted SQLite FTS5 BM25 search (`unicode61` tokenizer preserving `@/_-.`) with strict major-version isolation and 2-pass `AND` → `OR` fallback.
- **Safety Guardrails**:
  - `ambiguous_version` status preventing silent `"latest"` substitution.
  - `no_results_found` epistemic notice (`NO_EVIDENCE_DO_NOT_ASSUME_REMOVED`).
  - `unsupported_library` status for out-of-scope packages.
  - Strict `stdio` hygiene (`stdout` reserved exclusively for JSON-RPC 2.0; diagnostics routed to `stderr` only when `DEBUG="true"`).
- **Host Agent Integrations**:
  - Native Google Antigravity plugin bundle (`.agents/plugins/setup-guard/`), `/setup-guard` skill, and `GEMINI.md`.
  - OpenAI Codex `AGENTS.md` workflow rules.
  - Comprehensive fixture suite (`fixtures/`), unit/protocol integration tests (`tests/`), and golden dataset evaluation benchmark (`eval/`).
