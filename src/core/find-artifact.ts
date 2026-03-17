import { Glob } from 'bun';
import { statSync } from 'fs';
import { basename } from 'path';

export interface Artifact {
  path: string;
  name: string;
  size: number;
}

export async function findArtifacts(): Promise<Artifact[]> {
  const patterns = [
    'build/libs/*.war',
    'build/libs/*.ear',
    '*/build/libs/*.war',
    '*/build/libs/*.ear',
  ];

  const artifacts: Artifact[] = [];
  
  for (const pattern of patterns) {
    const glob = new Glob(pattern);
    for (const path of glob.scanSync('.')) {
      const stats = statSync(path);
      artifacts.push({
        path,
        name: basename(path),
        size: stats.size,
      });
    }
  }

  // Remove duplicates by path (just in case patterns overlap)
  const uniqueArtifacts = Array.from(new Map(artifacts.map(a => [a.path, a])).values());
  
  return uniqueArtifacts;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
