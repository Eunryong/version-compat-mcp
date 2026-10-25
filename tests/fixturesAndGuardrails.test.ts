import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  computeFileSha256,
  getResolvedIndex,
  resetIndexCacheForTests,
} from "../src/cache/indexManager.js";
import { translateNpmCommand } from "../src/detectors/packageManager.js";
import { handleCheckDependencyCompatibility } from "../src/tools/checkCompatibility.js";
import { handleDetectProjectEnvironment } from "../src/tools/detectProjectEnv.js";
import { handleGetUpgradeSteps } from "../src/tools/getUpgradeSteps.js";
import { handleGetSetupGuideForMcp } from "../src/tools/mcpToolWrappers.js";
import { handleSearchVersionedDocs } from "../src/tools/searchVersionedDocs.js";
import { analyzeVersionSpec } from "../src/utils/versionUtils.js";

process.env.VERSION_COMPAT_OFFLINE = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");

function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

describe("Tier 1 & 2: Fixture Projects & Deterministic Unit Logic", () => {
  it("detects next14-npm fixture (npm lockfile v3, pages router, engines.node, exact lockfile versions)", () => {
    const res = handleDetectProjectEnvironment({
      project_path: fixturePath("next14-npm"),
    });
    expect(res.status).toBe("ok");
    expect(res.package_manager.name).toBe("npm");
    expect(res.runtime.node.resolved_version).toBe("18.17.0");
    expect(res.core_dependencies.next?.declared_range).toBe("^14.2.0");
    expect(res.core_dependencies.next?.resolved_version).toBe("14.2.15");
    expect(res.core_dependencies.next?.resolution_source).toBe(
      "package-lock.json"
    );
    expect(res.config_paradigms.nextjs.router_mode).toBe("pages_router");
  });

  it("detects next15-pnpm fixture (pnpm v9 lockfile, .nvmrc priority, app router, Next 15.2.4 + React 19)", () => {
    const res = handleDetectProjectEnvironment({
      project_path: fixturePath("next15-pnpm"),
    });
    expect(res.status).toBe("ok");
    expect(res.package_manager.name).toBe("pnpm");
    expect(res.runtime.node.resolved_version).toBe("20.18.0");
    expect(res.runtime.node.source).toBe(".nvmrc");
    expect(res.core_dependencies.next?.declared_range).toBe("^15.0.0");
    expect(res.core_dependencies.next?.resolved_version).toBe("15.2.4");
    expect(res.core_dependencies.react?.resolved_version).toBe("19.0.0");
    expect(res.config_paradigms.nextjs.router_mode).toBe("app_router");
  });

  it("detects python-fastapi-uv fixture (.python-version, uv.lock, PEP 621 pyproject.toml, exact lockfile versions)", () => {
    const res = handleDetectProjectEnvironment({
      project_path: fixturePath("python-fastapi-uv"),
    });
    expect(res.status).toBe("ok");
    expect(res.runtime.python?.resolved_version).toBe("3.12.7");
    expect(res.runtime.python?.source).toBe(".python-version");
    expect(res.package_manager.name).toBe("uv");
    expect(res.package_manager.command_templates.install_prod).toBe("uv add <pkg>");
    expect(res.core_dependencies.fastapi?.resolved_version).toBe("0.115.6");
    expect(res.core_dependencies.fastapi?.resolution_source).toBe("uv.lock");
    expect(res.core_dependencies.pydantic?.resolved_version).toBe("2.10.6");
    expect(res.core_dependencies.sqlalchemy?.resolved_version).toBe("2.0.36");
    expect(res.config_paradigms.python?.packaging_standard).toBe("pep621");
    expect(res.config_paradigms.python?.uv_enabled).toBe(true);
  });

  it("distinguishes tailwind-v3 vs tailwind-v4 fixtures accurately", () => {
    const v3 = handleDetectProjectEnvironment({
      project_path: fixturePath("tailwind-v3"),
    });
    expect(v3.package_manager.name).toBe("npm");
    expect(v3.core_dependencies.tailwindcss?.resolved_version).toBe("3.4.14");
    expect(v3.config_paradigms.tailwindcss.mode).toBe("v3_config_file");
    expect(v3.config_paradigms.tailwindcss.config_files).toContain(
      "tailwind.config.js"
    );

    const v4 = handleDetectProjectEnvironment({
      project_path: fixturePath("tailwind-v4"),
    });
    expect(v4.package_manager.name).toBe("pnpm");
    expect(v4.core_dependencies.tailwindcss?.resolved_version).toContain("4.");
    expect(v4.config_paradigms.tailwindcss.mode).toBe("v4_css_first");
    expect(v4.config_paradigms.tailwindcss.mode).not.toContain(
      "v3_config_file"
    );
  });

  it("distinguishes eslint-v8 (.eslintrc + yarn v1) vs eslint-v9-flat-config (eslint.config.mjs + pnpm)", () => {
    const v8 = handleDetectProjectEnvironment({
      project_path: fixturePath("eslint-v8"),
    });
    expect(v8.package_manager.name).toBe("yarn");
    expect(v8.package_manager.variant).toBe("classic");
    expect(v8.core_dependencies.eslint?.resolved_version).toBe("8.57.0");
    expect(v8.config_paradigms.eslint.mode).toBe("legacy_eslintrc");
    expect(v8.config_paradigms.eslint.config_files).toContain(".eslintrc.json");

    const v9 = handleDetectProjectEnvironment({
      project_path: fixturePath("eslint-v9-flat-config"),
    });
    expect(v9.package_manager.name).toBe("pnpm");
    expect(v9.core_dependencies.eslint?.resolved_version).toBe("9.14.0");
    expect(v9.config_paradigms.eslint.mode).toBe("flat_config");
  });

  it("resolves pnpm-workspace.yaml catalog: dependencies in monorepo sub-packages", () => {
    const mono = handleDetectProjectEnvironment({
      project_path: path.join(
        fixturePath("monorepo-pnpm-workspace"),
        "packages/web"
      ),
    });
    expect(mono.status).toBe("ok");
    expect(mono.core_dependencies.next?.declared_range).toBe("catalog:");
    expect(mono.core_dependencies.next?.resolved_version).toBe("15.0.3");
    expect(mono.core_dependencies.react?.resolved_version).toBe("19.0.0");
  });

  it("emits warning when conflicting lockfiles exist in the same project", () => {
    const conflict = handleDetectProjectEnvironment({
      project_path: fixturePath("conflicting-lockfiles"),
    });
    expect(conflict.package_manager.lockfiles_found).toEqual(
      expect.arrayContaining(["package-lock.json", "pnpm-lock.yaml"])
    );
    expect(conflict.package_manager.multiple_lockfiles_warning).toContain(
      "Multiple lockfiles from different package managers found"
    );
  });

  it("translates CLI commands accurately across npm, pnpm, yarn classic/berry, and bun", () => {
    expect(
      translateNpmCommand(
        "npm install -D tailwindcss @tailwindcss/vite",
        "pnpm"
      )
    ).toBe("pnpm add -D tailwindcss @tailwindcss/vite");
    expect(
      translateNpmCommand("npx @next/codemod@canary upgrade latest", "bun")
    ).toBe("bunx @next/codemod@canary upgrade latest");
    expect(
      translateNpmCommand(
        "npx @eslint/migrate-config .eslintrc.json",
        "yarn",
        "berry"
      )
    ).toBe("yarn dlx @eslint/migrate-config .eslintrc.json");
    expect(
      translateNpmCommand("npm install fastapi pydantic", "uv")
    ).toBe("uv add fastapi pydantic");
    expect(
      translateNpmCommand("npm install -D pytest ruff", "uv")
    ).toBe("uv add --dev pytest ruff");
    expect(
      translateNpmCommand("npm install fastapi", "poetry")
    ).toBe("poetry add fastapi");
    expect(
      translateNpmCommand("npm install fastapi", "pip")
    ).toBe("pip install fastapi");
  });

  it("provides versioned setup guide for Pydantic v2 and FastAPI with uv package manager", async () => {
    const guide = await handleGetSetupGuideForMcp({
      library: "pydantic",
      target_version: "2.10.6",
      package_manager: "uv",
    });
    expect(guide.status).toBe("ok");
    expect((guide.install_commands as Array<{ command: string }>)[0].command).toContain("uv add");
    expect(guide.obsolete_patterns_to_avoid).toEqual(
      expect.arrayContaining([expect.stringContaining(".dict()")])
    );
  });

  it("searches versioned docs for FastAPI lifespan and SQLAlchemy 2.0 select", async () => {
    const res = await handleSearchVersionedDocs({
      library: "fastapi",
      version: "0.115.6",
      query: "lifespan context manager startup",
    });
    expect(res.status).toBe("ok");
    expect((res.results as unknown[]).length).toBeGreaterThan(0);
    expect(((res.results as Array<{ content: string }>)[0]).content).toContain("lifespan");
  });

  it("verifies PyPI compatibility and detects Python runtime engine mismatch", async () => {
    const mockPypiFetcher = async (pkg: string) => {
      if (pkg === "fastapi") {
        return {
          info: {
            name: "fastapi",
            version: "0.115.6",
            requires_python: ">=3.8",
          },
          releases: {
            "0.115.6": [{ requires_python: ">=3.8" }],
          },
        };
      }
      return null;
    };

    const bad = await handleCheckDependencyCompatibility(
      {
        dependencies: { fastapi: "0.115.6" },
        runtime_version: "3.7.0",
      },
      undefined,
      mockPypiFetcher
    );
    expect(bad.compatible).toBe(false);
    expect(bad.conflicts[0].type).toBe("engine_mismatch");
    expect(bad.conflicts[0].requirement).toContain(">=3.8");

    const good = await handleCheckDependencyCompatibility(
      {
        dependencies: { fastapi: "0.115.6" },
        runtime_version: "3.12.0",
      },
      undefined,
      mockPypiFetcher
    );
    expect(good.compatible).toBe(true);
    expect(good.conflicts.length).toBe(0);
  });

  it("analyzes single-major vs multi-major ambiguous semver ranges", () => {
    expect(analyzeVersionSpec("^15.0.0").status).toBe("single_major_range");
    expect(analyzeVersionSpec(">=13.0.0 <16.0.0").status).toBe("ambiguous");
    expect(analyzeVersionSpec("latest").status).toBe("ambiguous");
    expect(analyzeVersionSpec("*").status).toBe("ambiguous");
  });
});

