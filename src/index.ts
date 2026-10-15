#!/usr/bin/env node
/**
 * Guard stdio transport:
 * Ensure nothing (including third-party libraries) ever writes non-protocol text to stdout.
 */
console.log = (...args: unknown[]) => {
  if (
    process.env.DEBUG === "true" ||
    process.env.VERSION_COMPAT_DEBUG === "1" ||
    process.env.SETUP_GUARD_DEBUG === "1"
  ) {
    process.stderr.write(`[version-compat] ${args.map(String).join(" ")}\n`);
  }
};

const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
  const msg = typeof warning === "string" ? warning : warning?.message ?? "";
  if (msg.includes("SQLite is an experimental feature")) {
    return;
  }
  return (originalEmitWarning as (...a: unknown[]) => void)(warning, ...args);
}) as typeof process.emitWarning;

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createVersionCompatServer } from "./server.js";
import { log, logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const server = createVersionCompatServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  log("Server started over stdio");
}

main().catch((err) => {
  logger.error("Fatal error starting version-compat-mcp", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
