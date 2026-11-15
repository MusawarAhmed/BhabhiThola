import { Card, Suit, Rank, PlayedCard, PlayerPrivate, PlayerPublic } from '../types/game';

export const SUITS: Suit[] = ['SPADES', 'HEARTS', 'CLUBS', 'DIAMONDS'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  SPADES: '♠',
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  SPADES: 'text-slate-900',
  HEARTS: 'text-red-600',
  DIAMONDS: 'text-red-600',
  CLUBS: 'text-slate-900',
};

export function getRankValue(rank: Rank): number {
  switch (rank) {
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
    case '5': return 5;
    case '6': return 6;
    case '7': return 7;
    case '8': return 8;
    case '9': return 9;
    case '10': return 10;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
  }
}

export function createDeck(deckType: 'single' | 'double' = 'single'): Card[] {
  const deck: Card[] = [];
  const copies = deckType === 'double' ? 2 : 1;

  for (let copy = 1; copy <= copies; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: copies > 1 ? `${suit}-${rank}-d${copy}` : `${suit}-${rank}`,
          suit,
          rank,
          value: getRankValue(rank),
        });
      }
    }
  }
  return deck;
}

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortHand(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    SPADES: 1,
    HEARTS: 2,
    CLUBS: 3,
    DIAMONDS: 4,
  };

  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return b.value - a.value;
  });
}

export function dealCards(
  playerCount: number,
  deckType: 'single' | 'double' = 'single'
): Card[][] {
  const deck = shuffleDeck(createDeck(deckType));
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);

  for (let i = 0; i < deck.length; i++) {
    hands[i % playerCount].push(deck[i]);
  }

  return hands.map(sortHand);
}

export function findAceOfSpadesHolder(players: { id: string; cards: Card[] }[]): string | null {
  for (const player of players) {
    if (player.cards.some((c) => c.suit === 'SPADES' && c.rank === 'A')) {
      return player.id;
    }
  }
  return players[0]?.id || null;
}

export function canPlayCard(
  card: Card,
  playerHand: Card[],
  suitLed: Suit | null,
  isFirstTrickOfGame: boolean
): { allowed: boolean; reason?: string } {
  if (isFirstTrickOfGame && suitLed === null) {
    if (card.suit === 'SPADES' && card.rank === 'A') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Game must be opened with the Ace of Spades (A♠)' };
  }

  if (!suitLed) {
    return { allowed: true };
  }

  const hasSuit = playerHand.some((c) => c.suit === suitLed);
  if (hasSuit) {
    if (card.suit === suitLed) {
      return { allowed: true };
    }
    return { allowed: false, reason: `You must follow suit (${suitLed})` };
  }

  return { allowed: true };
}

export interface TrickResult {
  type: 'thola' | 'win';
  penalizedPlayerId?: string;
  penalizedPlayerName?: string;
  tholaGiverPlayerId?: string;
  tholaGiverPlayerName?: string;
  cardsAdded?: Card[];
  winnerPlayerId?: string;
  winnerPlayerName?: string;
  nextLeadPlayerId: string;
}

export function evaluateTrick(
  currentTrick: PlayedCard[],
  suitLed: Suit,
  isFirstTrickOfGame: boolean = false
): TrickResult {
  // CRITICAL OFFICIAL BHABHI RULE: First trick (Ace of Spades opening) CANNOT result in a Thulla!
  // Any off-suit cards played in trick 1 are simply thrown away to the discard pile without penalty.
  if (isFirstTrickOfGame) {
    const suitCards = currentTrick.filter((p) => p.card.suit === suitLed);
    let highestPlay = suitCards[0] || currentTrick[0];
    for (const play of suitCards) {
      if (play.card.value > highestPlay.card.value) {
        highestPlay = play;
      }
    }
    return {
      type: 'win',
      winnerPlayerId: highestPlay.playerId,
      winnerPlayerName: highestPlay.playerName,
      nextLeadPlayerId: highestPlay.playerId,
    };
  }

  const hasThola = currentTrick.some((p) => p.card.suit !== suitLed);

  if (hasThola) {
    const tholaPlay = currentTrick.find((p) => p.card.suit !== suitLed);
    const suitCards = currentTrick.filter((p) => p.card.suit === suitLed);
    let highestPlay = suitCards[0];
    for (const play of suitCards) {
      if (play.card.value > highestPlay.card.value) {
        highestPlay = play;
      }
    }

    const allCardsInTrick = currentTrick.map((p) => p.card);

    return {
      type: 'thola',
      penalizedPlayerId: highestPlay.playerId,
      penalizedPlayerName: highestPlay.playerName,
      tholaGiverPlayerId: tholaPlay?.playerId,
      tholaGiverPlayerName: tholaPlay?.playerName,
      cardsAdded: allCardsInTrick,
      nextLeadPlayerId: highestPlay.playerId,
    };
  }

  let winningPlay = currentTrick[0];
  for (const play of currentTrick) {
    if (play.card.value > winningPlay.card.value) {
      winningPlay = play;
    }
  }

  return {
    type: 'win',
    winnerPlayerId: winningPlay.playerId,
    winnerPlayerName: winningPlay.playerName,
    nextLeadPlayerId: winningPlay.playerId,
  };
}

export function getNextActivePlayer(
  activePlayers: PlayerPublic[],
  currentPlayerId: string
): string | null {
  // STRICT FILTER: A player is only active if NOT safe AND holds at least 1 card!
  const eligible = activePlayers.filter((p) => !p.isSafe && (p.cardCount ?? 0) > 0);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0].id;
  const currentIndex = eligible.findIndex((p) => p.id === currentPlayerId);
  if (currentIndex === -1) return eligible[0].id;
  const nextIndex = (currentIndex + 1) % eligible.length;
  return eligible[nextIndex].id;
}

