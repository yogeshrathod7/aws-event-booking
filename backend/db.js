import mysql from "mysql2/promise";

// Ensure all required environment variables exist
const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USERNAME", "DB_PASSWORD", "DB_NAME"];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Environment variable ${envVar} is required`);
  }
}

let pool;

export async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("✅ Database pool created successfully");
  }
  return pool;
}
