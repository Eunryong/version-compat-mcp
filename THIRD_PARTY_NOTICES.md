# Third-Party Software & Model Notices

`setup-guard-mcp` is licensed under the [MIT License](./LICENSE). It incorporates or interacts with the following third-party open-source packages and machine learning models:

---

## 1. Runtime npm Dependencies

| Package | License | Repository |
|---|---|---|
| `@modelcontextprotocol/sdk` | MIT | https://github.com/modelcontextprotocol/typescript-sdk |
| `semver` | ISC | https://github.com/npm/node-semver |
| `yaml` | ISC | https://github.com/eemeli/yaml |
| `zod` | MIT | https://github.com/colinhacks/zod |

---

## 2. Development & Evaluation Dependencies

| Package | License | Repository |
|---|---|---|
| `typescript` | Apache-2.0 | https://github.com/microsoft/TypeScript |
| `vitest` | MIT | https://github.com/vitest-dev/vitest |
| `tsx` | MIT | https://github.com/privatenumber/tsx |
| `@types/node` | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/semver` | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |

---

## 3. Embedding Model Metadata (Phase 2 Hybrid Search)

When local query embedding is enabled (Phase 2), `setup-guard-mcp` uses the following open-weights embedding model recorded in [`seed/manifest.json`](./seed/manifest.json):

| Model | License | Source |
|---|---|---|
| `BAAI/bge-small-en-v1.5` (`Xenova/bge-small-en-v1.5` ONNX) | MIT | https://huggingface.co/BAAI/bge-small-en-v1.5 |

---

## 4. Third-Party Documentation & Index Data

For upstream documentation sources, release notes, and index attribution (`seed/index-js-ts.db` and `seed/metadata.json`), see [`NOTICE.md`](./NOTICE.md).
