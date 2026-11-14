import type { WebSocket } from 'ws';
import {
  GameState,
  Card,
  PlayedCard,
  PlayerPrivate,
  PlayerPublic,
  GameLogEntry,
  ChatMessage,
  ServerMessage,
  Suit,
} from '../types/game';
import {
  dealCards,
  findAceOfSpadesHolder,
  canPlayCard,
  evaluateTrick,
  getNextActivePlayer,
  getNextClockwiseLead,
  sortHand,
  getSmartBotMove,
  SUIT_SYMBOLS,
} from './engine';
import { db } from '../db';
import { rooms, players } from '../db/schema';

interface RoomSession {
  state: GameState;
  playersPrivate: Map<string, PlayerPrivate>;
  clients: Map<string, WebSocket>;
  sseClients: Map<string, (msg: ServerMessage) => void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __bhabhi_rooms: Map<string, RoomSession> | undefined;
}

export const activeRooms: Map<string, RoomSession> =
  globalThis.__bhabhi_rooms || (globalThis.__bhabhi_rooms = new Map());

// Local sliced 3D avatar portraits directly from the user's provided sprite sheet!
export const AVATAR_PRESETS = [
  '/avatars/avatar_you.jpg',
  '/avatars/avatar_zara.jpg',
  '/avatars/avatar_ahmed.jpg',
  '/avatars/avatar_ayesha.jpg',
  '/avatars/avatar_bilal.jpg',
  '/avatars/avatar_sarah.jpg',
  '/avatars/avatar_king.jpg',
  '/avatars/avatar_queen.jpg',
];

export const BOT_NAMES = [
  'Zara',
  'Ahmed',
  'Ayesha',
  'Bilal',
  'Sarah',
  'Hamza',
  'Fatima',
  'Ali',
];

export const BOT_AVATARS = [
  '/avatars/female_f1.jpg',
  '/avatars/male_m1.jpg',
  '/avatars/female_f2.jpg',
  '/avatars/male_m2.jpg',
  '/avatars/female_f3.jpg',
  '/avatars/male_m3.jpg',
  '/avatars/female_f4.jpg',
  '/avatars/male_m4.jpg',
];

function formatTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export class RoomManager {
  static getOrCreateSession(roomId: string, roomCode?: string, maxPlayers?: number): RoomSession {
    let session = activeRooms.get(roomId);
    if (!session) {
      session = {
        state: {
          roomId,
          roomCode: roomCode || roomId.replace('room_', '').toUpperCase(),
          status: 'waiting',
          roundNumber: 1,
          maxRounds: 5,
          maxPlayers: maxPlayers && maxPlayers >= 2 && maxPlayers <= 8 ? maxPlayers : 4,
          currentTurnPlayerId: null,
          leadPlayerId: null,
          suitLed: null,
          currentTrick: [],
          discardPileCount: 0,
          players: [],
          bhabhiPlayerId: null,
          logs: [
            {
              id: 'log-' + Date.now(),
              timestamp: Date.now(),
              text: 'Royal table opened. Waiting for players to take seats...',
              type: 'info',
            },
          ],
          chatMessages: [
            {
              id: 'chat-init-1',
              playerId: 'system',
              playerName: 'Dealer',
              playerAvatar: AVATAR_PRESETS[2],
              text: 'Welcome to Bhabhi Thola! Shuffle & Deal ready.',
              timestamp: formatTime(),
            },
          ],
          isFirstTrickOfGame: true,
          lastThola: null,
          deckType: 'single',
          isDealing: false,
          safePlayersOrder: [],
          brokenSuits: [],
        },
        playersPrivate: new Map(),
        clients: new Map(),
        sseClients: new Map(),
      };
      activeRooms.set(roomId, session);
    }
    return session;
  }

  static registerPlayer(
    roomId: string,
    playerId: string,
    playerName: string,
    avatarUrl?: string
  ): GameState {
    const session = this.getOrCreateSession(roomId);

    let player = session.playersPrivate.get(playerId);
    if (!player) {
      const seat = session.playersPrivate.size;
      const isHost = seat === 0;
      const chosenAvatar = avatarUrl || AVATAR_PRESETS[seat % AVATAR_PRESETS.length];

      player = {
        id: playerId,
        name: playerName,
        avatarUrl: chosenAvatar,
        seat,
        isHost,
        isConnected: true,
        cardCount: 0,
        cards: [],
        isSafe: false,
        isBhabhi: false,
      };
      session.playersPrivate.set(playerId, player);

      session.state.logs.push({
        id: 'log-' + Date.now() + Math.random(),
        timestamp: Date.now(),
        text: `${playerName} took seat #${seat + 1}.`,
        type: 'info',
      });
    } else {
      player.isConnected = true;
      player.name = playerName;
      if (avatarUrl) {
        player.avatarUrl = avatarUrl;
      }
    }

    this.syncPublicPlayers(session);
    this.persistToDb(session).catch(() => {});
    this.broadcastState(session);

    return this.getPlayerState(session, playerId);
  }

  static updatePlayerProfile(
    roomId: string,
    playerId: string,
    playerName: string,
    avatarUrl?: string
  ): GameState {
    const session = this.getOrCreateSession(roomId);
    const player = session.playersPrivate.get(playerId);
    if (player) {
      player.name = playerName;
      if (avatarUrl) player.avatarUrl = avatarUrl;
      this.syncPublicPlayers(session);
      this.persistToDb(session).catch(() => {});
      this.broadcastState(session);
    }
    return this.getPlayerState(session, playerId);
  }

  static setMaxPlayers(
    roomId: string,
    initiatingPlayerId: string,
    maxPlayers: number
  ): GameState {
    const session = this.getOrCreateSession(roomId);
    if (maxPlayers >= 2 && maxPlayers <= 8) {
      session.state.maxPlayers = maxPlayers;
      session.state.logs.push({
        id: 'log-' + Date.now(),
        timestamp: Date.now(),
        text: `👥 Table capacity updated to ${maxPlayers} players.`,
        type: 'info',
      });
      this.syncPublicPlayers(session);
      this.persistToDb(session).catch(() => {});
      this.broadcastState(session);
    }
    return session.state;
  }

  static registerClient(
    roomId: string,
    playerId: string,
    playerName: string,
    ws: WebSocket
  ) {
    const session = this.getOrCreateSession(roomId);
    session.clients.set(playerId, ws);
    this.registerPlayer(roomId, playerId, playerName);
  }

  static unregisterClient(roomId: string, playerId: string) {
    const session = activeRooms.get(roomId);
    if (!session) return;

    session.clients.delete(playerId);
    session.sseClients.delete(playerId);
    const player = session.playersPrivate.get(playerId);
    if (player) {
      player.isConnected = false;
    }

    this.syncPublicPlayers(session);
    this.broadcastState(session);
  }

  static registerSseClient(
    roomId: string,
    playerId: string,
    sendCallback: (msg: ServerMessage) => void
  ) {
    const session = this.getOrCreateSession(roomId);
    session.sseClients.set(playerId, sendCallback);

    const playerState = this.getPlayerState(session, playerId);
    sendCallback({
      type: 'STATE_UPDATE',
      state: playerState,
      tholaInfo: session.state.lastThola || undefined,
    });
  }

  static unregisterSseClient(roomId: string, playerId: string) {
    const session = activeRooms.get(roomId);
    if (!session) return;
    session.sseClients.delete(playerId);
  }

  static getPlayerState(session: RoomSession, playerId: string): GameState {
    const playerPrivate = session.playersPrivate.get(playerId);
    return {
      ...session.state,
      myCards: playerPrivate ? playerPrivate.cards : [],
    };
  }

  static async addBotPlayer(
    roomId: string,
    initiatingPlayerId?: string
  ): Promise<{ success: boolean; state: GameState; error?: string }> {
    const session = this.getOrCreateSession(roomId);

    if (initiatingPlayerId) {
      const initiator = session.playersPrivate.get(initiatingPlayerId);
      if (initiator && !initiator.isHost) {
        return {
          success: false,
          state: session.state,
          error: 'Only the table creator (host) can add bots',
        };
      }
    }

    if (session.playersPrivate.size >= session.state.maxPlayers) {
      return { success: false, state: session.state, error: 'Table is full' };
    }

    const botIndex = session.playersPrivate.size;
    const botId = `bot_${botIndex}_${Math.random().toString(36).substring(7)}`;
    const botName = BOT_NAMES[(botIndex - 1) % BOT_NAMES.length] || `Bot ${botIndex + 1}`;
    const botAvatar = BOT_AVATARS[(botIndex - 1) % BOT_AVATARS.length] || AVATAR_PRESETS[botIndex % AVATAR_PRESETS.length];

    this.registerPlayer(roomId, botId, botName, botAvatar);
    return { success: true, state: session.state };
  }

  static sendChatMessage(
    roomId: string,
    playerId: string,
    text: string,
    isReaction = false
  ): ChatMessage | null {
    const session = activeRooms.get(roomId);
    if (!session) return null;

    const sender = session.playersPrivate.get(playerId);
    const chatMsg: ChatMessage = {
      id: 'chat-' + Date.now() + Math.random().toString(36).substring(7),
      playerId,
      playerName: sender ? sender.name : 'Spectator',
      playerAvatar: sender ? sender.avatarUrl : AVATAR_PRESETS[0],
      text,
      timestamp: formatTime(),
      isReaction,
    };

    session.state.chatMessages.push(chatMsg);
    if (session.state.chatMessages.length > 40) {
      session.state.chatMessages = session.state.chatMessages.slice(-40);
    }

    this.broadcastState(session);
    return chatMsg;
  }

  static async setDeckType(
    roomId: string,
    initiatingPlayerId: string,
    deckType: 'single' | 'double'
  ): Promise<GameState> {
    const session = this.getOrCreateSession(roomId);

    session.state.deckType = deckType;
    const desc = deckType === 'double' ? 'Double Deck (104 Cards)' : 'Single Deck (52 Cards)';
    session.state.logs.push({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      text: `🃏 Deck mode updated to: ${desc}`,
      type: 'info',
    });

    this.syncPublicPlayers(session);
    await this.persistToDb(session);
    this.broadcastState(session);
    return session.state;
  }

  static async startNextRound(roomId: string, initiatingPlayerId: string): Promise<boolean> {
    const session = activeRooms.get(roomId);
    if (!session) return false;

    session.state.roundNumber = Math.min((session.state.roundNumber || 1) + 1, session.state.maxRounds);
    return this.startGame(roomId, initiatingPlayerId);
  }

  static async startGame(roomId: string, initiatingPlayerId: string): Promise<boolean> {
    const session = activeRooms.get(roomId);
    if (!session) return false;

    const playerList = Array.from(session.playersPrivate.values());
    if (playerList.length < 2) {
      return false;
    }

    const deckType = session.state.deckType || 'single';
    const hands = dealCards(playerList.length, deckType);
    playerList.forEach((p, idx) => {
      p.cards = hands[idx];
      p.cardCount = p.cards.length;
      p.isSafe = false;
      p.isBhabhi = false;
    });

    const startingPlayerId = findAceOfSpadesHolder(playerList) || playerList[0].id;
    const starterName = session.playersPrivate.get(startingPlayerId)?.name || 'Player';

    session.state.status = 'in_progress';
    session.state.currentTurnPlayerId = startingPlayerId;
    session.state.leadPlayerId = startingPlayerId;
    session.state.suitLed = null;
    session.state.currentTrick = [];
    session.state.discardPileCount = 0;
    session.state.bhabhiPlayerId = null;
    session.state.isFirstTrickOfGame = true;
    session.state.lastThola = null;
    session.state.safePlayersOrder = [];
    session.state.brokenSuits = [];
    session.state.trickResolving = false;
    session.state.trickResultBanner = null;

    // Trigger Automated Dealer Machine animation!
    session.state.isDealing = true;

    session.state.logs.push({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      text: `Game started with ${deckType === 'double' ? 'Double Deck (104 cards)' : 'Single Deck (52 cards)'}! ${starterName} holds Ace of Spades (A♠) and leads!`,
      type: 'win',
    });

    this.syncPublicPlayers(session);
    await this.persistToDb(session);
    this.broadcastState(session);

    // After 2.4s of machine dealing animation, finish deal and enable gameplay
    setTimeout(() => {
      session.state.isDealing = false;
      RoomManager.syncPublicPlayers(session);
      RoomManager.broadcastState(session);
      RoomManager.checkAndTriggerBotTurn(session);
    }, 2400);

    return true;
  }

  static async playCard(
    roomId: string,
    playerId: string,
    cardId: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = activeRooms.get(roomId);
    if (!session) return { success: false, error: 'Room not found' };

    if (session.state.status !== 'in_progress') {
      return { success: false, error: 'Game is not in progress' };
    }

    if (session.state.trickResolving) {
      return { success: false, error: 'Trick is currently resolving, please wait' };
    }

    if (session.state.currentTurnPlayerId !== playerId) {
      return { success: false, error: 'It is not your turn' };
    }

    const player = session.playersPrivate.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    const cardIndex = player.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.cards[cardIndex];

    const check = canPlayCard(
      card,
      player.cards,
      session.state.suitLed,
      session.state.isFirstTrickOfGame
    );

    if (!check.allowed) {
      return { success: false, error: check.reason || 'Invalid card play' };
    }

    player.cards.splice(cardIndex, 1);
    player.cardCount = player.cards.length;

    if (!session.state.suitLed) {
      session.state.suitLed = card.suit;
      session.state.leadPlayerId = playerId;
    }

    const playedCard: PlayedCard = {
      card,
      playerId,
      playerName: player.name,
      playerAvatar: player.avatarUrl,
      seat: player.seat,
    };
    session.state.currentTrick.push(playedCard);

    session.state.logs.push({
      id: 'log-' + Date.now() + Math.random(),
      timestamp: Date.now(),
      text: `${player.name} played ${card.rank}${SUIT_SYMBOLS[card.suit]}`,
      type: 'play',
    });

    const eligibleToPlayThisTrick = Array.from(session.playersPrivate.values()).filter(
      (p) => (!p.isSafe && p.cards.length > 0) || session.state.currentTrick.some((tc) => tc.playerId === p.id)
    );

    const hasTholaOccurred = session.state.suitLed && card.suit !== session.state.suitLed;
    const allPlayed = session.state.currentTrick.length >= eligibleToPlayThisTrick.length;

    if (hasTholaOccurred || allPlayed) {
      this.resolveCurrentTrickWithPause(session);
    } else {
      // Find remaining candidates who haven't played in this trick yet AND still have cards
      const nextCandidates = Array.from(session.playersPrivate.values()).filter(
        (p) => !p.isSafe && p.cards.length > 0 && !session.state.currentTrick.some((tc) => tc.playerId === p.id)
      );

      let nextId: string | null = null;
      if (nextCandidates.length > 0) {
        const allList = Array.from(session.playersPrivate.values()).sort((a, b) => a.seat - b.seat);
        const currentSeat = player.seat;
        for (let off = 1; off <= allList.length; off++) {
          const candidate = allList.find((p) => p.seat === (currentSeat + off) % allList.length);
          if (candidate && nextCandidates.some((nc) => nc.id === candidate.id)) {
            nextId = candidate.id;
            break;
          }
        }
      }

      if (!nextId) {
        // Fallback: if no candidates left, resolve the trick immediately
        this.resolveCurrentTrickWithPause(session);
        return { success: true };
      }

      session.state.currentTurnPlayerId = nextId;
      this.syncPublicPlayers(session);
      await this.persistToDb(session);
      this.broadcastState(session);
      this.checkAndTriggerBotTurn(session);
    }

    return { success: true };
  }

  private static checkAndTriggerBotTurn(session: RoomSession) {
    if (session.state.trickResolving || session.state.status !== 'in_progress') return;

    const nextTurnId = session.state.currentTurnPlayerId;
    if (!nextTurnId || !nextTurnId.startsWith('bot_')) return;

    const bot = session.playersPrivate.get(nextTurnId);
    if (!bot || bot.cards.length === 0 || bot.isSafe) return;

    setTimeout(() => {
      // Re-verify conditions when timeout fires
      if (
        session.state.trickResolving ||
        session.state.status !== 'in_progress' ||
        session.state.currentTurnPlayerId !== nextTurnId
      ) {
        return;
      }

      const eligibleCount = Array.from(session.playersPrivate.values()).filter(
        (p) => !p.isSafe || session.state.currentTrick.some((tc) => tc.playerId === p.id)
      ).length;

      // Use the strategic, highly trained Bhabhi Thola Bot Engine!
      const cardToPlay = getSmartBotMove(
        bot.cards,
        session.state.currentTrick,
        session.state.suitLed,
        session.state.isFirstTrickOfGame,
        eligibleCount,
        session.state.brokenSuits || []
      );

      // Banter / reaction on throwing a Thola
      const isTholaThrow = session.state.suitLed && cardToPlay.suit !== session.state.suitLed;
      if (isTholaThrow) {
        const reactions = ['💥 THOLA!', 'Take that! 😉', 'Enjoy the cards! 🔥', 'Thola hit! 👏'];
        const chosen = reactions[Math.floor(Math.random() * reactions.length)];
        setTimeout(() => {
          RoomManager.sendChatMessage(session.state.roomId, nextTurnId, chosen);
        }, 200);
      }

      RoomManager.playCard(session.state.roomId, nextTurnId, cardToPlay.id);
    }, 1100);
  }

  private static resolveCurrentTrickWithPause(session: RoomSession) {
    if (!session.state.suitLed || session.state.currentTrick.length === 0) return;

    // 1. Evaluate trick outcome
    const result = evaluateTrick(session.state.currentTrick, session.state.suitLed);

    // Enter resolving phase - all cards stay on table and turns are locked
    session.state.trickResolving = true;
    session.state.currentTurnPlayerId = null;

    if (result.type === 'thola' && result.penalizedPlayerId && result.cardsAdded) {
      // Record this suit as broken so bots never lead it again
      if (!session.state.brokenSuits) session.state.brokenSuits = [];
      if (session.state.suitLed && !session.state.brokenSuits.includes(session.state.suitLed)) {
        session.state.brokenSuits.push(session.state.suitLed);
      }

      const penalizedPlayer = session.playersPrivate.get(result.penalizedPlayerId);
      const penalizedName = penalizedPlayer ? penalizedPlayer.name : 'Player';

      const highestLedPlay = session.state.currentTrick
        .filter((tc) => tc.card.suit === session.state.suitLed)
        .sort((a, b) => b.card.value - a.card.value)[0];

      session.state.lastThola = {
        penalizedPlayerName: penalizedName,
        cardsCount: result.cardsAdded.length,
      };

      session.state.trickResultBanner = {
        text: `💥 THOLA! ${penalizedName} took ${result.cardsAdded.length} cards!`,
        type: 'thola',
        winnerId: result.penalizedPlayerId,
        winnerName: penalizedName,
        winningCardId: highestLedPlay?.card.id,
      };

      session.state.logs.push({
        id: 'log-' + Date.now() + Math.random(),
        timestamp: Date.now(),
        text: `💥 THOLA! ${penalizedName} had highest ${session.state.suitLed} and picked up ${result.cardsAdded.length} cards!`,
        type: 'thola',
      });
    } else {
      const winningPlay = session.state.currentTrick
        .filter((tc) => tc.card.suit === session.state.suitLed)
        .sort((a, b) => b.card.value - a.card.value)[0];

      session.state.lastThola = null;
      session.state.trickResultBanner = {
        text: `✨ ${result.winnerPlayerName} won the trick!`,
        type: 'win',
        winnerId: result.winnerPlayerId,
        winnerName: result.winnerPlayerName,
        winningCardId: winningPlay?.card.id,
      };

      session.state.logs.push({
        id: 'log-' + Date.now() + Math.random(),
        timestamp: Date.now(),
        text: `✨ ${result.winnerPlayerName} won the trick!`,
        type: 'win',
      });
    }

    // Immediately broadcast so everyone sees the complete cards on table + winner banner!
    this.syncPublicPlayers(session);
    this.broadcastState(session);

    // 2. Hold full trick for 1.8 seconds (giving players time to see the turn and outcome)
    setTimeout(async () => {
      // Re-verify session is still active
      if (!activeRooms.has(session.state.roomId)) return;

      if (result.type === 'thola' && result.penalizedPlayerId && result.cardsAdded) {
        const penalizedPlayer = session.playersPrivate.get(result.penalizedPlayerId);
        if (penalizedPlayer) {
          penalizedPlayer.cards = sortHand([...penalizedPlayer.cards, ...result.cardsAdded]);
          penalizedPlayer.cardCount = penalizedPlayer.cards.length;
          penalizedPlayer.isSafe = false;
        }
      } else {
        session.state.discardPileCount += session.state.currentTrick.length;
      }

      // CRITICAL: Check safe status FIRST before picking next lead!
      // Anyone with 0 cards who didn't take penalty is officially SAFE (out of active play)!
      session.playersPrivate.forEach((p) => {
        if (p.cards.length === 0 && !p.isSafe) {
          p.isSafe = true;
          if (!session.state.safePlayersOrder) session.state.safePlayersOrder = [];
          if (!session.state.safePlayersOrder.includes(p.id)) {
            session.state.safePlayersOrder.push(p.id);
          }
          session.state.logs.push({
            id: 'log-' + Date.now() + Math.random(),
            timestamp: Date.now(),
            text: `🎉 ${p.name} discarded all cards and is SAFE!`,
            type: 'safe',
          });
          if (p.id.startsWith('bot_')) {
            RoomManager.sendChatMessage(session.state.roomId, p.id, 'I am SAFE! 😎');
          }
        }
      });

      // Clear the trick from table
      session.state.currentTrick = [];
      session.state.suitLed = null;
      session.state.isFirstTrickOfGame = false;
      session.state.trickResolving = false;
      session.state.trickResultBanner = null;

      // Check for Game Over: count remaining players who are NOT safe and still have cards!
      const remainingUnsafe = Array.from(session.playersPrivate.values()).filter(
        (p) => !p.isSafe && p.cards.length > 0
      );

      if (remainingUnsafe.length <= 1) {
        if (remainingUnsafe.length === 1) {
          RoomManager.declareBhabhi(session, remainingUnsafe[0]);
        }
        session.state.currentTurnPlayerId = null;
        session.state.leadPlayerId = null;
      } else {
        // Game continues with at least 2 active players with cards!
        let nextLeadId: string | null = null;

        if (result.type === 'thola' && result.penalizedPlayerId) {
          nextLeadId = result.penalizedPlayerId;
        } else {
          // Trick won normally: winner leads if they still have cards
          const winnerCandidate = session.playersPrivate.get(result.nextLeadPlayerId);
          if (winnerCandidate && !winnerCandidate.isSafe && winnerCandidate.cards.length > 0) {
            nextLeadId = winnerCandidate.id;
          } else {
            // Winner became SAFE! Lead passes clockwise to the next active player with cards!
            const winnerSeat = winnerCandidate ? winnerCandidate.seat : 0;
            nextLeadId = getNextClockwiseLead(
              Array.from(session.playersPrivate.values()),
              winnerSeat
            );
          }
        }

        session.state.currentTurnPlayerId = nextLeadId;
        session.state.leadPlayerId = nextLeadId;
      }

      RoomManager.syncPublicPlayers(session);
      await RoomManager.persistToDb(session);
      RoomManager.broadcastState(session);

      // Trigger bot turn if next leader is a bot!
      if (session.state.status === 'in_progress') {
        RoomManager.checkAndTriggerBotTurn(session);
      }
    }, 1800);
  }

  private static declareBhabhi(session: RoomSession, bhabhiPlayer: PlayerPrivate) {
    bhabhiPlayer.isBhabhi = true;
    session.state.status = 'game_over';
    session.state.bhabhiPlayerId = bhabhiPlayer.id;
    session.state.currentTurnPlayerId = null;

    session.state.logs.push({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      text: `👑 GAME OVER! ${bhabhiPlayer.name} is the BHABHI!`,
      type: 'game_over',
    });
  }

  static async resetGame(roomId: string): Promise<boolean> {
    const session = activeRooms.get(roomId);
    if (!session) return false;

    session.playersPrivate.forEach((p) => {
      p.cards = [];
      p.cardCount = 0;
      p.isSafe = false;
      p.isBhabhi = false;
    });

    session.state.status = 'waiting';
    session.state.currentTurnPlayerId = null;
    session.state.leadPlayerId = null;
    session.state.suitLed = null;
    session.state.currentTrick = [];
    session.state.discardPileCount = 0;
    session.state.bhabhiPlayerId = null;
    session.state.isFirstTrickOfGame = true;
    session.state.lastThola = null;

    session.state.logs.push({
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      text: 'New round started. Cards ready to deal!',
      type: 'info',
    });

    this.syncPublicPlayers(session);
    await this.persistToDb(session);
    this.broadcastState(session);
    return true;
  }

  private static syncPublicPlayers(session: RoomSession) {
    session.state.players = Array.from(session.playersPrivate.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      seat: p.seat,
      isHost: p.isHost,
      isConnected: p.isConnected,
      cardCount: p.cardCount,
      isSafe: p.isSafe,
      isBhabhi: p.isBhabhi,
    }));
  }

  static broadcastState(session: RoomSession) {
    session.clients.forEach((ws, playerId) => {
      if (ws.readyState === 1) {
        const playerState = this.getPlayerState(session, playerId);
        const msg: ServerMessage = {
          type: 'STATE_UPDATE',
          state: playerState,
          tholaInfo: session.state.lastThola || undefined,
        };
        try {
          ws.send(JSON.stringify(msg));
        } catch (err) {
          console.error('Failed to send WS message:', err);
        }
      }
    });

    session.sseClients.forEach((sendCallback, playerId) => {
      const playerState = this.getPlayerState(session, playerId);
      const msg: ServerMessage = {
        type: 'STATE_UPDATE',
        state: playerState,
        tholaInfo: session.state.lastThola || undefined,
      };
      try {
        sendCallback(msg);
      } catch (err) {
        console.error('Failed to send SSE message:', err);
      }
    });
  }

  private static async persistToDb(session: RoomSession) {
    if (!db) return;
    try {
      await db
        .insert(rooms)
        .values({
          id: session.state.roomId,
          code: session.state.roomCode,
          status: session.state.status,
          currentTurnPlayerId: session.state.currentTurnPlayerId,
          leadPlayerId: session.state.leadPlayerId,
          suitLed: session.state.suitLed,
          currentTrick: session.state.currentTrick,
          discardPile: [],
          bhabhiPlayerId: session.state.bhabhiPlayerId,
          maxPlayers: session.state.maxPlayers,
          isFirstTrick: session.state.isFirstTrickOfGame,
          logs: session.state.logs.slice(-30),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: rooms.id,
          set: {
            status: session.state.status,
            currentTurnPlayerId: session.state.currentTurnPlayerId,
            leadPlayerId: session.state.leadPlayerId,
            suitLed: session.state.suitLed,
            currentTrick: session.state.currentTrick,
            bhabhiPlayerId: session.state.bhabhiPlayerId,
            isFirstTrick: session.state.isFirstTrickOfGame,
            logs: session.state.logs.slice(-30),
            updatedAt: new Date(),
          },
        });
    } catch (e) {
      console.warn('Neon DB sync warning:', e);
    }
  }
}
