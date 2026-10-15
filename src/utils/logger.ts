/**
 * Strict stderr-only logger.
 * IMPORTANT: Never write to process.stdout in a stdio MCP server,
 * as Antigravity, Codex CLI, Claude Code, and Cursor parse stdout strictly as JSON-RPC 2.0.
 */
export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    if (process.env.SETUP_GUARD_DEBUG === "1") {
      const payload = meta ? ` ${JSON.stringify(meta)}` : "";
      process.stderr.write(`[setup-guard-mcp:INFO] ${message}${payload}\n`);
    }
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    const payload = meta ? ` ${JSON.stringify(meta)}` : "";
    process.stderr.write(`[setup-guard-mcp:WARN] ${message}${payload}\n`);
  },
  error(message: string, meta?: Record<string, unknown>): void {
    const payload = meta ? ` ${JSON.stringify(meta)}` : "";
    process.stderr.write(`[setup-guard-mcp:ERROR] ${message}${payload}\n`);
  },
};
