import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from "mysql2/promise";

// Optional: provide the secret ARN for Secrets Manager
const secretId = process.env.DB_SECRET_ID || null;
const sm = new SecretsManagerClient({});

let pool;

/**
 * Fetch database configuration either from Secrets Manager or environment variables.
 */
async function getDbConfig() {
  // 1️⃣ Try Secrets Manager if secretId is provided
  if (secretId) {
    try {
      const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
      const secret = JSON.parse(res.SecretString);

      if (!secret.host || !secret.username || !secret.password || !secret.dbname) {
        throw new Error("Secrets Manager DB secret is missing required fields.");
      }

      return {
        host: secret.host,
        port: secret.port ? Number(secret.port) : 3306,
        user: secret.username,
        password: secret.password,
        database: secret.dbname,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      };
    } catch (err) {
      console.warn(
        "⚠️ Secrets Manager lookup failed, falling back to environment variables:",
        err.message
      );
    }
  }

  // 2️⃣ Fallback to environment variables
  const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD || !DB_NAME) {
    throw new Error(
      "❌ No database configuration available. Provide DB_SECRET_ID or set DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME environment variables."
    );
  }

  return {
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

/**
 * Return a MySQL connection pool.
 */
export async function getPool() {
  if (!pool) {
    const config = await getDbConfig();
    pool = mysql.createPool(config);
  }
  return pool;
}
