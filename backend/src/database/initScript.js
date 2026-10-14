import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDatabaseInit() {
  console.log('--- Initializing Stitch PIM Database ---');
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'stitch_pim';

  try {
    const connection = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
    console.log(`Connected to MySQL server at ${host}:${port}`);

    const sqlPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`Schema file not found at: ${sqlPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying schema and seed records...');
    await connection.query(sqlContent);
    console.log('✓ Database schema, tables, indexes, and seed records applied successfully!');
    await connection.end();
  } catch (err) {
    console.error('Failed to run database schema:', err.message);
    process.exit(1);
  }
}

runDatabaseInit();
