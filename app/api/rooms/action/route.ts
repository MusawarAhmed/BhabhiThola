import { NextResponse } from 'next/server';
import { RoomManager } from '@/lib/game/room-manager';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { roomId, playerId, type, cardId, chatText, isReaction } = body;

    if (!roomId || !playerId || !type) {
      return NextResponse.json({ error: 'Missing roomId, playerId or type' }, { status: 400 });
    }

    const session = await RoomManager.ensureSession(roomId);

    switch (type) {
      case 'START_GAME': {
        const success = await RoomManager.startGame(roomId, playerId);
        return NextResponse.json({
          success,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'PLAY_CARD': {
        if (!cardId) {
          return NextResponse.json({ error: 'cardId required' }, { status: 400 });
        }
        const res = await RoomManager.playCard(roomId, playerId, cardId);
        return NextResponse.json({
          success: res.success,
          error: res.error,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'ADD_BOT': {
        const res = await RoomManager.addBotPlayer(roomId, playerId);
        return NextResponse.json({
          success: res.success,
          error: res.error,
          state: RoomManager.getPlayerState(session, playerId),
        }, { status: res.success ? 200 : 403 });
      }

      case 'RESET_GAME': {
        const success = await RoomManager.resetGame(roomId);
        return NextResponse.json({
          success,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'START_NEXT_ROUND': {
        const success = await RoomManager.startNextRound(roomId, playerId);
        return NextResponse.json({
          success,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'SET_DECK_TYPE': {
        const { deckType } = body;
        const state = await RoomManager.setDeckType(roomId, playerId, deckType || 'single');
        return NextResponse.json({
          success: true,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'SET_MAX_PLAYERS': {
        const { maxPlayers } = body;
        const state = RoomManager.setMaxPlayers(roomId, playerId, maxPlayers || 4);
        return NextResponse.json({
          success: true,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'UPDATE_PROFILE': {
        const { playerName, playerAvatar } = body;
        const state = RoomManager.updatePlayerProfile(roomId, playerId, playerName || 'Player', playerAvatar);
        return NextResponse.json({
          success: true,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      case 'SEND_CHAT': {
        if (!chatText) {
          return NextResponse.json({ error: 'chatText required' }, { status: 400 });
        }
        const msg = RoomManager.sendChatMessage(roomId, playerId, chatText, isReaction);
        return NextResponse.json({
          success: true,
          chatMessage: msg,
          state: RoomManager.getPlayerState(session, playerId),
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
