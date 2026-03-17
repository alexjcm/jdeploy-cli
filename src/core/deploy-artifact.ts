import { join, basename, extname } from 'path';
import { readdirSync, rmSync, existsSync } from 'fs';
import { Artifact } from './find-artifact.ts';
import { SERVER_PATHS } from '../constants.ts';

export async function deployArtifact(artifact: Artifact, serverHome: string): Promise<boolean> {
  const deploymentsDir = join(serverHome, ...SERVER_PATHS.DEPLOYMENTS);
  const destPath = join(deploymentsDir, artifact.name);

  try {
    // Smart Cleanup: Remove previous versions of the same artifact
    const ext = extname(artifact.name);
    const baseWithoutExt = basename(artifact.name, ext);
    
    // Pattern: everything before the first hyphen followed by a digit
    const versionMatch = baseWithoutExt.match(/^(.+?)-\d/);
    const prefix = versionMatch ? versionMatch[1] : baseWithoutExt;

    if (existsSync(deploymentsDir)) {
      const files = readdirSync(deploymentsDir);
      for (const file of files) {
        // Match files starting with prefix followed by a hyphen and ending with the same extension
        // OR exact same name (case of re-deploying same version)
        const isPreviousVersion = file.startsWith(`${prefix}-`) && file.endsWith(ext) && file !== artifact.name;
        
        if (isPreviousVersion) {
          const fullPath = join(deploymentsDir, file);
          rmSync(fullPath, { force: true });
          rmSync(`${fullPath}.deployed`, { force: true });
          rmSync(`${fullPath}.failed`, { force: true });
          rmSync(`${fullPath}.isdeploying`, { force: true });
          rmSync(`${fullPath}.skipdeploy`, { force: true });
          rmSync(`${fullPath}.pending`, { force: true });
        }
      }
    }

    const file = Bun.file(artifact.path);
    await Bun.write(destPath, file);
    await Bun.write(`${destPath}.dodeploy`, '');
    
    return true;
  } catch (error) {
    return false;
  }
}
