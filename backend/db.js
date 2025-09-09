import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from "mysql2/promise";

const secretId = process.env.DB_SECRET_ID; // required
if (!secretId) throw new Error("DB_SECRET_ID environment variable is required");

const sm = new SecretsManagerClient({});
let pool;

async function getDbConfig() {
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
      queueLimit: 0,
    };
  } catch (err) {
    console.error("❌ Failed to fetch DB credentials from Secrets Manager:", err.message);
    throw err; // fail immediately, no fallback
  }
}

export async function getPool() {
  if (!pool) {
    const cfg = await getDbConfig();
    pool = mysql.createPool(cfg);
  }
  return pool;
}

