import 'dotenv/config';
import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ddl } from './schema.js';

const { Pool } = pkg;

const DEFAULT_URL = 'postgres://postgres:postgres@postgres:5432/smarthome';
const connectionString = process.env.DATABASE_URL || DEFAULT_URL;

export const pool = new Pool({ connectionString });
export const db = drizzle(pool);

export async function migrate() {
  // Create required extensions and tables if not exist
  await db.execute(ddl.enableUuidExt);
  await db.execute(ddl.deviceModels);
  await db.execute(ddl.devices);
  await db.execute(ddl.telemetry);
}

export async function close() {
  await pool.end();
}
