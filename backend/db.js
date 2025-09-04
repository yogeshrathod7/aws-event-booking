import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pkg from 'pg';
const { Pool } = pkg;

const secretId = process.env.DB_SECRET_ID;
const sm = new SecretsManagerClient({});

let pool;

async function getDbConfig() {
  const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
  const secret = JSON.parse(res.SecretString);
  return {
    host: secret.host,
    port: secret.port,
    user: secret.username,
    password: secret.password,
    database: secret.dbname,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

export async function getPool() {
  if (!pool) {
    const cfg = await getDbConfig();
    pool = new Pool(cfg);
  }
  return pool;
}