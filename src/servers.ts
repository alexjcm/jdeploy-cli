export interface AppServer {
  name: string;
  home: string;
  lastDebugPort?: number;
}

export interface Config {
  servers: AppServer[];
  lastServer?: string;
}
