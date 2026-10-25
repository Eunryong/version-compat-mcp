---
trigger: always_on
description: Enforce version-aware setup, package manager accuracy, and migration checks via version-compat-mcp in Google Antigravity.
---

# Antigravity Version-Aware Setup & Compatibility (`GEMINI.md`)

When assisting with JavaScript/TypeScript and Python project setup, configuration, or dependency upgrades:

1. **Environment Detection First**: Call `detect_project_environment` before suggesting any `npm`/`pnpm`/`yarn`/`bun`/`uv`/`poetry`/`pip` commands or editing `eslint.config.*`, `tailwind.config.*`, `next.config.*`, `vite.config.*`, `tsconfig.json`, or `pyproject.toml`.
2. **Compatibility Verification**: Call `check_dependency_compatibility` to validate `engines.node` / `requires_python`, `peerDependencies`, and `deprecated` status from npm / PyPI.
3. **Citation-Backed Setup & Migration**: Use `get_versioned_setup_guide`, `get_upgrade_steps`, and `search_versioned_docs` to retrieve tag-pinned documentation chunks. Always include the `source_url` and `resolved_version` in your explanation.
4. **Guardrails**:
   - Do not silently default to `"latest"` when versions are ambiguous.
   - Do not assume an API was removed if search results are empty (`NO_EVIDENCE_DO_NOT_ASSUME_REMOVED`).
