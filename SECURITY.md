# Security & Privacy Policy

## 1. Architectural Security Guarantees

`setup-guard-mcp` is designed with a strict local-first, read-only security posture:

1. **Zero Command Execution**: The MCP server **never executes shell commands, scripts, or codemods**. All install commands (`pnpm add`, `npm install`, `npx @next/codemod`) are returned strictly as structured text strings for review by the user and host agent.
2. **Read-Only Local File Inspection**: `detect_project_environment` and `search_versioned_docs` only read project configuration metadata (`package.json`, lockfiles, `.nvmrc`, `tsconfig.json`, and top-level ESLint/Tailwind/Next.js/Vite config files). Source code and `.env` secret files are **never** read or transmitted.
3. **Zero Telemetry & No API Keys**: The server sends no telemetry or analytics. The only outbound network requests are:
   - Read-only `GET https://registry.npmjs.org/<package>` calls (`Accept: application/vnd.npm.install-v1+json`) during `check_dependency_compatibility` (which can be disabled entirely with `SETUP_GUARD_OFFLINE=1`).
   - Optional background index freshness checks against GitHub Releases (verified via SHA-256 checksum before activation).
4. **Cryptographic Index Verification**: Any precomputed SQLite index (`index-js-ts.db`) is verified against its SHA-256 digest in `manifest.json` (`index-js-ts.db.sha256`). If a checksum mismatch is detected, the file is rejected and the server falls back to the bundled seed database.

## 2. Supported Versions

| Version | Supported |
| :--- | :--- |
| `0.1.x` | Yes |

## 3. Reporting a Vulnerability

If you discover a security vulnerability, please report it via [GitHub Security Advisories](https://github.com/Eunryong/Version-Aware-Setup/security/advisories) or open a security issue on the repository rather than posting an exploit publicly.
