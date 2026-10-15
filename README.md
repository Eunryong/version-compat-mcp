# setup-guard-mcp

> **Version-Aware Setup & Migration MCP Server (JS/TS)**  
> AI 코딩 에이전트(**Google Antigravity**, **OpenAI Codex**, **Claude Code**, **Cursor**)가 학습 시점 한계로 인해 구버전 설정(`tailwind.config.js`, `.eslintrc.json`)이나 호환되지 않는 버전 조합, 잘못된 패키지 매니저 명령어를 제안하는 문제를 해결하는 **Zero-Config 로컬 MCP 서버**입니다.

Repository: [https://github.com/Eunryong/Version-Aware-Setup](https://github.com/Eunryong/Version-Aware-Setup)

---

## 1. 핵심 설계 철학 (Why `setup-guard-mcp`?)

단순히 "최신 문서를 검색해주는 RAG 도구"가 아니라, **"현재 프로젝트의 실제 버전 조합과 설정 패러다임을 기준으로 근거 있는 세팅/업그레이드 정보를 공급하는 결정론적 + 하이브리드 검색 도구"**입니다.

1. **Zero-Config & No API Key (`npx setup-guard-mcp`)**
   - 원격 서버나 OpenAI/Anthropic/Cohere API 키 없이 로컬 `stdio` 프로세스로 즉시 동작합니다.
   - GitHub Actions CI에서 사전 빌드된 SQLite FTS5 인덱스(`seed/index-js-ts.db`)를 내장 및 캐시(`~/.cache/setup-guard-mcp/`)하여 첫 실행 시에도 지연(Cold-start block) 없이 응답합니다.
2. **정형 데이터(결정론적 검증)와 비정형 문서(태그 고정 검색)의 엄격한 분리**
   - **정형 데이터 (No RAG / 환각 0%)**: 로컬 `package.json`, Lockfile(`pnpm-lock.yaml`, `bun.lock`, `yarn.lock`, `package-lock.json`), `.nvmrc`, `tsconfig.json` 파싱 + npm registry abbreviated metadata API(`engines`, `peerDependencies`, `deprecated`) 직접 대조.
   - **비정형 문서 (SQLite FTS5 BM25)**: GitHub 태그(`v15.0.0`, `v4.0.0`, `v9.0.0` 등)에 고정된 공식 Migration Guide, Breaking Changes, Deprecation 문서만 선별 인덱싱.
3. **안전장치 정책 (Safety Guardrails)**
   - **No Silent Latest Fallback**: 버전이 불명확하거나 다중 메이저 범위(`>=13.0.0 <16.0.0`)일 때 임의로 최신 버전을 가정하지 않고 `ambiguous_version` 상태를 반환합니다.
   - **Zero-Hit ≠ Removed**: 검색 결과가 0건(`no_results_found`)일 때 에이전트가 "해당 기능이 삭제되었다"고 단정하지 못하도록 명시적 `epistemic_notice` 가드레일을 반환합니다.
   - **출처 및 해석 버전 강제 명시**: 모든 가이드는 `resolved_version`, `git_tag`, `source_url`을 포함합니다.

---

## 2. 호스트 에이전트 연동 가이드 (Antigravity / Codex / Claude Code / Cursor)

### A. Google Antigravity (AGY) 연동

**1) 전역 MCP 설정 (`~/.gemini/antigravity/mcp_config.json`)**
```json
{
  "mcpServers": {
    "setup-guard": {
      "command": "npx",
      "args": ["-y", "setup-guard-mcp"],
      "env": {
        "SETUP_GUARD_OFFLINE": "0"
      }
    }
  }
}
```
> 로컬 클론 경로에서 직접 실행하려면 `"command": "node"`, `"args": ["/절대/경로/Version-Aware-Setup/dist/index.js"]`로 설정할 수 있습니다.

**2) Antigravity 규칙 및 플러그인**
- 프로젝트 루트의 [`GEMINI.md`](./GEMINI.md) 및 [`.agents/plugins/setup-guard/`](./.agents/plugins/setup-guard/)가 포함되어 있어, Antigravity가 패키지 설치·설정 파일 생성·메이저 업그레이드 시 자동으로 `setup-guard` 도구를 먼저 호출합니다.

---

### B. OpenAI Codex (Codex CLI / Desktop App) 연동

**1) CLI 명령어로 즉시 등록**
```bash
codex mcp add setup-guard -- npx -y setup-guard-mcp
```

**2) `~/.codex/config.toml` 직접 설정**
```toml
[mcp_servers.setup-guard]
command = "npx"
args = ["-y", "setup-guard-mcp"]
startup_timeout_sec = 15
tool_timeout_sec = 30
enabled = true

[mcp_servers.setup-guard.env]
SETUP_GUARD_OFFLINE = "0"
```

**3) `AGENTS.md` 자동 인식**
- 저장소 루트의 [`AGENTS.md`](./AGENTS.md)에 정의된 워크플로우를 통해 Codex가 명령어 제안 전 반드시 `detect_project_environment`로 패키지 매니저(`pnpm`/`npm`/`yarn`/`bun`)와 버전을 먼저 확인합니다.

---

### C. Claude Code / Cursor 연동

- **Claude Code**:
  ```bash
  claude mcp add setup-guard -- npx -y setup-guard-mcp
  ```
- **Cursor (`.cursor/mcp.json`)**:
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

---

