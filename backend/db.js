import mysql from "mysql2/promise";

let pool;

async function getDbConfig() {
  // ✅ Local config from environment variables
  if (process.env.DB_HOST && process.env.DB_USER) {
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

  // ✅ Optional: AWS Secrets Manager path (used only in AWS)
  if (process.env.DB_SECRET) {
    try {
      const secret = JSON.parse(process.env.DB_SECRET);
      return {
        host: secret.DB_HOST,
        user: secret.DB_USERNAME,
        password: secret.DB_PASSWORD,
        database: secret.DB_NAME,
        port: secret.DB_PORT || 3306
      };
    } catch (err) {
      console.error("❌ Failed to parse DB_SECRET JSON:", err.message);
    }
  }

  throw new Error("❌ No valid DB configuration found.");
}

export async function getPool() {
  if (!pool) {
    const cfg = await getDbConfig();
    pool = mysql.createPool(cfg);
    console.log(`✅ DB connected: ${cfg.host}/${cfg.database}`);
  }
  return pool;
}
