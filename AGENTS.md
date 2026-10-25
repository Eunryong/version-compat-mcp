# Version-Aware Setup & Migration Rules (`version-compat-mcp`)

This rule file applies to **OpenAI Codex (Codex CLI / App)**, **Google Antigravity (AGY)**, and other `AGENTS.md`-compatible coding agents.

## Mandatory Tool Workflow Before Suggesting Setup or Upgrades

Whenever a task involves **installing packages**, **creating/modifying tool configuration files** (`eslint`, `tailwindcss`, `next`, `vite`, `typescript`, `pyproject.toml`), or **upgrading major versions**:

1. **Detect Local Environment First (`detect_project_environment`)**
   - Always call `detect_project_environment` with `project_path` before proposing CLI commands or configuration files.
   - Use the detected `package_manager` (`npm`, `pnpm`, `yarn`, `bun`, `uv`, `poetry`, `pip`) and its `command_templates` (`pnpm add -D`, `uv add`, `poetry add`, etc.). Never default to `npm` or `pip` if the project uses `pnpm`, `yarn`, `bun`, `uv`, or `poetry`.
   - Respect `config_paradigms`:
     - If `eslint.mode` is `"flat_config"` (or ESLint >= 9), never suggest `.eslintrc.*` or `.eslintignore`.
     - If `tailwindcss.mode` is `"v4_css_first"` (or Tailwind CSS >= 4), never suggest `npx tailwindcss init`, `tailwind.config.js`, or `@tailwind base` directives.
     - If `python.packaging` is `"pep621"` (or using `uv`/modern `pyproject.toml`), prefer `[project]` tables and `uv add` over legacy `setup.py` or unstructured `requirements.txt`.

2. **Verify Compatibility Deterministically (`check_dependency_compatibility`)**
   - Before suggesting dependency upgrades or installing peer-coupled libraries (e.g., `next`, `react`, `react-dom`, `eslint`, `fastapi`, `pydantic`, `sqlalchemy`), call `check_dependency_compatibility` with the project's runtime (`runtime_version` or `runtime_python`) and dependency map.
   - Report any `engine_mismatch`, `peer_dependency_conflict`, or `deprecations` with their `source_url`.

3. **Ground Setup & Migration Steps in Tag-Pinned Docs (`get_versioned_setup_guide`, `get_upgrade_steps`, `search_versioned_docs`)**
   - Do not rely on frozen pre-training weights for version-sensitive APIs (such as Next.js 15 async `cookies()`/`headers()`/`params`, Tailwind v4 `@theme` and `@tailwindcss/vite`, Pydantic v2 `ConfigDict` and `model_validator`, or FastAPI `lifespan`).
   - Always cite the returned `source_url` and state the `resolved_version` used.

4. **Strict Safety Guardrails**
   - Never silently assume `"latest"` when a version is unknown or ambiguous.
   - Never conclude that an API or option was removed solely because `search_versioned_docs` returned 0 matches.
   - Return shell/codemod commands for user review rather than executing destructive migrations unprompted.
