import { spawn } from 'bun';

export async function buildProject(): Promise<boolean> {
  const proc = spawn(['gradle', 'clean', 'build', '-x', 'test', '-x', 'pmdMain'], {
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = await proc.exited;
  return exitCode === 0;
}
