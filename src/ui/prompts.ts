import { group, text, select, isCancel, cancel, note } from '@clack/prompts';
import { Config, AppServer } from '../servers.ts';
import { saveConfig, validateServerHome, normalizePath } from '../config/config-manager.ts';
import { Artifact, formatBytes } from '../core/find-artifact.ts';

export async function firstRunFlow(): Promise<Config> {
  const server = await addNewServerFlow({ servers: [] });
  return {
    servers: [server],
    lastServer: server.name
  };
}

export async function addNewServerFlow(existingConfig: Config): Promise<AppServer> {
  const result = await group(
    {
      name: () => text({
        message: 'Name for this server (e.g., wildfly-dev):',
        placeholder: 'server-local',
        validate: (value) => {
          if (!value) return 'Name is required';
          if (existingConfig.servers.some(s => s.name === value)) return 'A server with this name already exists';
        },
      }),
      home: () => text({
        message: 'Full path for Server Home:',
        placeholder: '/opt/wildfly-20.0',
        validate: (value) => {
          if (!value) return 'Path is required';
          if (!validateServerHome(value)) return 'This path does not look like a valid Server Home (missing standalone/deployments)';
        },
      }),
    },
    {
      onCancel: () => {
        cancel('Operation cancelled');
        process.exit(130);
      },
    }
  );

  const newServer: AppServer = {
    name: result.name as string,
    home: normalizePath(result.home as string),
  };

  const newConfig: Config = {
    ...existingConfig,
    servers: [...existingConfig.servers, newServer],
    lastServer: newServer.name,
  };

  await saveConfig(newConfig);
  note('Server saved successfully.');
  
  return newServer;
}

export async function selectServer(config: Config): Promise<AppServer | 'ADD_NEW'> {
  const sortedServers = [...config.servers].sort((a, b) => {
    if (a.name === config.lastServer) return -1;
    if (b.name === config.lastServer) return 1;
    return 0;
  });

  const options = [
    ...sortedServers.map(s => ({
      value: s,
      label: `${s.name} (${s.home})`,
    })),
    { value: 'ADD_NEW' as const, label: '➕ Add new server...' }
  ] as { value: AppServer | 'ADD_NEW'; label: string }[];

  const selected = await select({
    message: 'Select server:',
    options,
    initialValue: config.servers.find(s => s.name === config.lastServer) || config.servers[0],
  });

  if (isCancel(selected)) {
    cancel('Operation cancelled');
    process.exit(130);
  }

  return selected as AppServer | 'ADD_NEW';
}

export async function selectArtifact(artifacts: Artifact[]): Promise<Artifact> {
  if (artifacts.length === 1) {
    const artifact = artifacts[0]!;
    note(`Artifact detected: ${artifact.name} (${formatBytes(artifact.size)})`);
    return artifact;
  }

  const selected = await select({
    message: 'Multiple artifacts found. Select one:',
    options: artifacts.map(a => ({
      value: a,
      label: `${a.name} (${formatBytes(a.size)})`,
    })),
  });

  if (isCancel(selected)) {
    cancel('Operation cancelled');
    process.exit(130);
  }

  return selected as Artifact;
}

export async function selectAction(): Promise<'build-deploy' | 'deploy-only' | 'start-only'> {
  const action = await select({
    message: 'Select action:',
    options: [
      { value: 'build-deploy', label: 'build + deploy' },
      { value: 'deploy-only', label: 'deploy only' },
      { value: 'start-only', label: 'start server only' },
    ],
  });

  if (isCancel(action)) {
    cancel('Operation cancelled');
    process.exit(130);
  }

  return action as 'build-deploy' | 'deploy-only' | 'start-only';
}

export async function selectServerMode(lastUsedPort?: number): Promise<{ mode: 'normal' | 'debug'; port?: number }> {
  const defaultPort = lastUsedPort || 5005;
  const debugLabel = lastUsedPort 
    ? `🐞 Debug mode (Port: ${lastUsedPort})` 
    : '🐞 Debug mode (Default port: 5005)';

  const result = await group(
    {
      mode: () => select({
        message: 'Select startup mode:',
        options: [
          { value: 'normal', label: '🚀 Normal mode' },
          { value: 'debug', label: debugLabel },
          { value: 'debug-custom', label: '🐞 Debug mode (Custom port...)' },
        ],
      }),
      port: ({ results }) => 
        results.mode === 'debug-custom' 
          ? text({
              message: 'Enter debug port:',
              placeholder: defaultPort.toString(),
              defaultValue: defaultPort.toString(),
              validate: (value) => {
                if (value && isNaN(Number(value))) return 'Port must be a number';
              },
            })
          : Promise.resolve(undefined),
    },
    {
      onCancel: () => {
        cancel('Operation cancelled');
        process.exit(130);
      },
    }
  );

  const finalMode = (result.mode === 'debug' || result.mode === 'debug-custom') ? 'debug' : 'normal';
  const finalPort = result.mode === 'debug' ? defaultPort : (result.port ? Number(result.port) : undefined);

  return { 
    mode: finalMode as 'normal' | 'debug', 
    ...(finalPort ? { port: finalPort } : {})
  };
}
