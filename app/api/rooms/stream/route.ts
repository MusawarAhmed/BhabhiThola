import { RoomManager } from '@/lib/game/room-manager';
import type { ServerMessage } from '@/lib/types/game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get('roomId');
  const playerId = url.searchParams.get('playerId');

  if (!roomId || !playerId) {
    return new Response('Missing roomId or playerId query parameters', { status: 400 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (msg: ServerMessage) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        } catch (e) {
          // Stream closed
        }
      };

      RoomManager.registerSseClient(roomId, playerId, send);

      cleanup = () => {
        RoomManager.unregisterSseClient(roomId, playerId);
      };

      // Keepalive ping every 15s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        cleanup?.();
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
