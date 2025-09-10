import mysql from "mysql2/promise";

let pool;

async function getDbConfig() {
  if (process.env.DB_SECRET) {
    try {
      const secret = JSON.parse(process.env.DB_SECRET);
      return {
        host: secret.DB_HOST,
        port: secret.DB_PORT ? Number(secret.DB_PORT) : 3306,
        user: secret.DB_USERNAME,
        password: secret.DB_PASSWORD,
        database: secret.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      };
    } catch (err) {
      console.error("Failed to parse DB_SECRET JSON:", err.message);
    }
  }

  throw new Error("DB_SECRET not set or invalid.");
}

export async function getPool() {
  if (!pool) {
    const cfg = await getDbConfig();
    pool = mysql.createPool(cfg);
  }
  return pool;
}
