import {
  PypiRegistryFetcher,
  RegistryFetcher,
  verifyDependencyCompatibility,
} from "../compatibility/semverResolver.js";
import { CheckCompatibilityOutput } from "../types/common.js";

export async function handleCheckDependencyCompatibility(
  input: {
    dependencies: Record<string, string>;
    devDependencies?: Record<string, string>;
    runtime_version?: string;
    ecosystem?: "npm" | "pypi";
  },
  customFetcher?: RegistryFetcher,
  customPypiFetcher?: PypiRegistryFetcher
): Promise<CheckCompatibilityOutput> {
  return verifyDependencyCompatibility(
    input.dependencies,
    input.devDependencies ?? {},
    input.runtime_version,
    customFetcher,
    customPypiFetcher,
    input.ecosystem
  );
}
