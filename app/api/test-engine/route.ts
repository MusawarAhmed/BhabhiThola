import { NextResponse } from 'next/server';
import {
  createDeck,
  dealCards,
  findAceOfSpadesHolder,
  canPlayCard,
  evaluateTrick,
  getSmartBotMove,
  getNextActivePlayer,
  getNextClockwiseLead,
} from '@/lib/game/engine';
import { PlayerPublic } from '@/lib/types/game';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hands = dealCards(4);

  const players = [
    { id: 'p1', name: 'Alice', cards: hands[0] },
    { id: 'p2', name: 'Bob', cards: hands[1] },
    { id: 'p3', name: 'Charlie', cards: hands[2] },
    { id: 'p4', name: 'Dave', cards: hands[3] },
  ];

  const starterId = findAceOfSpadesHolder(players);
  const starter = players.find((p) => p.id === starterId);

  // Test smart bot scenario 1: When a Thola has occurred, bot dumps highest card UNDER table leader
  const trickWithThola = [
    { card: { id: 'sK', suit: 'SPADES' as const, value: 13, rank: 'K' as const }, playerId: 'p1', playerName: 'Player1', seat: 0 },
    { card: { id: 'hA', suit: 'HEARTS' as const, value: 14, rank: 'A' as const }, playerId: 'p2', playerName: 'TholaPlayer', seat: 1 },
  ];
  const botHandWithSpades = [
    { id: 's4', suit: 'SPADES' as const, value: 4, rank: '4' as const },
    { id: 's8', suit: 'SPADES' as const, value: 8, rank: '8' as const },
    { id: 's10', suit: 'SPADES' as const, value: 10, rank: '10' as const },
    { id: 'sA', suit: 'SPADES' as const, value: 14, rank: 'A' as const }, // would cause bot to take penalty if played!
  ];
  const botMoveSafeUnder = getSmartBotMove(botHandWithSpades, trickWithThola, 'SPADES', false, 4);

  // Test smart bot scenario 2: Thola opportunity -> bot dumps most dangerous high card
  const botHandVoidInSpades = [
    { id: 'c3', suit: 'CLUBS' as const, value: 3, rank: '3' as const },
    { id: 'h5', suit: 'HEARTS' as const, value: 5, rank: '5' as const },
    { id: 'dA', suit: 'DIAMONDS' as const, value: 14, rank: 'A' as const }, // heavy Ace of Diamonds
  ];
  const botMoveTholaHit = getSmartBotMove(botHandVoidInSpades, trickWithThola, 'SPADES', false, 4);

  return NextResponse.json({
    status: 'ok',
    gameDeckCount: createDeck().length,
    dealtHandSizes: hands.map((h) => h.length),
    aceOfSpadesStarter: starter?.name,
    smartBotTests: {
      botAvoidsTholaPenalty: {
        playedCard: botMoveSafeUnder.rank + botMoveSafeUnder.suit,
        success: botMoveSafeUnder.rank === '10' && botMoveSafeUnder.value < 13,
      },
      botDumpsDangerousHighCardOnThola: {
        playedCard: botMoveTholaHit.rank + botMoveTholaHit.suit,
        success: botMoveTholaHit.value === 14,
      },
    },
    safeTurnExclusionTests: {
      safePlayerExcludedFromNextTurn: (() => {
        // Player 3 (Ayesha) has 0 cards and is safe
        const testPlayers: PlayerPublic[] = [
          { id: 'mk', name: 'mk', seat: 0, cardCount: 5, isSafe: false, avatarUrl: '', isHost: true, isConnected: true, isBhabhi: false },
          { id: 'zara', name: 'Zara', seat: 1, cardCount: 8, isSafe: false, avatarUrl: '', isHost: false, isConnected: true, isBhabhi: false },
          { id: 'ayesha', name: 'Ayesha', seat: 2, cardCount: 0, isSafe: true, avatarUrl: '', isHost: false, isConnected: true, isBhabhi: false },
        ];
        // If turn was on Zara, next active player should be mk (Ayesha skipped!)
        const next = getNextActivePlayer(testPlayers, 'zara');
        return {
          expected: 'mk',
          received: next,
          success: next === 'mk',
        };
      })(),
      winnerBecomesSafeLeadPassesClockwise: (() => {
        const testSeats = [
          { id: 'mk', seat: 0, isSafe: false, cardCount: 4 },
          { id: 'zara', seat: 1, isSafe: false, cardCount: 3 },
          { id: 'ayesha', seat: 2, isSafe: true, cardCount: 0 }, // won trick but now 0 cards
          { id: 'ahmed', seat: 3, isSafe: false, cardCount: 6 },
        ];
        // Starting clockwise from Ayesha's seat 2, next eligible is Ahmed at seat 3!
        const nextLead = getNextClockwiseLead(testSeats, 2);
        return {
          expected: 'ahmed',
          received: nextLead,
          success: nextLead === 'ahmed',
        };
      })(),
    },
  });
}
