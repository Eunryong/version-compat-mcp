import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface SmitheryConfig {
  offlineMode?: boolean;
  debug?: boolean;
}

const rootDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

export function startCommand(config: SmitheryConfig = {}) {
  return {
    command: "node",
    args: [resolve(rootDir, "dist", "index.js")],
    env: {
      ...(config.offlineMode ? { VERSION_COMPAT_OFFLINE: "1" } : {}),
      ...(config.debug ? { DEBUG: "true" } : {}),
    },
  };
}
