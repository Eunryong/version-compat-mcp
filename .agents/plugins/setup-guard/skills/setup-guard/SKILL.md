---
name: setup-guard
description: Version-aware setup, dependency compatibility verification, and major migration guidance for JS/TS projects (Node.js, TypeScript, React, Next.js, Vite, Tailwind CSS, ESLint). Trigger whenever installing packages, creating config files, upgrading major versions, or debugging peerDependency/engine errors.
---

# Setup-Guard MCP Skill

Always ground your JS/TS setup and upgrade recommendations in actual project state using the `setup-guard` MCP tools:

1. **Before running install commands or creating config files**:
   - Call `detect_project_environment({ project_path })` to inspect `package.json`, lockfiles (`pnpm-lock.yaml`, `bun.lock`, `yarn.lock`, `package-lock.json`), `.nvmrc`, and existing config paradigms (`flat_config` vs `legacy_eslintrc`, Tailwind `v4_css_first` vs `v3_config_file`).
2. **Before suggesting framework setup**:
   - Call `get_versioned_setup_guide({ library, target_version, package_manager, runtime_version })` to get citation-backed commands and configuration templates.
3. **Before major version upgrades**:
   - Call `get_upgrade_steps({ library, from_version, to_version })` and `check_dependency_compatibility` to verify `engines.node`, `peerDependencies`, and breaking changes.
4. **Safety Rules**:
   - Never assume `latest` when a version is unspecified or ambiguous (`status: "ambiguous_version"`).
   - Never conclude a feature was removed solely because `search_versioned_docs` returned 0 results (`status: "no_results_found"`).
   - Always cite `resolved_version` and `source_url`.
