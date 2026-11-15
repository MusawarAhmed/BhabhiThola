export type Suit = 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string; // e.g., 'SPADES-A'
  suit: Suit;
  rank: Rank;
  value: number; // 2..14 (Ace = 14)
}

export interface PlayedCard {
  card: Card;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  seat: number;
}

export interface PlayerPublic {
  id: string;
  name: string;
  avatarUrl: string;
  seat: number;
  isHost: boolean;
  isConnected: boolean;
  cardCount: number;
  isSafe: boolean;
  isBhabhi: boolean;
}

export interface PlayerPrivate extends PlayerPublic {
  cards: Card[];
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'play' | 'thola' | 'win' | 'safe' | 'game_over';
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;
  timestamp: string; // "10:24 PM"
  isReaction?: boolean;
}

export type GameStatus = 'waiting' | 'in_progress' | 'game_over';

export interface TrickResultBanner {
  text: string;
  type: 'win' | 'thola';
  winnerId?: string;
  winnerName?: string;
  winningCardId?: string;
}

export type DeckType = 'single' | 'double';

export interface GameState {
  roomId: string;
  roomCode: string;
  status: GameStatus;
  roundNumber: number;
  maxRounds: number;
  maxPlayers: number;
  currentTurnPlayerId: string | null;
  leadPlayerId: string | null;
  suitLed: Suit | null;
  currentTrick: PlayedCard[];
  discardPileCount: number;
  players: PlayerPublic[];
  myCards?: Card[];
  bhabhiPlayerId: string | null;
  logs: GameLogEntry[];
  chatMessages: ChatMessage[];
  isFirstTrickOfGame: boolean;
  trickResolving?: boolean;
  trickResultBanner?: TrickResultBanner | null;
  deckType?: DeckType;
  isDealing?: boolean;
  safePlayersOrder?: string[];
  brokenSuits?: Suit[];
  turnSecondsLimit?: number;
  lastThola?: {
    penalizedPlayerName: string;
    cardsCount: number;
  } | null;
  consecutiveTholaPlayerId?: string | null;
  consecutiveTholaCount?: number;
}

// WebSocket / Action Message Types
export type ClientMessageType =
  | 'JOIN_ROOM'
  | 'START_GAME'
  | 'PLAY_CARD'
  | 'RESET_GAME'
  | 'ADD_BOT'
  | 'SEND_CHAT'
  | 'SET_DECK_TYPE'
  | 'SET_MAX_PLAYERS'
  | 'UPDATE_PROFILE'
  | 'START_NEXT_ROUND'
  | 'PING';

export interface ClientMessage {
  type: ClientMessageType;
  roomId: string;
  playerId?: string;
  playerName?: string;
  playerAvatar?: string;
  cardId?: string;
  chatText?: string;
  deckType?: DeckType;
  maxPlayers?: number;
}

export type ServerMessageType =
  | 'STATE_UPDATE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'CARD_PLAYED'
  | 'THOLA_ALERT'
  | 'NEW_CHAT'
  | 'ERROR'
  | 'PONG';

export interface ServerMessage {
  type: ServerMessageType;
  state?: GameState;
  chatMessage?: ChatMessage;
  message?: string;
  tholaInfo?: {
    penalizedPlayerName: string;
    cardsCount: number;
  };
}
