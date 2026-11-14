# Bhabhi Thola — Multiplayer Royal Casino Card Game

A complete, production-ready real-time multiplayer card game built with **Next.js App Router**, **Vercel Serverless WebSockets (`@vercel/functions`)**, and **Neon PostgreSQL**. Ready to deploy for free on the Vercel Hobby plan.

---

## ♠ Features & Architecture

- **Next.js App Router (15.x)**: High performance with Server Components, Client Components, and dynamic API Route Handlers.
- **Native Vercel Serverless WebSockets**: Implemented via `@vercel/functions` (`upgradeWebSocket`), with zero dependencies on Redis, Upstash, Socket.io, or third-party paid socket servers.
- **Neon Serverless PostgreSQL & Drizzle ORM**: Centralized state storage for rooms, player seats, hands, trick state, and event logs.
- **Casino Table UI**:
  - Oval emerald green table (`bg-radial-felt`) with dark mahogany rim and gold detailing.
  - Realistic card fan animations with Ace of Spades opening highlights, suit-matching hints, and glowing hover states.
  - Animated Thola penalty banner and Bhabhi loser declaration crown.
  - Built-in Bot / AI player generator for instant solo testing.

---

## 👑 Game Rules: Bhabhi Thola

1. **Dealing**: 52 cards are distributed evenly among players (13 cards each for 4 players).
2. **First Lead**: The player holding the **Ace of Spades (A♠)** MUST play it to open the first trick.
3. **Following Suit**: All players must play a card of the suit led if they have one.
4. **The "Thola" (Penalty)**:
   - If a player does not hold the suit led, they can throw ANY card.
   - This causes a **THOLA**!
   - The player who played the **highest card of the original suit led** receives all the trick cards as a penalty.
   - That penalized player leads the next trick.
5. **Safe (Winning)**: When a player empties their hand, they are **Safe** and exit the round as a winner.
6. **Bhabhi (The Loser)**: The last remaining player holding cards when everyone else is safe is crowned the **Bhabhi**!

---

## 🚀 Quick Start

### 1. Install & Build
```bash
npm install
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) to enter the Royal Casino Lobby.

### 2. Neon Database Connection
Run the following in your terminal to sign in and pull your database credentials:
```bash
neon login
neon deploy
```
This will populate `.env.local` with `DATABASE_URL`.

To push the database schema to your Neon Postgres branch:
```bash
npx drizzle-kit push
```

### 3. Deploy to Vercel
Push this repository to GitHub and import it into Vercel:
1. In your Vercel Project Settings, add `DATABASE_URL` (from Neon).
2. Deploy! The `@vercel/functions` native `upgradeWebSocket` handler handles live game connections seamlessly.
