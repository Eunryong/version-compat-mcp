# setup-guard-mcp

> **"Your agent reads the wrong docs. `setup-guard` makes it read the right version."**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.5.0-brightgreen.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Stdio%20Server-purple.svg)](https://modelcontextprotocol.io/)
[![Zero Config](https://img.shields.io/badge/API%20Key-Not%20Required-success.svg)](#1-why-setup-guard-mcp)

**Version-Aware Setup, Dependency Compatibility & Migration MCP Server for the JavaScript/TypeScript Ecosystem.**

`setup-guard-mcp` is not a generic documentation search engine. It is a local Model Context Protocol (MCP) server that analyzes your project's **actual Node.js runtime, package manager (`npm`/`pnpm`/`yarn`/`bun`), lockfile versions, and configuration files** to supply deterministic compatibility checks and tag-pinned migration facts to AI coding agents (**Google Antigravity**, **OpenAI Codex**, **Cursor**, **Claude Code**).

---

## Table of Contents

1. [Why `setup-guard-mcp`? (And How It Differs from Generic Doc MCPs)](#1-why-setup-guard-mcp-and-how-it-differs-from-generic-doc-mcps)
2. [Core Architecture](#2-core-architecture)
3. [Supported Libraries & Versions](#3-supported-libraries--versions)
4. [Quick Start & Host Agent Configuration](#4-quick-start--host-agent-configuration)
   - [Google Antigravity (AGY)](#a-google-antigravity-agy)
   - [OpenAI Codex (CLI & Desktop App)](#b-openai-codex-cli--desktop-app)
   - [Cursor](#c-cursor)
   - [Claude Code & Claude Desktop](#d-claude-code--claude-desktop)
5. [MCP Tools Reference (5 Tools)](#5-mcp-tools-reference-5-tools)
6. [Real-World Prompt Examples](#6-real-world-prompt-examples)
7. [Safety & Epistemic Guardrails](#7-safety--epistemic-guardrails)
8. [Data Collection, Upstream Licenses & Attribution Policy](#8-data-collection-upstream-licenses--attribution-policy)
9. [Privacy & Security Policy](#9-privacy--security-policy)
10. [Known Limitations & Roadmap](#10-known-limitations--roadmap)
11. [Testing with MCP Inspector & Evaluation Suite](#11-testing-with-mcp-inspector--evaluation-suite)
12. [License](#12-license)

---

## 1. Why `setup-guard-mcp`? (And How It Differs from Generic Doc MCPs)

Because LLM pre-training weights are frozen at a cutoff date, coding agents routinely make costly setup and migration errors:

- **Tailwind CSS v4 vs. v3**: Proposing `npx tailwindcss init -p`, `tailwind.config.js`, and `@tailwind base;` in a **Tailwind CSS v4** project (which uses `@import "tailwindcss";` and `@tailwindcss/vite` or `@tailwindcss/postcss`).
- **ESLint v9 vs. v8**: Generating legacy `.eslintrc.json` or `.eslintignore` files in an **ESLint v9** project that requires `eslint.config.mjs` (Flat Config).
- **Next.js 15 & React 19**: Using synchronous `cookies()`, `headers()`, or `params` in **Next.js 15** (where Dynamic Request APIs are asynchronous `Promise`s), or proposing incompatible React 18 / Node.js combinations.
- **Package Manager Mismatch**: Suggesting `npm install` in a repository locked with `pnpm-lock.yaml`, `bun.lock`, or `yarn.lock`.

### How `setup-guard-mcp` Differs from General Documentation MCPs (e.g., Context7)

| Dimension | Generic Documentation MCPs | `setup-guard-mcp` |
| :--- | :--- | :--- |
| **Primary Goal** | Retrieve general API docs & tutorials | **Ground setup, compatibility & major version migrations in actual project state** |
| **Project Awareness** | Unaware of local lockfiles, `.nvmrc`, or config style | Parses `package.json`, lockfiles, `.nvmrc`, `eslint.config.*`, `tsconfig.json` locally |
| **Compatibility Logic** | Probabilistic text search | **Deterministic `semver` verification** against npm registry (`engines`, `peerDependencies`, `deprecated`) |
| **Corpus Scope** | Broad tutorials & full API reference | Strictly **tag-pinned migration guides, breaking changes, and deprecations** |
| **Failure Mode** | Silently defaults to `"latest"` or hallucinates | Explicit guardrails (`ambiguous_version`, `NO_EVIDENCE_DO_NOT_ASSUME_REMOVED`) |

---

## 2. Core Architecture

```mermaid
flowchart LR
    Agent["Host Agent<br/>(Antigravity / Codex / Cursor / Claude)"] <-->|"JSON-RPC 2.0 (stdio)"| Server["setup-guard-mcp"]

    subgraph Deterministic["1. Deterministic Engine (Zero RAG / Zero Hallucination)"]
        Local["Local File & Lockfile Parser<br/>package.json, pnpm-lock.yaml,<br/>bun.lock, yarn.lock, .nvmrc"]
        Registry["npm Registry Abbreviated API<br/>engines.node, peerDependencies,<br/>deprecated (+ ETag Disk Cache)"]
    end

    subgraph Retrieval["2. Tag-Pinned Retrieval Engine (SQLite FTS5 BM25)"]
        SeedDB["Precomputed SQLite FTS5 Index<br/>(seed/index-js-ts.db + SHA-256 Verify)"]
        Corpus["Git-Tag Snapshots Only:<br/>Migration Guides, Breaking Changes,<br/>Deprecations & Setup Templates"]
    end

    Server --> Local
    Server --> Registry
    Server --> SeedDB
    Corpus --> SeedDB
```

1. **Strict Separation of Structured vs. Unstructured Data**: Structured data (`package.json`, lockfiles, npm registry metadata) is evaluated deterministically without RAG. Unstructured docs (migration guides, breaking changes) are indexed by immutable Git tags in SQLite FTS5.
2. **Zero-Config & Precomputed Index**: Built on Node.js native `node:sqlite` (`DatabaseSync` with `FTS5` and `unicode61 tokenchars '@/_-.'`)—requiring **zero API keys** and **zero C++ `node-gyp` compilation** during `npx` execution.
3. **Strict `stdio` Protocol Hygiene**: `stdout` is strictly reserved for JSON-RPC 2.0 frames. Accidental `console.log` calls are intercepted, and internal diagnostics write exclusively to `process.stderr` only when `DEBUG="true"` is set.

---

## 3. Supported Libraries & Versions

| Library | Canonical ID | Indexed Major Versions | Key Migration & Setup Coverage |
| :--- | :--- | :--- | :--- |
| **Next.js** | `nextjs` | `v13`, `v14`, `v15` | Async `cookies()`/`headers()`/`params`, `fetch` caching defaults, React 19 peer deps, `@next/codemod` |
| **React** | `react` | `v18`, `v19` | `ref` as a prop (`forwardRef` deprecation), `ReactDOMTestUtils.act` removal, `useActionState`, TypeScript codemods |
| **Tailwind CSS** | `tailwindcss` | `v3`, `v4` | `@import "tailwindcss"`, `@theme` CSS-first config, `@tailwindcss/vite`, `@tailwindcss/postcss`, `@tailwindcss/upgrade` |
| **ESLint** | `eslint` | `v8`, `v9` | `eslint.config.mjs` Flat Config default, `.eslintignore` removal, `@eslint/migrate-config`, `typescript-eslint` |
| **Vite** | `vite` | `v5`, `v6` | Node.js `>=18`/`20`/`22` requirements, Environment API, Sass modern API default, CJS Node API removal |
| **TypeScript** | `typescript` | `v5` | `moduleResolution: "bundler"`, `verbatimModuleSyntax` (`importsNotUsedAsValues` deprecation) |
| **Node.js** | `node` | `v18`, `v20`, `v22` | `engines.node` compatibility, `require(esm)` stabilization, built-in `node:sqlite` |

**Supported Package Managers**: `npm`, `pnpm` (v6–v9 + `pnpm-workspace.yaml` catalogs), `yarn` (Classic v1 & Berry v2+), `bun` (`bun.lock` & `bun.lockb`).

---

## 4. Quick Start & Host Agent Configuration

### Prerequisites
- **Node.js**: `>= 22.5.0`

### A. Google Antigravity (AGY)

**Global MCP Config (`~/.gemini/config/mcp_config.json`):**
```json
{
  "mcpServers": {
    "setup-guard": {
      "command": "npx",
      "args": ["-y", "setup-guard-mcp"]
    }
  }
}
```
> **Workspace Plugin**: This repository also includes a native Antigravity plugin at [`.agents/plugins/setup-guard/`](./.agents/plugins/setup-guard/) and workspace rules in [`GEMINI.md`](./GEMINI.md).

### B. OpenAI Codex (CLI & Desktop App)

```bash
codex mcp add setup-guard -- npx -y setup-guard-mcp
```
Or in `~/.codex/config.toml`:
```toml
[mcp_servers.setup-guard]
command = "npx"
args = ["-y", "setup-guard-mcp"]
startup_timeout_sec = 15
tool_timeout_sec = 30
enabled = true
```

### C. Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):
```json
{
  "mcpServers": {
    "setup-guard": {
      "command": "npx",
      "args": ["-y", "setup-guard-mcp"]
    }
  }
}
```
*(For local development before npm publish, use `"command": "node"` and `"args": ["/absolute/path/to/setup-guard-mcp/dist/index.js"]`.)*

### D. Claude Code & Claude Desktop

```bash
claude mcp add setup-guard -- npx -y setup-guard-mcp
```

---

## 5. MCP Tools Reference (5 Tools)

| Tool Name | Data Source | Description |
| :--- | :--- | :--- |
| **`detect_project_environment`** | Local file parser (Offline) | Detects Node.js version (`.nvmrc`, `.node-version`, `volta`, `engines`), package manager (`packageManager` > lockfile), locked versions (`node_modules` > lockfile > `package.json`), and config paradigms (`flat_config`, `v4_css_first`, `app_router`). |
| **`check_dependency_compatibility`** | npm Registry API + `semver` | Verifies `engines.node`, `peerDependencies`, and `deprecated` status deterministically with ETag caching. Reports `conflict`, `warning`, or `unverified` (`workspace:*`). |
| **`get_versioned_setup_guide`** | SQLite FTS5 + PM Translator | Returns version-pinned install commands formatted for the project's package manager (`pnpm add -D`, `bun add`, etc.), config templates, and obsolete patterns to avoid. |
| **`get_upgrade_steps`** | SQLite FTS5 (Tag-Pinned) | Retrieves ordered migration steps, breaking changes, and official codemod commands between `from_version` and `to_version` with GitHub tag `source_url` citations. |
| **`search_versioned_docs`** | SQLite FTS5 BM25 | Searches tag-pinned migration guides, release notes, and deprecations for a specific library version (auto-resolving version from `project_path` if omitted). |

---

## 6. Real-World Prompt Examples

Once `setup-guard-mcp` is connected to Cursor, Claude Code, Codex, or Antigravity, try asking:

1. **Environment & Compatibility Audit**
   > *"Check the current project's Next.js, React, and Node.js versions using `setup-guard` and let me know if there are any peerDependency or engine compatibility issues."*
2. **Tailwind CSS v3 → v4 Upgrade**
   > *"We want to upgrade Tailwind CSS from v3.4 to v4.0 in this repository. Inspect our project environment first, then give me the exact migration steps, config changes, and commands for our package manager with official source URLs."*
3. **ESLint v8 → v9 Flat Config Migration**
   > *"Migrate our `.eslintrc.json` and `.eslintignore` setup to ESLint v9 Flat Config. Cite the official ESLint v9 migration docs."*
4. **Next.js 14 → 15 Breaking Changes**
   > *"What breaking changes affect `cookies()`, `headers()`, and `params` when upgrading from Next.js 14.2 to 15.0, and what is the official codemod command?"*

---

## 7. Safety & Epistemic Guardrails

- **No Silent `"latest"` Substitution (`status: "ambiguous_version"`)**: When a version is omitted without a `project_path`, or spans multiple majors (`>=13.0.0 <16.0.0`), the server refuses to guess `"latest"` and returns candidate versions.
- **Zero Search Results ≠ Feature Removed (`status: "no_results_found"`)**: Returns `epistemic_notice: "NO_EVIDENCE_DO_NOT_ASSUME_REMOVED"` so the host agent never falsely claims an API was removed simply because no breaking-change chunk matched.
- **Explicit Unsupported Scope (`status: "unsupported_library"`)**: Immediately identifies libraries outside the 7 supported targets.
- **Read-Only Execution**: Commands and codemods are returned as strings; the server never executes shell commands.

---

## 8. Documentation Sources and Data Policy

- `setup-guard-mcp` does **not** claim ownership of third-party documentation.
- Every search result and migration guide step includes original `source_url` links and version metadata (`git_tag`, `version`, `collected_at`, `upstream_license`).
- Indexed documents are strictly limited to migration guides, release notes, deprecation notices, and compatibility-related content. Full documentation websites and general tutorials are excluded.
- Documentation sources are collected from official repositories or official documentation sites pinned to immutable Git tags (recorded in [`seed/metadata.json`](./seed/metadata.json)).
- Third-party documentation remains subject to its original license, terms of service, and copyright policy. See [`NOTICE.md`](./NOTICE.md) and [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for complete attribution details.
- Upstream maintainers can request modification or removal of any indexed snapshot by opening an issue at [https://github.com/Eunryong/setup-guard-mcp/issues](https://github.com/Eunryong/setup-guard-mcp/issues).

---

## 9. Privacy & Security Policy

- **100% Local Execution**: Runs locally on your machine over `stdio`. No source code or `.env` files are ever read or uploaded.
- **No Telemetry**: Zero analytics or tracking. Outbound network calls are limited to npm registry metadata lookups (`registry.npmjs.org`) and can be disabled completely via `SETUP_GUARD_OFFLINE=1`.
- **SHA-256 Integrity**: Precomputed index databases are verified against [`seed/index-js-ts.db.sha256`](./seed/index-js-ts.db.sha256) and [`seed/manifest.json`](./seed/manifest.json) before loading.
- See [`SECURITY.md`](./SECURITY.md) for full details.

---

## 10. Known Limitations & Roadmap

- **Current Scope (Phase 1)**: Focused on the 7 core JS/TS libraries (`node`, `typescript`, `react`, `nextjs`, `vite`, `tailwindcss`, `eslint`) using SQLite FTS5 BM25 keyword/symbol retrieval.
- **Phase 2 Roadmap**: Hybrid retrieval combining BM25 with local ONNX query embeddings (`transformers.js` + `sqlite-vec` using `Xenova/bge-small-en-v1.5`) and automated GitHub Actions release asset index updates.
- **Phase 3 Roadmap**: Modular ecosystem collections (`@setup-guard/mcp-core` + on-demand ecosystem indexes) so large ecosystems can be downloaded selectively into `~/.cache/setup-guard-mcp/`.

---

## 11. Testing with MCP Inspector & Evaluation Suite

```bash
# Build TypeScript + SQLite FTS5 seed index (manifest.json, index-js-ts.db.sha256, metadata.json)
npm run build

# Run unit tests, 8 fixture project tests, safety guardrail tests, and stdio integration test
npm test

# Run golden dataset retrieval & guardrail benchmark (Recall@1, Recall@5, MRR@10, Leakage)
npm run eval

# Verify MCP protocol via official MCP Inspector CLI
npm run inspect:cli

# Launch interactive MCP Inspector Web UI
npm run inspect

# Verify npm package tarball before publishing
npm pack --dry-run
```

---

## 12. License

MIT License. See [`LICENSE`](./LICENSE) for details.
For third-party documentation and software/model attribution, see [`NOTICE.md`](./NOTICE.md) and [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
