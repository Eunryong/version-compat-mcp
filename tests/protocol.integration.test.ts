import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SERVER_ENTRY = path.join(ROOT_DIR, "dist/index.js");

describe("Tier 3: MCP Stdio Protocol Integration Test", () => {
  it("spawns dist/index.js over stdio, completes initialize, tools/list, and tools/call without stdout pollution", async () => {
    const transport = new StdioClientTransport({
      command: "node",
      args: [SERVER_ENTRY],
      env: {
        ...process.env,
        SETUP_GUARD_OFFLINE: "1",
      },
    });

    const client = new Client({
      name: "vitest-mcp-integration-client",
      version: "1.0.0",
    });

    await client.connect(transport);

    try {
      // 1. Verify tools/list returns all 5 tools with valid JSON schemas
      const listRes = await client.listTools();
      const toolNames = listRes.tools.map((t) => t.name);
      expect(toolNames).toEqual([
        "detect_project_environment",
        "check_dependency_compatibility",
        "get_versioned_setup_guide",
        "get_upgrade_steps",
        "search_versioned_docs",
      ]);
      for (const tool of listRes.tools) {
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.description?.length).toBeGreaterThan(20);
      }

      // 2. Call detect_project_environment on tailwind-v4 fixture
      const envCall = await client.callTool({
        name: "detect_project_environment",
        arguments: {
          project_path: path.join(ROOT_DIR, "fixtures/tailwind-v4"),
        },
      });
      const envJson = JSON.parse(
        (envCall.content as Array<{ type: string; text: string }>)[0].text
      );
      expect(envJson.status).toBe("ok");
      expect(envJson.package_manager.name).toBe("pnpm");
      expect(envJson.config_paradigms.tailwindcss.mode).toBe("v4_css_first");

      // 3. Call get_upgrade_steps (Tailwind v3 -> v4)
      const upgradeCall = await client.callTool({
        name: "get_upgrade_steps",
        arguments: {
          library: "tailwindcss",
          from_version: "3.4.0",
          to_version: "4.0.0",
          package_manager: "pnpm",
        },
      });
      const upgradeJson = JSON.parse(
        (upgradeCall.content as Array<{ type: string; text: string }>)[0].text
      );
      expect(upgradeJson.status).toBe("ok");
      expect(upgradeJson.is_major_upgrade).toBe(true);
      expect(upgradeJson.breaking_changes.length).toBeGreaterThan(0);

      // 4. Call search_versioned_docs and verify guardrail on 0 matches
      const searchCall = await client.callTool({
        name: "search_versioned_docs",
        arguments: {
          library: "eslint",
          version: "9.14.0",
          query: "completely_unknown_api_token_9999",
        },
      });
      const searchJson = JSON.parse(
        (searchCall.content as Array<{ type: string; text: string }>)[0].text
      );
      expect(searchJson.status).toBe("ok");
      expect(searchJson.search_metadata.total_matches).toBe(0);
      expect(searchJson.interpretation_guardrail).toBe(
        "NO_EVIDENCE_DO_NOT_ASSUME_REMOVED"
      );
    } finally {
      await client.close();
    }
  });
});
