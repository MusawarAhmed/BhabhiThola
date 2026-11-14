import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Disable WebSocket connection caching in serverless if needed
const connectionString = process.env.DATABASE_URL;

export const sql = connectionString ? neon(connectionString) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

export function getDb() {
  if (!db) {
    throw new Error('Database is not initialized. Please verify DATABASE_URL is set in .env.local');
  }
  return db;
}
