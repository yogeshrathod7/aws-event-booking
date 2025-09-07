import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from "mysql2/promise";

const secretId = process.env.DB_SECRET_ID || null; // optional
const sm = new SecretsManagerClient({});

let pool;

async function getDbConfig() {
  // If DB_SECRET_ID provided, try Secrets Manager first
  if (secretId) {
    try {
      const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
      const secret = JSON.parse(res.SecretString);
      return {
        host: secret.host,
        port: secret.port || 3306,
        user: secret.username,
        password: secret.password,
        database: secret.dbname,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      };
    } catch (err) {
      console.warn('Secrets Manager lookup failed, falling back to environment vars:', err.message);
      // continue to fallback to env
    }
  }

  // Fallback to environment variables (for local dev)
  if (!process.env.DB_HOST) {
    throw new Error('No DB configuration available. Set DB_SECRET_ID or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME env vars.');
  }

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

export async function getPool() {
  if (!pool) {
    const cfg = await getDbConfig();
    pool = mysql.createPool(cfg);
  }
  return pool;
}

