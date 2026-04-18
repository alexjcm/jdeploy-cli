import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { ARTIFACT_EXTENSIONS, SERVER_PATHS } from '../constants.ts';

function isUndeployedArtifact(fileName: string): boolean {
  return ARTIFACT_EXTENSIONS.some((ext) => fileName.endsWith(`${ext}.undeployed`));
}

export function listDeployedArtifacts(serverHome: string): string[] {
  const deploymentsDir = join(serverHome, ...SERVER_PATHS.DEPLOYMENTS);

  if (!existsSync(deploymentsDir)) {
    return [];
  }

  try {
    const entries = readdirSync(deploymentsDir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => ARTIFACT_EXTENSIONS.some((ext) => fileName.endsWith(ext)))
      .filter((fileName) => !isUndeployedArtifact(fileName))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}
