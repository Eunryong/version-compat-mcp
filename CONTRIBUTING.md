# Contributing to `setup-guard-mcp`

Thank you for your interest in contributing to `setup-guard-mcp`!

## 1. Core Design Principles

Before submitting a Pull Request, please ensure your changes adhere to our core constraints:

1. **Zero-Config & No API Keys**: The default path must work locally via `npx setup-guard-mcp` without requiring external LLM API keys.
2. **Strict `stdio` Hygiene**: Never call `console.log()` or write to `process.stdout` in `src/`. Use `log()` or `logger` from `src/utils/logger.ts`, which writes to `process.stderr` only when `DEBUG="true"` is set.
3. **Structured vs. Unstructured Separation**:
   - Version compatibility (`engines.node`, `peerDependencies`, `deprecated`) and project environment detection must remain **100% deterministic** (`semver` + local file parsing).
   - Only migration guides, release note breaking-change sections, and deprecation notices pinned to immutable **Git tags** (`v15.0.3`, `v4.0.0`, etc.) belong in the SQLite FTS5 index.
4. **Epistemic Guardrails**:
   - Never silently fallback to `"latest"` when a version is ambiguous (`status: "ambiguous_version"`).
   - Never equate `0` search matches with "feature removed" (`epistemic_notice: "NO_EVIDENCE_DO_NOT_ASSUME_REMOVED"`).

## 2. Development Workflow

```bash
# Install dependencies
npm install

# Compile TypeScript and rebuild seed/index-js-ts.db
npm run build

# Run unit, fixture, and stdio protocol integration tests
npm test

# Run golden dataset retrieval & guardrail benchmark
npm run eval

# Test with official MCP Inspector CLI
npm run inspect:cli
```

## 3. Adding or Updating Library Documentation Snapshots

1. Add the Git tag and document paths to [`sources/js-ts.sources.yaml`](./sources/js-ts.sources.yaml) and [`indexer/curatedCorpus.ts`](./indexer/curatedCorpus.ts).
2. Ensure every chunk has a valid GitHub tag `source_url` and upstream license attribution.
3. Add corresponding evaluation cases to [`eval/golden-dataset.jsonl`](./eval/golden-dataset.jsonl).
4. Run `npm run build && npm test && npm run eval` and verify `version_leakage_rate === 0`.