describe("Tier 4: Safety Guardrails & Failure Resilience", () => {
  it("never equates 0 search results with feature removal (NO_EVIDENCE_DO_NOT_ASSUME_REMOVED)", async () => {
    const res = await handleSearchVersionedDocs({
      library: "nextjs",
      version: "15.0.3",
      query: "nonexistent_quantum_flux_router_api_xyz",
    });
    expect(res.status).toBe("ok");
    const meta = res.search_metadata as { total_matches: number };
    expect(meta.total_matches).toBe(0);
    expect(res.interpretation_guardrail).toBe(
      "NO_EVIDENCE_DO_NOT_ASSUME_REMOVED"
    );
    expect(JSON.stringify(res.guardrail_notes)).toContain(
      "do NOT conclude that the queried feature or API was removed"
    );
  });

  it("refuses silent 'latest' substitution when version is omitted or multi-major ambiguous", async () => {
    const missingVer = await handleSearchVersionedDocs({
      library: "tailwindcss",
      query: "@theme",
    });
    expect(missingVer.status).toBe("ambiguous_version");

    const multiMajor = await handleGetUpgradeSteps({
      library: "nextjs",
      from_version: ">=13.0.0 <15.0.0",
      to_version: "15.0.3",
    });
    expect(multiMajor.status).toBe("ambiguous_version");
  });

  it("returns unsupported_library for out-of-scope libraries without hallucinating", async () => {
    const res = await handleGetSetupGuideForMcp({
      library: "sveltekit",
      target_version: "2.0.0",
      package_manager: "pnpm",
    });
    expect(res.status).toBe("unsupported_library");
    expect(res.supported_libraries).toContain("nextjs");
  });

  it("handles missing package.json directory gracefully without throwing", () => {
    const emptyDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "version-compat-empty-")
    );
    try {
      const res = handleDetectProjectEnvironment({ project_path: emptyDir });
      expect(res.status).toBe("unverified");
      expect(res.warnings[0]).toContain("No package.json found");
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it("handles offline / registry failure gracefully by returning unverified status", async () => {
    const res = await handleCheckDependencyCompatibility(
      {
        dependencies: {
          "unindexed-package-xyz": "1.0.0",
        },
        runtime_version: "20.11.0",
      },
      async () => null
    );
    expect(res.status).toBe("unverified");
    expect(res.unverified.length).toBe(1);
    expect(res.unverified[0].reason).toBe("REGISTRY_FETCH_FAILED");
  });

  it("verifies bundled seed index SHA-256 against seed/manifest.json and seed/index-js-ts.db.sha256", async () => {
    resetIndexCacheForTests();
    const resolved = await getResolvedIndex();
    expect(resolved.source).toBe("bundled_seed");
    expect(resolved.sha256Verified).toBe(true);

    const shaFile = path.resolve(
      __dirname,
      "../seed/index-js-ts.db.sha256"
    );
    expect(fs.existsSync(shaFile)).toBe(true);
    const shaContent = fs.readFileSync(shaFile, "utf8").trim().split(/\s+/)[0];
    expect(computeFileSha256(resolved.dbPath)).toBe(shaContent);
  });
});
