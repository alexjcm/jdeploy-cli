import { log } from '../ui/logger.ts';
import { AppServer } from '../servers.ts';

export async function handleListDeployments(server: AppServer) {
  const { listDeployments } = await import('../server/list-deployments.ts');
  const deployments = listDeployments(server.home);
  log.message(`Deployments on ${server.name}:\n` + (deployments.length > 0 
    ? deployments.map(d => `  ${d.status}  ${d.name}`).join('\n')
    : '  No artifacts in deployments/'));
}

export async function handleCleanMarkers(server: AppServer) {
  const { cleanMarkers } = await import('../server/clean-markers.ts');
  cleanMarkers(server.home);
  log.success(`Error markers cleaned on ${server.name}`);
}