## 3. 제공되는 5개 MCP Tool

| Tool 이름 | 데이터 소스 | 핵심 역할 |
| :--- | :--- | :--- |
| `detect_project_environment` | 로컬 파일 파싱 (네트워크 불필요) | Node 버전(`.nvmrc`, `volta`, `engines`), 패키지 매니저(`packageManager` > Lockfile), 7대 코어 라이브러리 실제 버전(`node_modules` > Lockfile > `package.json`), 설정 패러다임(ESLint `flat_config`, Tailwind `v4_css_first`, Next.js `app_router`) 탐지 |
| `check_dependency_compatibility` | npm Registry REST API + `semver` | `engines.node`, `peerDependencies`, `deprecated` 메타데이터를 실시간/캐시 대조하여 버전 충돌(`conflict`), 경고(`warning`), 미확인(`unverified`) 판정 |
| `get_versioned_setup_guide` | SQLite FTS5 + PM 명령어 변환기 | 타겟 메이저 버전 및 프로젝트 패키지 매니저(`npm`/`pnpm`/`yarn`/`bun`)에 맞춘 설치 명령어, 설정 파일 템플릿, 출처 URL 반환 |
| `get_upgrade_steps` | SQLite FTS5 (Migration / Release Notes) | `from_version` → `to_version` 구간의 필수 마이그레이션 단계, Breaking Changes, 공식 Codemod 명령어(`npx @next/codemod@canary`, `npx @tailwindcss/upgrade`) 및 출처 반환 |
| `search_versioned_docs` | SQLite FTS5 (`unicode61` + `bm25`) | 특정 라이브러리·버전에 고정된 공식 마이그레이션/브레이킹 체인지 청크 검색 (`AND` → `OR` 2단계 폴백) |

---

## 4. 초기 지원 범위 (Phase 1 MVP)

- **지원 라이브러리 (7종)**: `node`, `typescript`, `react`, `nextjs`, `vite`, `tailwindcss`, `eslint`
- **지원 패키지 매니저 (4종)**: `npm`, `pnpm`, `yarn` (Classic v1 & Berry v2+), `bun`
- **대표 해결 시나리오**:
  1. **Tailwind CSS v3 → v4**: `tailwind.config.js` 및 `@tailwind` 지시어 대신 `@import "tailwindcss";` CSS-first 설정 및 `@tailwindcss/vite` / `@tailwindcss/postcss` 안내
  2. **ESLint v8 → v9**: `.eslintrc.*` 대신 `eslint.config.mjs` Flat Config 및 `typescript-eslint` 안내
  3. **Next.js 14 → 15 & React 19**: 비동기 `cookies()`/`headers()`/`params`, Node.js 최소 버전(`>=18.18.0`), `peerDependencies` 충돌 검증
  4. **패키지 매니저 일관성**: `pnpm-lock.yaml` 프로젝트에 `npm install` 대신 `pnpm add -D ...` 제안

---

## 5. 아키텍처 및 디렉토리 구조

```text
setup-guard-mcp/
├── src/
│   ├── index.ts                     # CLI 엔트리포인트 (stdio MCP 서버 실행)
│   ├── server.ts                    # 5개 MCP Tool 등록 및 핸들러 연결
│   ├── types/                       # 공통 타입 및 Zod 입출력 스키마
│   ├── detectors/                   # 로컬 환경/Lockfile/설정 패러다임 결정론적 파서
│   ├── compatibility/               # npm registry 클라이언트 + semver 호환성 엔진
│   ├── retrieval/                   # Node 내장 SQLite FTS5 (BM25) 검색 엔진
│   ├── cache/                       # ~/.cache/setup-guard-mcp 캐시 & SHA-256 무결성 검증
│   └── tools/                       # 5개 MCP Tool 비즈니스 로직
├── indexer/                         # 마크다운 AST 청커 & FTS5 인덱스 빌더
├── sources/js-ts.sources.yaml       # 태그 고정 공식 문서 수집 매니페스트
├── seed/                            # 사전 빌드된 SQLite 인덱스 (index-js-ts.db, manifest.json)
├── eval/                            # 골든 데이터셋(golden-dataset.jsonl) & 정량 평가 러너
├── tests/                           # 통합 테스트 스위트
├── .agents/plugins/setup-guard/     # Google Antigravity 네이티브 플러그인 번들
├── AGENTS.md                        # OpenAI Codex / 에이전트 공통 지침
└── GEMINI.md                        # Google Antigravity 워크스페이스 규칙
```

---

## 6. 로컬 빌드, 테스트 및 평가 실행

```bash
# 의존성 설치
npm install

# TypeScript 컴파일 + SQLite FTS5 시드 인덱스 빌드
npm run build

# 통합 테스트 실행 (5개 핵심 시나리오 검증)
npm test

# 골든 데이터셋 검색 품질 및 가드레일 정량 평가
npm run eval
```

### 정량 평가 지표 (`npm run eval`)
- **`Recall@1`**: `1.0` (목표 `>= 0.70`)
- **`Recall@5`**: `1.0` (목표 `>= 0.90`)
- **`MRR@10`**: `1.0` (목표 `>= 0.80`)
- **`Version Leakage Rate`**: `0.0` (타 메이저 버전 청크 혼입 0%)
- **`Guardrails Passed`**: `true` (`ambiguous_version`, `unsupported_library`, `no_results_found` 안전장치 100% 통과)
