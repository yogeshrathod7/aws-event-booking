import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import mysql from "mysql2/promise";

const secretId = process.env.DB_SECRET_ID; // e.g. arn:aws:secretsmanager:region:acct:secret:mysecret
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
 
/*
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

*/