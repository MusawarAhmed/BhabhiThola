import { upgradeWebSocket } from '@vercel/functions';
import { RoomManager } from '@/lib/game/room-manager';
import type { ClientMessage } from '@/lib/types/game';
import type { WebSocket } from 'ws';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get('roomId');
  const playerId = url.searchParams.get('playerId');
  const playerName = url.searchParams.get('playerName') || 'Player';

  if (!roomId || !playerId) {
    return new Response('Missing roomId or playerId query parameters', { status: 400 });
  }

  try {
    return upgradeWebSocket((ws: WebSocket) => {
      // Register the client socket in room session
      RoomManager.registerClient(roomId, playerId, playerName, ws);

      ws.on('message', async (data) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());

          switch (message.type) {
            case 'START_GAME':
              await RoomManager.startGame(message.roomId, playerId);
              break;

            case 'PLAY_CARD':
              if (message.cardId) {
                const res = await RoomManager.playCard(message.roomId, playerId, message.cardId);
                if (!res.success) {
                  ws.send(JSON.stringify({ type: 'ERROR', message: res.error }));
                }
              }
              break;

            case 'RESET_GAME':
              await RoomManager.resetGame(message.roomId);
              break;

            case 'START_NEXT_ROUND':
              await RoomManager.startNextRound(message.roomId, playerId);
              break;

            case 'ADD_BOT': {
              const res = await RoomManager.addBotPlayer(message.roomId, playerId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'ERROR', message: res.error }));
              }
              break;
            }

            case 'SET_MAX_PLAYERS':
              if (message.maxPlayers) {
                RoomManager.setMaxPlayers(message.roomId, playerId, message.maxPlayers);
              }
              break;

            case 'UPDATE_PROFILE':
              if (message.playerName) {
                RoomManager.updatePlayerProfile(
                  message.roomId,
                  playerId,
                  message.playerName,
                  message.playerAvatar
                );
              }
              break;

            case 'SEND_CHAT':
              if (message.chatText) {
                RoomManager.sendChatMessage(message.roomId, playerId, message.chatText);
              }
              break;

            case 'SET_DECK_TYPE':
              if (message.deckType) {
                await RoomManager.setDeckType(message.roomId, playerId, message.deckType);
              }
              break;

            case 'PING':
              ws.send(JSON.stringify({ type: 'PONG' }));
              break;
          }
        } catch (err) {
          console.error('Error processing WS message:', err);
        }
      });

      ws.on('close', () => {
        RoomManager.unregisterClient(roomId, playerId);
      });

      ws.on('error', (err) => {
        console.error('WebSocket connection error:', err);
        RoomManager.unregisterClient(roomId, playerId);
      });
    });
  } catch (err: any) {
    // If not in Vercel Fluid Compute runtime (e.g. local next start/dev),
    // register the player via RoomManager and inform the client to use SSE/HTTP fallback
    RoomManager.registerPlayer(roomId, playerId, playerName);
    return new Response(
      JSON.stringify({
        status: 'fallback',
        message: 'upgradeWebSocket requires Vercel runtime. Using SSE/HTTP fallback.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
