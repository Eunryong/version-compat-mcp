import { SupportedPackageManager } from "../types/common.js";
import { handleGetVersionedSetupGuide } from "./getSetupGuide.js";

export async function handleGetSetupGuideForMcp(args: {
  library: string;
  target_version: string;
  package_manager: SupportedPackageManager;
  runtime_version?: string;
  framework_context?: string;
}): Promise<Record<string, unknown>> {
  return handleGetVersionedSetupGuide(args);
}
