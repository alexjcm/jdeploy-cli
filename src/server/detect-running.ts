import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function isServerRunning(): Promise<boolean> {
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      // Windows: filtered tasklist (JBoss/Wildfly/Standalone)
      // Utilizing standard promisified exec for clean asynchronous shell operations
      const { stdout } = await execAsync('tasklist');
      const lc = stdout.toLowerCase();
      return lc.includes('jboss') || lc.includes('wildfly') || lc.includes('standalone');
    } else {
      // Linux / macOS: pgrep -f standalone
      await execAsync('pgrep -f standalone');
      return true;
    }
  } catch {
    // If process throws (like pgrep returning exit code 1 because it found nothing), we assume it's not running
    return false;
  }
}
