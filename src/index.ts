#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSetupGuardServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const server = createSetupGuardServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  logger.info("setup-guard-mcp server started over stdio");
}

main().catch((err) => {
  logger.error("Fatal error starting setup-guard-mcp", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
