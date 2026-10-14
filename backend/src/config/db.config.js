import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let isConnected = false;
let connectionError = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stitch_pim',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
};

// Initialize pool
export async function initializeDatabase() {
  if (!process.env.DB_HOST && !process.env.DB_USER) {
    console.log('[MySQL] No DB_HOST or DB_USER configured. Using memory/local store adapter for seamless execution.');
    isConnected = false;
    return false;
  }

  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    console.log(`[MySQL] Successfully connected to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    conn.release();
    isConnected = true;
    connectionError = null;
    return true;
  } catch (err) {
    connectionError = err.message;
    console.warn(`[MySQL] Connection warning: ${err.message}. Operating in fallback mode.`);
    isConnected = false;
    return false;
  }
}

export async function query(sql, params = []) {
  if (!pool || !isConnected) {
    return null;
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export function getPool() {
  return pool;
}

export function getStatus() {
  return {
    isConnected,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    error: connectionError,
  };
}

export default {
  initializeDatabase,
  query,
  getPool,
  getStatus,
};
