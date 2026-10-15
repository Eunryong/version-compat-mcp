/**
 * Strict stderr-only logger.
 * IMPORTANT: In stdio MCP servers, stdout is strictly reserved for JSON-RPC 2.0 frames.
 * Any console.log() or stdout write will corrupt the MCP protocol connection.
 * All diagnostic output is routed to process.stderr only when DEBUG="true" or VERSION_COMPAT_DEBUG="1".
 */
function isDebugEnabled(): boolean {
  return (
    process.env.DEBUG === "true" ||
    process.env.VERSION_COMPAT_DEBUG === "1" ||
    process.env.SETUP_GUARD_DEBUG === "1"
  );
}

export function log(message: string): void {
  if (isDebugEnabled()) {
    process.stderr.write(`[version-compat] ${message}\n`);
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    if (isDebugEnabled()) {
      const payload = meta ? ` ${JSON.stringify(meta)}` : "";
      process.stderr.write(`[version-compat] ${message}${payload}\n`);
    }
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    if (isDebugEnabled()) {
      const payload = meta ? ` ${JSON.stringify(meta)}` : "";
      process.stderr.write(`[version-compat:WARN] ${message}${payload}\n`);
    }
  },
  error(message: string, meta?: Record<string, unknown>): void {
    const payload = meta ? ` ${JSON.stringify(meta)}` : "";
    process.stderr.write(`[version-compat:ERROR] ${message}${payload}\n`);
  },
};
