import { NextResponse } from 'next/server';
import { RoomManager, activeRooms } from '@/lib/game/room-manager';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Handle Profile updates from modal while in game
    if (action === 'UPDATE_PROFILE' && body.roomId && body.playerId) {
      const state = RoomManager.updatePlayerProfile(
        body.roomId,
        body.playerId,
        body.playerName,
        body.avatarUrl
      );
      return NextResponse.json({ success: true, state });
    }

    // Handle Max Players update
    if (action === 'SET_MAX_PLAYERS' && body.roomId && body.playerId && body.maxPlayers) {
      const state = RoomManager.setMaxPlayers(
        body.roomId,
        body.playerId,
        body.maxPlayers
      );
      return NextResponse.json({ success: true, state });
    }

    const roomCode = body.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = 'room_' + roomCode.toLowerCase();
    const playerId = body.playerId;
    const playerName = body.playerName || 'Player';
    const avatarUrl = body.avatarUrl;
    const maxPlayers = body.maxPlayers && body.maxPlayers >= 2 && body.maxPlayers <= 8 ? body.maxPlayers : 4;

    const session = RoomManager.getOrCreateSession(roomId, roomCode, maxPlayers);
    if (body.deckType === 'double' || body.deckType === 'single') {
      session.state.deckType = body.deckType;
    }
    if (maxPlayers) {
      session.state.maxPlayers = maxPlayers;
    }

    let playerState = session.state;
    if (playerId) {
      playerState = RoomManager.registerPlayer(roomId, playerId, playerName, avatarUrl);
    }

    // Persist to Neon DB if available
    if (db) {
      try {
        await db
          .insert(rooms)
          .values({
            id: roomId,
            code: roomCode,
            status: 'waiting',
            maxPlayers,
            currentTrick: [],
            discardPile: [],
            logs: session.state.logs,
          })
          .onConflictDoNothing();
      } catch (err) {
        console.warn('DB error inserting room:', err);
      }
    }

    return NextResponse.json({
      success: true,
      roomId,
      roomCode,
      state: playerState,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // 1. Room Code Auto-Detection endpoint for Lobby
  const checkCode = url.searchParams.get('checkCode');
  if (checkCode) {
    const cleanCode = checkCode.trim().toUpperCase();
    const testRoomId = 'room_' + cleanCode.toLowerCase();
    const session = activeRooms.get(testRoomId);

    if (session) {
      return NextResponse.json({
        success: true,
        exists: true,
        roomId: testRoomId,
        roomCode: cleanCode,
        status: session.state.status,
        playerCount: session.state.players.length,
        maxPlayers: session.state.maxPlayers,
        roundNumber: session.state.roundNumber,
      });
    }

    // Check Neon Database for existing room
    if (db) {
      try {
        const dbRoom = await db.query.rooms.findFirst({
          where: eq(rooms.code, cleanCode),
        });
        if (dbRoom) {
          return NextResponse.json({
            success: true,
            exists: true,
            roomId: dbRoom.id,
            roomCode: dbRoom.code,
            status: dbRoom.status,
            playerCount: 1,
            maxPlayers: dbRoom.maxPlayers || 4,
            roundNumber: 1,
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      exists: false,
      roomCode: cleanCode,
    });
  }

  // 2. Standard Room State / Registration endpoint
  const roomId = url.searchParams.get('roomId');
  const playerId = url.searchParams.get('playerId');
  const playerName = url.searchParams.get('playerName');
  const avatarUrl = url.searchParams.get('avatarUrl') || undefined;

  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  }

  const session = RoomManager.getOrCreateSession(roomId);

  let state = session.state;
  if (playerId && playerName) {
    state = RoomManager.registerPlayer(roomId, playerId, playerName, avatarUrl);
  } else if (playerId) {
    state = RoomManager.getPlayerState(session, playerId);
  }

  return NextResponse.json({
    success: true,
    state,
  });
}
