import mysql from "mysql2/promise";

let pool;

export async function getPool() {
  if (!pool) {
    const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
    if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD || !DB_NAME) {
      throw new Error("Database environment variables are required (DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME)");
    }

    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT ? Number(DB_PORT) : 3306,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

