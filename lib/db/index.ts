import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString ? neon(connectionString) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

let tablesInitialized = false;

export async function ensureTablesExist() {
  if (!sql || tablesInitialized) return;
  try {
    // 1. Create tables if not exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50) UNIQUE,
        alias VARCHAR(100) NOT NULL,
        avatar_url TEXT NOT NULL,
        gender VARCHAR(10) DEFAULT 'male' NOT NULL,
        auth_provider VARCHAR(20) DEFAULT 'guest' NOT NULL,
        password_hash TEXT,
        games_played INTEGER DEFAULT 0 NOT NULL,
        games_won INTEGER DEFAULT 0 NOT NULL,
        bhabhi_count INTEGER DEFAULT 0 NOT NULL,
        guest_games_played INTEGER DEFAULT 0 NOT NULL,
        is_verified BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // 2. Ensure all columns exist in case table was created earlier with fewer fields
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS guest_games_played INTEGER DEFAULT 0;`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`;
    } catch {}

    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'waiting' NOT NULL,
        current_turn_player_id TEXT,
        lead_player_id TEXT,
        suit_led VARCHAR(20),
        current_trick JSONB DEFAULT '[]'::jsonb,
        discard_pile JSONB DEFAULT '[]'::jsonb,
        bhabhi_player_id TEXT,
        max_players INTEGER DEFAULT 4 NOT NULL,
        is_first_trick BOOLEAN DEFAULT true NOT NULL,
        logs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        seat INTEGER NOT NULL,
        cards JSONB DEFAULT '[]'::jsonb,
        is_host BOOLEAN DEFAULT false NOT NULL,
        is_safe BOOLEAN DEFAULT false NOT NULL,
        is_bhabhi BOOLEAN DEFAULT false NOT NULL,
        is_connected BOOLEAN DEFAULT true NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    tablesInitialized = true;
  } catch (err) {
    console.error('Failed to auto-ensure tables in Neon:', err);
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database is not initialized. Please verify DATABASE_URL is set in .env.local');
  }
  return db;
}
