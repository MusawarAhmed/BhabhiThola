import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { PlayedCard, Card, GameLogEntry } from '../types/game';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  alias: varchar('alias', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url').notNull(),
  gender: varchar('gender', { length: 10 }).default('male').notNull(),
  authProvider: varchar('auth_provider', { length: 20 }).default('guest').notNull(), // 'guest' | 'google' | 'phone' | 'email'
  passwordHash: text('password_hash'),
  gamesPlayed: integer('games_played').default(0).notNull(),
  gamesWon: integer('games_won').default(0).notNull(),
  bhabhiCount: integer('bhabhi_count').default(0).notNull(),
  guestGamesPlayed: integer('guest_games_played').default(0).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('waiting'),
  currentTurnPlayerId: text('current_turn_player_id'),
  leadPlayerId: text('lead_player_id'),
  suitLed: varchar('suit_led', { length: 20 }),
  currentTrick: jsonb('current_trick').$type<PlayedCard[]>().default([]),
  discardPile: jsonb('discard_pile').$type<Card[]>().default([]),
  bhabhiPlayerId: text('bhabhi_player_id'),
  maxPlayers: integer('max_players').default(4).notNull(),
  isFirstTrick: boolean('is_first_trick').default(true).notNull(),
  logs: jsonb('logs').$type<GameLogEntry[]>().default([]),
  stateJson: jsonb('state_json').$type<any>(),
  playersData: jsonb('players_data').$type<any>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  seat: integer('seat').notNull(),
  cards: jsonb('cards').$type<Card[]>().default([]),
  isHost: boolean('is_host').default(false).notNull(),
  isSafe: boolean('is_safe').default(false).notNull(),
  isBhabhi: boolean('is_bhabhi').default(false).notNull(),
  isConnected: boolean('is_connected').default(true).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 50 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 150 }).notNull(),
  tag: varchar('tag', { length: 50 }).default('EVENT').notNull(),
  description: text('description').notNull(),
  glowColor: varchar('glow_color', { length: 30 }).default('gold').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type DbUser = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type DbPlayer = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type DbSiteSetting = typeof siteSettings.$inferSelect;
export type DbEvent = typeof events.$inferSelect;
