export interface EnvVars {
  PORT: number;
  NATS_SERVERS: string[];
  DATABASE_URL: string;
  JWT_SECRET: string;
}

export interface ConfigEnvs {
  port: number;
  natsServers: string[];
  databaseUrl: string;
  jwtSecret: string;
}
