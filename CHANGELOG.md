# Changelog

All notable changes to `version-compat-mcp` will be documented in this file.

## [0.2.0] - 2026-10-25

### Added
- **Python Ecosystem Support**:
  - Full support for Python runtimes (`python` 3.10, 3.11, 3.12, 3.13) detected via `.python-version`, `pyproject.toml`, `Pipfile`, `.tool-versions`, and `runtime.txt`.
  - Python package manager detection and command templates for `uv`, `poetry`, and `pip`, including bidirectional npm-to-python command translations.
  - Dependency parsing for `uv.lock`, `poetry.lock`, `requirements.txt`, and `pyproject.toml` (PEP 621 dependencies & optional-dependencies).
  - Packaging configuration paradigm detection (`pep621`, `poetry`, `flit`, `pipenv`, `requirements`, build backend, and `uv_enabled`).
  - PyPI compatibility verification via `pypiRegistryClient` checking `requires_python` against project Python runtime, PEP 440 range satisfaction, disk/memory caching with HTTP ETag/Conditional GET, and yanked release detection.
  - Curated setup guides, migration steps, and tag-pinned docs for **FastAPI** (lifespan handlers vs deprecated on_event), **Pydantic** (v1 to v2 migration, ConfigDict, model_validator), **SQLAlchemy** (2.0 declarative base and select execution), **LangChain** (0.1, 0.2, 0.3 modular split), and **uv** (workspaces, inline script metadata).
  - Golden evaluation cases expanded to 28 queries with 100% Recall@1, 3, 5 and MRR@10.

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
  - Google Antigravity workspace rules (`GEMINI.md`) and OpenAI Codex rules (`AGENTS.md`).
  - Comprehensive fixture suite (`fixtures/`), unit/protocol integration tests (`tests/`), and golden dataset evaluation benchmark (`eval/`).
