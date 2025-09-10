import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from "mysql2/promise";

let pool;

export async function getPool() {
  if (pool) return pool;

  const secretId = process.env.DB_SECRET;
  if (!secretId) throw new Error("DB_SECRET environment variable is required");

  const sm = new SecretsManagerClient({});
  const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
  const secret = JSON.parse(res.SecretString);

  pool = mysql.createPool({
    host: secret.DB_HOST,
    port: secret.DB_PORT ? Number(secret.DB_PORT) : 3306,
    user: secret.DB_USERNAME,
    password: secret.DB_PASSWORD,
    database: secret.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}
