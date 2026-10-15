import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NpmPackageAbbreviatedMeta } from "../src/compatibility/npmRegistryClient.js";
import { handleCheckDependencyCompatibility } from "../src/tools/checkCompatibility.js";
import { handleDetectProjectEnvironment } from "../src/tools/detectProjectEnv.js";
import { handleGetSetupGuideForMcp } from "../src/tools/mcpToolWrappers.js";
import { handleGetUpgradeSteps } from "../src/tools/getUpgradeSteps.js";
import { handleSearchVersionedDocs } from "../src/tools/searchVersionedDocs.js";

process.env.VERSION_COMPAT_OFFLINE = "1";

describe("version-compat-mcp Phase 1 Core Tools", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "version-compat-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("detect_project_environment detects pnpm, .nvmrc, Tailwind v4 CSS-first, ESLint flat config, and exact lockfile versions", () => {
    fs.writeFileSync(path.join(tempDir, ".nvmrc"), "v20.11.0\n", "utf8");
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "sample-app",
        packageManager: "pnpm@9.12.2",
        dependencies: {
          next: "^15.0.0",
          react: "^19.0.0",
        },
        devDependencies: {
          tailwindcss: "^4.0.0",
          "@tailwindcss/vite": "^4.0.0",
          eslint: "^9.0.0",
          typescript: "^5.7.0",
        },
      }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tempDir, "pnpm-lock.yaml"),
      `lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      next:\n        specifier: ^15.0.0\n        version: 15.0.3(react-dom@19.0.0)(react@19.0.0)\n      react:\n        specifier: ^19.0.0\n        version: 19.0.0\n    devDependencies:\n      tailwindcss:\n        specifier: ^4.0.0\n        version: 4.0.0\n      eslint:\n        specifier: ^9.0.0\n        version: 9.14.0\n`,
      "utf8"
    );
    fs.writeFileSync(
      path.join(tempDir, "eslint.config.mjs"),
      "export default [];\n",
      "utf8"
    );
    fs.mkdirSync(path.join(tempDir, "src/app"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "src/app/globals.css"),
      '@import "tailwindcss";\n',
      "utf8"
    );
    fs.writeFileSync(
      path.join(tempDir, "tsconfig.json"),
      `{\n  // comment in tsconfig\n  "compilerOptions": {\n    "moduleResolution": "bundler",\n    "strict": true,\n  }\n}`,
      "utf8"
    );

    const res = handleDetectProjectEnvironment({ project_path: tempDir });

    expect(res.status).toBe("ok");
    expect(res.runtime.node.resolved_version).toBe("20.11.0");
    expect(res.runtime.node.source).toBe(".nvmrc");
    expect(res.package_manager.name).toBe("pnpm");
    expect(res.package_manager.version).toBe("9.12.2");
    expect(res.package_manager.command_templates.install_dev).toBe(
      "pnpm add -D <pkg>"
    );
    expect(res.core_dependencies.next.resolved_version).toBe("15.0.3");
    expect(res.core_dependencies.next.resolution_source).toBe("pnpm-lock.yaml");
    expect(res.core_dependencies.eslint.resolved_version).toBe("9.14.0");
    expect(res.config_paradigms.eslint.mode).toBe("flat_config");
    expect(res.config_paradigms.tailwindcss.mode).toBe("v4_css_first");
    expect(res.config_paradigms.nextjs.router_mode).toBe("app_router");
    expect(res.config_paradigms.typescript.module_resolution).toBe("bundler");
    expect(res.config_paradigms.typescript.strict).toBe(true);
  });

  it("check_dependency_compatibility catches engine mismatch, peerDependency conflicts, deprecations, and workspace:* unverified items", async () => {
    const mockRegistry: Record<string, NpmPackageAbbreviatedMeta> = {
      next: {
        name: "next",
        "dist-tags": { latest: "15.0.3" },
        versions: {
          "15.0.3": {
            name: "next",
            version: "15.0.3",
            engines: { node: ">=18.18.0" },
            peerDependencies: {
              react: "^18.2.0 || ^19.0.0",
              "react-dom": "^18.2.0 || ^19.0.0",
            },
          },
        },
      },
      react: {
        name: "react",
        "dist-tags": { latest: "19.0.0" },
        versions: {
          "17.0.2": {
            name: "react",
            version: "17.0.2",
          },
        },
      },
      eslint: {
        name: "eslint",
        "dist-tags": { latest: "9.14.0" },
        versions: {
          "8.57.1": {
            name: "eslint",
            version: "8.57.1",
            deprecated: "This version is no longer supported.",
          },
        },
      },
    };

    const res = await handleCheckDependencyCompatibility(
      {
        dependencies: {
          next: "15.0.3",
          react: "17.0.2",
          "@internal/pkg": "workspace:*",
        },
        devDependencies: {
          eslint: "8.57.1",
        },
        runtime_version: "18.16.0",
      },
      async (pkg) => mockRegistry[pkg] ?? null
    );

    expect(res.status).toBe("partial");
    expect(res.compatible).toBe(false);
    expect(
      res.conflicts.some(
        (c) => c.type === "engine_mismatch" && c.package === "next@15.0.3"
      )
    ).toBe(true);
    expect(
      res.conflicts.some(
        (c) =>
          c.type === "peer_dependency_conflict" &&
          c.package === "next@15.0.3" &&
          c.peer_package === "react"
      )
    ).toBe(true);
    expect(
      res.conflicts.some(
        (c) =>
          c.type === "missing_peer_dependency" &&
          c.peer_package === "react-dom"
      )
    ).toBe(true);
    expect(res.deprecations).toHaveLength(1);
    expect(res.deprecations[0].package).toBe("eslint");
    expect(res.unverified).toHaveLength(1);
    expect(res.unverified[0].reason).toBe("LOCAL_WORKSPACE_PROTOCOL");
  });

  it("get_versioned_setup_guide translates commands to pnpm/bun and rejects 'latest'", async () => {
    const res = await handleGetSetupGuideForMcp({
      library: "tailwindcss",
      target_version: "4.0.0",
      package_manager: "pnpm",
      runtime_version: "20.11.0",
      framework_context: "vite",
    });

    expect(res.status).toBe("ok");
    const commands = res.install_commands as Array<{ command: string; source_url: string }>;
    expect(commands[0].command).toBe("pnpm add tailwindcss @tailwindcss/vite");
    expect(commands[0].source_url).toContain("github.com/tailwindlabs");

    const latestRes = await handleGetSetupGuideForMcp({
      library: "tailwindcss",
      target_version: "latest",
      package_manager: "pnpm",
    });
    expect(latestRes.status).toBe("ambiguous_version");
  });

  it("get_upgrade_steps returns breaking changes and codemods formatted for the chosen package manager", async () => {
    const res = await handleGetUpgradeSteps({
      library: "eslint",
      from_version: "8.57.1",
      to_version: "9.14.0",
      package_manager: "pnpm",
    });

    expect(res.status).toBe("ok");
    expect(res.is_major_upgrade).toBe(true);
    const codemods = res.official_codemods as Array<{ command: string }>;
    expect(codemods[0].command).toBe(
      "pnpm dlx @eslint/migrate-config .eslintrc.json"
    );
    const breaking = res.breaking_changes as Array<{ section: string; source_url: string }>;
    expect(breaking.length).toBeGreaterThanOrEqual(2);
    expect(breaking.some((b) => b.section.includes("Flat Config"))).toBe(true);
  });

  it("search_versioned_docs auto-resolves version from project_path when version is omitted", async () => {
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "next15-app",
        dependencies: { next: "15.0.3" },
      }),
      "utf8"
    );

    const res = await handleSearchVersionedDocs({
      library: "nextjs",
      project_path: tempDir,
      query: "cookies headers async params",
    });

    expect(res.status).toBe("ok");
    const meta = res.search_metadata as { resolved_version: string };
    expect(meta.resolved_version).toBe("15.0.3");
    const results = res.results as Array<{ section: string; version: string }>;
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].version).toBe("15.0.3");
  });
});
