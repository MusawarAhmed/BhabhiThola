import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { PlayedCard, Card, GameLogEntry } from '../types/game';

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

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type DbPlayer = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