/**
 * Finds the immediate next active player in clockwise seat order starting from a given seat.
 * Used when a trick winner or leader becomes SAFE (0 cards) and cannot lead the next trick.
 */
export function getNextClockwiseLead(
  allPlayers: { id: string; seat: number; isSafe: boolean; cardCount: number }[],
  fromSeat: number
): string | null {
  const eligible = allPlayers.filter((p) => !p.isSafe && p.cardCount > 0);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0].id;

  const sortedBySeat = [...allPlayers].sort((a, b) => a.seat - b.seat);
  const total = sortedBySeat.length;

  for (let offset = 1; offset <= total; offset++) {
    const candidateSeat = (fromSeat + offset) % total;
    const candidate = sortedBySeat.find((p) => p.seat === candidateSeat);
    if (candidate && !candidate.isSafe && candidate.cardCount > 0) {
      return candidate.id;
    }
  }

  return eligible[0].id;
}

/**
 * Highly trained, strategic Bhabhi Thola Bot Engine
 */
export function getSmartBotMove(
  botHand: Card[],
  currentTrick: PlayedCard[],
  suitLed: Suit | null,
  isFirstTrickOfGame: boolean,
  eligiblePlayersCount: number,
  brokenSuits: Suit[] = []
): Card {
  // 1. Mandatory Ace of Spades on game opening
  if (isFirstTrickOfGame && !suitLed) {
    const aceOfSpades = botHand.find((c) => c.suit === 'SPADES' && c.rank === 'A');
    if (aceOfSpades) return aceOfSpades;
  }

  // 2. Bot is LEADING a new trick (suitLed === null)
  if (!suitLed) {
    // Group bot's hand by suits
    const suitCounts = botHand.reduce<Record<Suit, Card[]>>(
      (acc, c) => {
        acc[c.suit].push(c);
        return acc;
      },
      { SPADES: [], HEARTS: [], CLUBS: [], DIAMONDS: [] }
    );

    // CRITICAL BHABHI RULE: NEVER lead a "broken" suit where opponents are known to be void!
    // If a suit already resulted in a Thola, leading it invites an immediate penalty.
    const unbrokenSuits = Object.entries(suitCounts).filter(
      ([suit, cards]) => cards.length > 0 && !brokenSuits.includes(suit as Suit)
    );

    if (unbrokenSuits.length > 0) {
      // Pick the LONGEST unbroken suit (statistically safest, all opponents likely hold it)
      unbrokenSuits.sort((a, b) => b[1].length - a[1].length);
      const targetSuitCards = unbrokenSuits[0][1];

      // Lead with the LOWEST card of this unbroken suit!
      // This forces other players to play higher cards and win the trick, passing the lead away from the bot!
      const sortedLowToHigh = [...targetSuitCards].sort((a, b) => a.value - b.value);
      return sortedLowToHigh[0];
    }

    // If all available suits have been broken, lead from the longest suit overall with the lowest card
    const availableSuits = Object.values(suitCounts).filter((cards) => cards.length > 0);
    availableSuits.sort((a, b) => b.length - a.length);

    if (availableSuits.length > 0) {
      const sorted = [...availableSuits[0]].sort((a, b) => a.value - b.value);
      return sorted[0];
    }

    // Fallback: lowest card in hand
    return [...botHand].sort((a, b) => a.value - b.value)[0];
  }

  // 3. Bot must follow suit or has a Thola opportunity
  const matchingCards = botHand.filter((c) => c.suit === suitLed);

  // === SCENARIO A: Bot HAS the suit led ===
  if (matchingCards.length > 0) {
    const sortedMatching = [...matchingCards].sort((a, b) => a.value - b.value);
    const highestSuitInTrick = Math.max(
      ...currentTrick.filter((p) => p.card.suit === suitLed).map((p) => p.card.value)
    );
    const hasTholaOccurred = currentTrick.some((p) => p.card.suit !== suitLed);
    const isLastPlayer = currentTrick.length + 1 >= eligiblePlayersCount;

    // Subcase A1: Someone already threw a Thola!
    if (hasTholaOccurred) {
      // DANGER: whoever has the highest card of suitLed will receive the Thola!
      // Bot must play a card LOWER than highestSuitInTrick if possible!
      const safeUnderCards = sortedMatching.filter((c) => c.value < highestSuitInTrick);
      if (safeUnderCards.length > 0) {
        // Play the highest possible card that is STILL safe and under!
        // This safely purges a high card from the bot's hand without getting penalized!
        return safeUnderCards[safeUnderCards.length - 1];
      }
      // If forced to exceed or no choice, play lowest card
      return sortedMatching[0];
    }

    // Subcase A2: No Thola yet, and bot is the LAST player to play
    if (isLastPlayer) {
      // Trick is 100% safe! Discard highest card safely
      return sortedMatching[sortedMatching.length - 1];
    }

    // Subcase A3: No Thola yet, but other players still have to play after the bot
    // Playing too high is risky because an upcoming player might Thola the bot.
    // If table already has a higher card than bot's highest, bot is safe under that card!
    const cardsBelowTableMax = sortedMatching.filter((c) => c.value < highestSuitInTrick);
    if (cardsBelowTableMax.length > 0) {
      // Safe to dump highest card that is below the current leader
      return cardsBelowTableMax[cardsBelowTableMax.length - 1];
    }

    // Otherwise, play lowest card to minimize Thola risk
    return sortedMatching[0];
  }

  // === SCENARIO B: Bot does NOT have the suit led -> THOLA HIT! ===
  // Golden opportunity to purge the highest, most dangerous card in the hand!
  const dangerousHighCards = [...botHand].sort((a, b) => b.value - a.value);
  return dangerousHighCards[0];
}
