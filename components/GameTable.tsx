'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GameState, Card, ServerMessage, PlayerPublic, ChatMessage, DeckType } from '@/lib/types/game';
import { CardView } from './CardView';
import { GameOverModal } from './GameOverModal';
import { DealerMachine } from './DealerMachine';
import { SUIT_SYMBOLS } from '@/lib/game/engine';
import {
  Crown,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  Play,
  Flame,
  Shield,
  Bot,
  MessageSquare,
  Send,
  ArrowLeftRight,
  Sparkles,
  Minus,
  X,
  Layers,
  User,
  Users,
  HelpCircle,
} from 'lucide-react';
import { ProfileModal, UserProfile } from './ProfileModal';
import { useTheme } from '@/lib/theme/theme-context';
import { LANGUAGE_LABELS } from '@/lib/i18n';

interface GameTableProps {
  roomId: string;
  roomCode: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  onLeave: () => void;
}

interface SeatCoordinate {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  transform?: string;
}

function getSeatCoordinates(totalSeats: number, seatOffsetFromMe: number): SeatCoordinate {
  if (seatOffsetFromMe === 0) {
    return { left: '12%', bottom: '-22px', transform: 'none' };
  }

  const PRESET_COORDS: Record<number, SeatCoordinate[]> = {
    2: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '50%', top: '-26px', transform: 'translateX(-50%)' },
    ],
    3: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '18%', top: '-22px', transform: 'none' },
      { right: '18%', top: '-22px', transform: 'none' },
    ],
    4: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '-6px', top: '50%', transform: 'translateY(-50%)' },
      { left: '50%', top: '-26px', transform: 'translateX(-50%)' },
      { right: '-6px', top: '50%', transform: 'translateY(-50%)' },
    ],
    5: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '-6px', top: '65%', transform: 'translateY(-50%)' },
      { left: '22%', top: '-22px', transform: 'none' },
      { right: '22%', top: '-22px', transform: 'none' },
      { right: '-6px', top: '65%', transform: 'translateY(-50%)' },
    ],
    6: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '-6px', top: '65%', transform: 'translateY(-50%)' },
      { left: '14%', top: '-22px', transform: 'none' },
      { left: '50%', top: '-26px', transform: 'translateX(-50%)' },
      { right: '14%', top: '-22px', transform: 'none' },
      { right: '-6px', top: '65%', transform: 'translateY(-50%)' },
    ],
    7: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '-6px', top: '70%', transform: 'translateY(-50%)' },
      { left: '-2px', top: '28%', transform: 'translateY(-50%)' },
      { left: '30%', top: '-24px', transform: 'none' },
      { right: '30%', top: '-24px', transform: 'none' },
      { right: '-2px', top: '28%', transform: 'translateY(-50%)' },
      { right: '-6px', top: '70%', transform: 'translateY(-50%)' },
    ],
    8: [
      { left: '12%', bottom: '-22px', transform: 'none' },
      { left: '-6px', top: '70%', transform: 'translateY(-50%)' },
      { left: '-2px', top: '28%', transform: 'translateY(-50%)' },
      { left: '24%', top: '-24px', transform: 'none' },
      { left: '50%', top: '-26px', transform: 'translateX(-50%)' },
      { right: '24%', top: '-24px', transform: 'none' },
      { right: '-2px', top: '28%', transform: 'translateY(-50%)' },
      { right: '-6px', top: '70%', transform: 'translateY(-50%)' },
    ],
  };

  const seatsForCount = PRESET_COORDS[totalSeats] || PRESET_COORDS[4];
  return seatsForCount[seatOffsetFromMe] || { left: '50%', top: '0', transform: 'translate(-50%, -50%)' };
}

export const GameTable: React.FC<GameTableProps> = ({
  roomId,
  roomCode,
  playerId,
  playerName,
  playerAvatar,
  onLeave,
}) => {
  const { theme, animationSettings, activeEvent, cardDesign, language, setLanguage, t } = useTheme();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [showMatchStatusMobile, setShowMatchStatusMobile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sortMode, setSortMode] = useState<'suit' | 'rank'>('suit');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tholaNotification, setTholaNotification] = useState<{
    name: string;
    count: number;
  } | null>(null);
  const [turnCountdown, setTurnCountdown] = useState<number>(15);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const recordedRoundRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ cardId: string; y: number; x: number; time: number } | null>(null);
  const touchedRecentlyRef = useRef<boolean>(false);

  // Deselect card on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCardId) {
        setSelectedCardId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardId]);

  // Record Game Stats on Round/Game Completion
  useEffect(() => {
    if (gameState?.status === 'game_over') {
      const currentRound = gameState.roundNumber || 1;
      if (recordedRoundRef.current === currentRound) return;
      recordedRoundRef.current = currentRound;

      const me = gameState?.players.find((p) => p.id === playerId);
      const isSafe = Boolean(me?.isSafe);
      const isBhabhi = Boolean(me?.isBhabhi || gameState.bhabhiPlayerId === playerId);

      const stored = localStorage.getItem('bhabhi_user_profile');
      let isGuest = true;
      let uId = playerId;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          isGuest = parsed.authProvider === 'guest';
          uId = parsed.id || playerId;
          parsed.gamesPlayed = (parsed.gamesPlayed || 0) + 1;
          if (isSafe) parsed.gamesWon = (parsed.gamesWon || 0) + 1;
          if (isBhabhi) parsed.bhabhiCount = (parsed.bhabhiCount || 0) + 1;
          if (isGuest) parsed.guestGamesPlayed = (parsed.guestGamesPlayed || 0) + 1;
          localStorage.setItem('bhabhi_user_profile', JSON.stringify(parsed));
        } catch {}
      }

      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_GAME_STATS',
          userId: uId,
          isSafe,
          isBhabhi,
          isGuest,
        }),
      }).catch(() => {});
    }
  }, [gameState?.status, gameState?.roundNumber, gameState?.bhabhiPlayerId, gameState?.players, playerId]);

  // Turn Countdown Timer Effect
  useEffect(() => {
    if (
      gameState?.status !== 'in_progress' ||
      gameState?.trickResolving ||
      gameState?.isDealing
    ) {
      return;
    }

    setTurnCountdown(15);

    const interval = setInterval(() => {
      setTurnCountdown((prev) => {
        if (prev <= 1) {
          if (gameState?.currentTurnPlayerId === playerId) {
            const myCards = gameState.myCards || [];
            const playableCard = myCards.find((c) => {
              const hasSuitLed = Boolean(
                gameState.suitLed && myCards.some((sc) => sc.suit === gameState.suitLed)
              );
              const matchesSuit = gameState.suitLed ? c.suit === gameState.suitLed : true;
              const canFollow = hasSuitLed ? matchesSuit : true;
              const firstMoveValid =
                !gameState.isFirstTrickOfGame ||
                Boolean(gameState.suitLed) ||
                (c.suit === 'SPADES' && c.rank === 'A');
              return canFollow && firstMoveValid;
            });

            if (playableCard) {
              dispatchAction({ type: 'PLAY_CARD', cardId: playableCard.id });
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameState?.currentTurnPlayerId,
    gameState?.status,
    gameState?.trickResolving,
    gameState?.isDealing,
    playerId,
  ]);

  // Play audio sound using Web Audio API synthesis
  const playSound = useCallback(
    (type: 'card' | 'thola' | 'win') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        if (type === 'card') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'thola') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } else if (type === 'win') {
          [440, 554, 659].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
          });
        }
      } catch {
        // audio context blocked
      }
    },
    [soundEnabled]
  );

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [gameState?.chatMessages]);

  // Initial State Loader
  const loadInitialState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/rooms?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(
          playerId
        )}&playerName=${encodeURIComponent(playerName)}`
      );
      const data = await res.json();
      if (data.state) {
        setGameState(data.state);
        setWsConnected(true);
      }
    } catch (err) {
      console.warn('Initial state fetch error:', err);
    }
  }, [roomId, playerId, playerName]);

  // Handle incoming server message
  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      if (msg.type === 'STATE_UPDATE' && msg.state) {
        setGameState(msg.state);

        if (msg.tholaInfo) {
          playSound('thola');
          setTholaNotification({
            name: msg.tholaInfo.penalizedPlayerName,
            count: msg.tholaInfo.cardsCount,
          });
          setTimeout(() => setTholaNotification(null), 4000);
        }
      } else if (msg.type === 'ERROR' && msg.message) {
        setErrorMsg(msg.message);
        setTimeout(() => setErrorMsg(null), 3500);
      }
    },
    [playSound]
  );

  // Real-Time Transport (WebSocket + SSE/HTTP Fallback)
  useEffect(() => {
    loadInitialState();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws?roomId=${encodeURIComponent(
      roomId
    )}&playerId=${encodeURIComponent(playerId)}&playerName=${encodeURIComponent(playerName)}`;

    let usingSse = false;

    const startSse = () => {
      if (usingSse || sseRef.current) return;
      usingSse = true;

      const sse = new EventSource(
        `/api/rooms/stream?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(
          playerId
        )}`
      );
      sseRef.current = sse;

      sse.onopen = () => {
        setWsConnected(true);
      };

      sse.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch {
          // heartbeat
        }
      };
    };

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setErrorMsg(null);
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onerror = () => {
        startSse();
      };

      ws.onclose = () => {
        startSse();
      };
    } catch {
      startSse();
    }

    const pollInterval = setInterval(() => {
      fetch(
        `/api/rooms?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.state) {
            setGameState(data.state);
            setWsConnected(true);
          }
        })
        .catch(() => {});
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [roomId, playerId, playerName, loadInitialState, handleServerMessage]);

  const dispatchAction = async (action: {
    type:
      | 'START_GAME'
      | 'PLAY_CARD'
      | 'RESET_GAME'
      | 'ADD_BOT'
      | 'SEND_CHAT'
      | 'SET_DECK_TYPE'
      | 'SET_MAX_PLAYERS'
      | 'UPDATE_PROFILE'
      | 'START_NEXT_ROUND';
    cardId?: string;
    chatText?: string;
    isReaction?: boolean;
    deckType?: DeckType;
    maxPlayers?: number;
    playerName?: string;
    playerAvatar?: string;
  }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          ...action,
          roomId,
          playerId,
        })
      );
      return;
    }

    try {
      const res = await fetch('/api/rooms/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId,
          type: action.type,
          cardId: action.cardId,
          chatText: action.chatText,
          isReaction: action.isReaction,
          deckType: action.deckType,
          maxPlayers: action.maxPlayers,
          playerName: action.playerName,
          playerAvatar: action.playerAvatar,
        }),
      });
      const data = await res.json();
      if (data.state) {
        setGameState(data.state);
      }
      if (data.error) {
        setErrorMsg(data.error);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg('Action failed: ' + err.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleStartGame = () => {
    playSound('card');
    dispatchAction({ type: 'START_GAME' });
  };

  const handlePlaySelectedCard = () => {
    if (gameState?.trickResolving) {
      setErrorMsg('Trick is currently resolving, please wait...');
      setTimeout(() => setErrorMsg(null), 2000);
      return;
    }
    if (!selectedCardId) {
      setErrorMsg('Please select a card from your hand first');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }
    playSound('card');
    dispatchAction({ type: 'PLAY_CARD', cardId: selectedCardId });
    setSelectedCardId(null);
  };

  const handleCardClick = (card: Card, isPlayable: boolean) => {
    if (gameState?.trickResolving) return;

    // 1. If this card is ALREADY SELECTED: clicking it again TOGGLES IT OFF (puts it back down in the hand)
    if (selectedCardId === card.id) {
      playSound('card');
      setSelectedCardId(null);
      return;
    }

    // 2. If the clicked card is not legally playable
    if (!isPlayable) {
      // Put any previously raised card back down so user can reconsider freely
      if (selectedCardId) {
        setSelectedCardId(null);
      }
      playSound('card');

      if (gameState?.isFirstTrickOfGame && !gameState?.suitLed) {
        setErrorMsg('First turn must lead with the Ace of Spades (A♠)!');
      } else if (gameState?.suitLed) {
        setErrorMsg(`You must follow suit with ${SUIT_SYMBOLS[gameState.suitLed]} ${gameState.suitLed}!`);
      } else if (!isMyTurn) {
        setErrorMsg('Please wait for your turn to play.');
      } else {
        setErrorMsg('This card cannot be played right now.');
      }
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    // 3. Card is playable: select it (switches smoothly from any previously selected card)
    playSound('card');
    setSelectedCardId(card.id);
  };

  const handleCardTouchStart = (card: Card, e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        cardId: card.id,
        y: e.touches[0].clientY,
        x: e.touches[0].clientX,
        time: Date.now(),
      };
    }
  };

  const handleCardTouchEnd = (card: Card, isPlayable: boolean, e: React.TouchEvent) => {
    if (!touchStartRef.current || touchStartRef.current.cardId !== card.id) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (e.changedTouches.length === 0) return;
    const deltaY = e.changedTouches[0].clientY - start.y;
    const deltaX = e.changedTouches[0].clientX - start.x;

    touchedRecentlyRef.current = true;
    setTimeout(() => {
      touchedRecentlyRef.current = false;
    }, 350);

    // SWIPE DOWN (deltaY > 20px): Pull raised card back down into the hand / deselect
    if (deltaY > 20 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (selectedCardId === card.id) {
        playSound('card');
        setSelectedCardId(null);
      }
      return;
    }

    // SWIPE UP (deltaY < -30px): Swipe card towards table to play it directly
    if (deltaY < -30 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (isPlayable && isMyTurn && !gameState?.trickResolving) {
        playSound('card');
        dispatchAction({ type: 'PLAY_CARD', cardId: card.id });
        setSelectedCardId(null);
      } else {
        handleCardClick(card, isPlayable);
      }
      return;
    }

    // Normal TAP: toggle selection or switch card
    if (Math.abs(deltaY) < 15 && Math.abs(deltaX) < 15) {
      handleCardClick(card, isPlayable);
    }
  };

  const handleToggleSort = () => {
    setSortMode((prev) => (prev === 'suit' ? 'rank' : 'suit'));
    playSound('card');
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    dispatchAction({ type: 'SEND_CHAT', chatText: chatInput.trim() });
    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    dispatchAction({ type: 'SEND_CHAT', chatText: emoji, isReaction: true });
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSortedCards = (cards: Card[] = []) => {
    if (sortMode === 'rank') {
      return [...cards].sort((a, b) => b.value - a.value);
    }
    const suitOrder = { SPADES: 1, HEARTS: 2, CLUBS: 3, DIAMONDS: 4 };
    return [...cards].sort((a, b) => {
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return b.value - a.value;
    });
  };

  const isMyTurn = gameState?.currentTurnPlayerId === playerId;
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const isHost = myPlayer?.isHost || gameState?.players[0]?.id === playerId;

  const sortedHand = getSortedCards(gameState?.myCards || []);
  const cardCount = sortedHand.length;
  const selectedCard = sortedHand.find((c) => c.id === selectedCardId);

  // Calculate dynamic negative margin (cards come closer together as count increases)
  // If 5 cards: -16px; if 13 cards: -36px; if 20 cards: -48px
  const dynamicOverlapMargin =
    cardCount <= 1
      ? 0
      : Math.min(-14, Math.max(-50, Math.floor(-14 - (cardCount - 3) * 2.8)));

  return (
    <div className={`h-screen max-h-screen overflow-hidden bg-gradient-to-b ${theme.bgGradient} text-slate-100 flex flex-col justify-between select-none relative font-sans transition-colors duration-500`}>
      {/* Live Event Announcement Broadcast Banner */}
      {activeEvent && activeEvent.isActive && (
        <div className="z-20 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-b border-amber-400/40 px-3 py-1 flex items-center justify-center gap-2 text-[11px] text-amber-200 backdrop-blur-md animate-fadeIn">
          <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
            {activeEvent.tag || 'EVENT'}
          </span>
          <span className="font-semibold">{activeEvent.title}:</span>
          <span className="text-amber-100/80 hidden sm:inline">{activeEvent.description}</span>
        </div>
      )}

      {/* ===================== TOP HEADER ===================== */}
      <header className="h-13 flex-shrink-0 z-20 px-3 sm:px-6 py-2 flex justify-between items-center border-b border-casino-gold/25 bg-black/45 backdrop-blur-md">
        {/* Left: Royal Logo (Two Cards + Gold Serif Title) */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-5 h-7 rounded bg-white border border-slate-300 shadow -rotate-12 flex items-center justify-center text-[10px] text-slate-900 font-bold">
              ♠
            </div>
            <div className="absolute w-5 h-7 rounded bg-white border border-red-300 shadow rotate-12 flex items-center justify-center text-[10px] text-red-600 font-bold">
              ♥
            </div>
          </div>
          <div className="leading-tight">
            <span className="font-serif font-black tracking-wider text-base sm:text-lg text-gold-gradient drop-shadow">
              BHABHI
            </span>
            <span className="block font-serif font-black tracking-widest text-xs sm:text-sm text-gold-gradient -mt-1">
              THOLA
            </span>
          </div>
        </div>

        {/* Center: Room Code Pill & Round Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-black/50 border border-casino-gold/50 px-3 py-1 rounded-xl shadow-inner text-xs">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Room Code:</span>
            <span className="font-mono font-bold text-casino-gold tracking-widest text-xs sm:text-sm">
              {roomCode}
            </span>
            <button
              onClick={copyRoomLink}
              className="ml-1 text-slate-400 hover:text-casino-gold transition"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-black/50 border border-casino-gold/40 text-casino-goldLight font-medium text-xs shadow-inner">
            Round {gameState?.roundNumber || 1} / {gameState?.maxRounds || 5}
          </div>

          {/* Deck Configuration Pill (Clickable toggle for Host before round) */}
          <button
            onClick={() => {
              if (isHost && (gameState?.status === 'waiting' || gameState?.status === 'game_over')) {
                const nextDeck = gameState.deckType === 'double' ? 'single' : 'double';
                dispatchAction({ type: 'SET_DECK_TYPE', deckType: nextDeck });
              }
            }}
            disabled={!isHost || (gameState?.status !== 'waiting' && gameState?.status !== 'game_over')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition ${
              gameState?.deckType === 'double'
                ? 'bg-amber-950/80 border-amber-400/80 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'bg-black/50 border-casino-gold/40 text-casino-goldLight shadow-inner'
            } ${
              isHost && (gameState?.status === 'waiting' || gameState?.status === 'game_over')
                ? 'hover:brightness-125 cursor-pointer'
                : 'cursor-default'
            }`}
            title={
              isHost && (gameState?.status === 'waiting' || gameState?.status === 'game_over')
                ? 'Click to toggle Single / Double Deck'
                : 'Active Deck Configuration'
            }
          >
            <Layers className="w-3.5 h-3.5 text-casino-gold" />
            <span>{gameState?.deckType === 'double' ? 'Double Deck (104)' : 'Single Deck (52)'}</span>
            {isHost && (gameState?.status === 'waiting' || gameState?.status === 'game_over') && (
              <span className="text-[9px] bg-casino-gold/25 px-1 rounded text-casino-gold uppercase">
                Change
              </span>
            )}
          </button>
        </div>

        {/* Right: Profile, Audio Toggle, Settings, Leave Room Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Profile & Avatar Edit Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-casino-gold/50 bg-slate-900/80 hover:bg-slate-850 transition text-xs font-semibold shadow"
            title="Edit VIP Profile, Gender & Avatar"
          >
            <img
              src={myPlayer?.avatarUrl || playerAvatar || '/avatars/male_m1.jpg'}
              alt="Me"
              className="w-4 h-4 rounded-full object-cover ring-1 ring-casino-gold"
            />
            <span className="text-casino-goldLight max-w-[65px] truncate hidden sm:inline">
              {myPlayer?.name || playerName}
            </span>
          </button>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-casino-gold/10 hover:bg-casino-gold/20 border border-casino-gold/40 flex items-center justify-center text-casino-gold transition"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Quick Add Bot - ONLY HOST can add bots */}
          {isHost && (gameState?.players.length || 0) < (gameState?.maxPlayers || 4) && gameState?.status === 'waiting' && (
            <button
              onClick={() => dispatchAction({ type: 'ADD_BOT' })}
              className="hidden sm:flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-casino-gold/50 px-2.5 py-1 rounded-xl text-casino-goldLight text-xs transition"
              title="Add AI Player"
            >
              <Bot className="w-3.5 h-3.5 text-casino-gold" />
              <span>+ Bot ({gameState?.players.length || 0}/{gameState?.maxPlayers || 4})</span>
            </button>
          )}

          {isHost && gameState?.status === 'waiting' && (
            <button
              onClick={handleStartGame}
              disabled={(gameState?.players.length || 0) < 2}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-xl font-bold uppercase tracking-wider text-xs shadow-gold transition ${
                (gameState?.players.length || 0) >= 2
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{(gameState?.players.length || 0) >= 2 ? t.dealCards : `${gameState?.players.length || 1}/2+`}</span>
            </button>
          )}

          {/* Quick Language Selector Dropdown */}
          <div className="relative hidden md:block">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="appearance-none bg-slate-900/90 border border-slate-700 hover:border-casino-gold/60 text-slate-200 text-[11px] font-semibold rounded-full pl-2 pr-4 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-casino-gold transition shadow"
              title="Change Language"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, meta]) => (
                <option key={code} value={code} className="bg-slate-900 text-white">
                  {meta.flag} {meta.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Rules Modal Trigger */}
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 border border-casino-gold/50 px-2.5 py-1 rounded-xl text-casino-gold text-xs transition font-semibold"
            title="View Bhabhi Thola Rules"
          >
            <HelpCircle className="w-3.5 h-3.5 text-casino-gold" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 border border-red-400/50 text-white font-semibold px-3 py-1 rounded-xl text-xs shadow-md transition"
          >
            <span className="hidden sm:inline">{t.leaveRoom}</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Floating Error Toast */}
      {errorMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 border-2 border-red-500 text-red-100 px-5 py-2 rounded-2xl text-xs shadow-2xl backdrop-blur animate-bounce font-medium">
          {errorMsg}
        </div>
      )}

      {/* Thola Notification Banner */}
      {tholaNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-900 via-red-800 to-amber-900 border-2 border-amber-300 text-white font-serif px-6 py-2.5 rounded-2xl shadow-gold-lg flex items-center gap-3 animate-pulse">
          <Flame className="w-7 h-7 text-amber-300 fill-amber-300" />
          <div>
            <div className="text-base sm:text-lg font-bold uppercase tracking-widest text-amber-200">
              THOLA HIT!
            </div>
            <div className="text-xs font-sans text-white">
              <strong>{tholaNotification.name}</strong> took {tholaNotification.count} cards penalty!
            </div>
          </div>
        </div>
      )}

      {/* ===================== MAIN 3-COLUMN VIEWPORT ===================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3 relative">
        {/* ----------------- LEFT PANEL: MATCH STATUS ----------------- */}
        <aside
          className={`
            fixed lg:static top-16 left-2 z-40 lg:z-10
            w-48 xl:w-54 flex-shrink-0 bg-slate-950/90 backdrop-blur-md
            border border-slate-800 rounded-2xl p-3
            flex flex-col justify-between shadow-2xl
            transition-transform duration-300
            ${showMatchStatusMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xs font-bold text-gold-gradient uppercase tracking-wider">
                Match Status
              </h3>
              <button
                onClick={() => setShowMatchStatusMobile(false)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-3 bg-black/40 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-[11px] font-semibold text-emerald-300 truncate">
                {gameState?.status === 'in_progress'
                  ? 'Playing...'
                  : gameState?.status === 'game_over'
                  ? 'Round Ended'
                  : 'Waiting...'}
              </span>
            </div>

            {/* Turn Order List */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Turn Order:
              </div>

              {gameState?.players.map((p) => {
                const isCurrentTurn = gameState.currentTurnPlayerId === p.id;
                const isSelf = p.id === playerId;
                const isSafe = Boolean(
                  gameState?.status !== 'waiting' &&
                  (p.isSafe || (gameState?.status === 'in_progress' && (p.cardCount ?? 0) === 0 && !gameState?.isDealing))
                );

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${
                      isSafe
                        ? 'opacity-35 grayscale bg-black/20 border border-dashed border-slate-800'
                        : isCurrentTurn
                        ? 'bg-amber-500/20 border border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                        : isSelf
                        ? 'bg-amber-500/10 border border-amber-400/40 text-amber-200'
                        : 'bg-black/30 border border-slate-800/60'
                    }`}
                  >
                    {isCurrentTurn && !isSafe ? (
                      <span className="text-amber-400 font-bold text-[11px] animate-pulse">▶</span>
                    ) : (
                      <span className="w-2" />
                    )}

                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-6 h-6 rounded-full object-cover border border-casino-gold/60 shadow flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-white truncate flex items-center justify-between">
                        <span className="truncate">{p.name} {isSelf && '(You)'}</span>
                        {isSafe && (
                          <span className="text-[8px] text-emerald-400 font-bold bg-emerald-950 px-1 py-0.2 rounded ml-1 flex-shrink-0">
                            🛡️ SAFE
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {gameState?.status === 'waiting'
                          ? 'Ready'
                          : isSafe
                          ? 'Out of match'
                          : `🂠 ${p.cardCount} cards`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[9px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>Room: {roomCode}</span>
            <span className="text-emerald-400 font-mono">Live</span>
          </div>
        </aside>

        {/* ----------------- CENTER: CASINO POKER TABLE & HAND ----------------- */}
        <main
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-card-item]') && !target.closest('[data-action-btn]')) {
              if (selectedCardId) {
                playSound('card');
                setSelectedCardId(null);
              }
            }
          }}
          className="flex-1 min-h-0 flex flex-col justify-between items-center relative overflow-visible px-2 sm:px-4 pt-7 sm:pt-9 pb-1"
        >
          {/* THE LUXURY OVAL TABLE WITH SAFE SIDEBAR CLEARANCE */}
          <div className="relative w-full max-w-[540px] md:max-w-[620px] lg:max-w-[680px] xl:max-w-[740px] h-[37vh] sm:h-[41vh] my-auto flex items-center justify-center">
            {/* Outer Wood Rail */}
            <div
              className="w-full h-full rounded-[140px] sm:rounded-[180px] p-2 sm:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.85)] border-2 relative flex items-center justify-center transition-all duration-500"
              style={{
                background: theme.railStyle,
                borderColor: theme.railBorder,
                boxShadow: animationSettings.ambientGlow === 'cinematic' ? theme.glowShadow : '0 12px 40px rgba(0,0,0,0.85)',
              }}
            >
              {/* Inner Gold / Accent Rim */}
              <div
                className="w-full h-full rounded-[130px] sm:rounded-[170px] p-1.5 sm:p-2 shadow-inner flex items-center justify-center transition-all duration-500"
                style={{
                  background: theme.goldTrim,
                }}
              >
                {/* Casino Felt */}
                <div
                  className="w-full h-full rounded-[122px] sm:rounded-[162px] relative flex items-center justify-center overflow-hidden border border-black/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.7)] transition-all duration-500"
                  style={{
                    background: theme.feltStyle,
                  }}
                >
                  {/* Subtle Diamond Suit Watermark */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(#d4af37 1px, transparent 1px)`,
                      backgroundSize: '16px 16px',
                    }}
                  />
                  <div
                    className="absolute inset-3 sm:inset-5 rounded-[105px] sm:rounded-[145px] border pointer-events-none transition-colors duration-500"
                    style={{ borderColor: `${theme.accentColor}40` }}
                  />

                  {/* AUTOMATED CARD SHUFFLER & DEALER MACHINE ANIMATION */}
                  <DealerMachine
                    isDealing={Boolean(gameState?.isDealing)}
                    deckType={gameState?.deckType || 'single'}
                    soundEnabled={soundEnabled}
                  />

                  {/* CENTER TRICK PILE & POT/DISCARD COUNTER */}
                  <div className="relative flex flex-col items-center justify-center z-10">
                    <div className="min-h-[85px] sm:min-h-[110px] flex items-center justify-center -space-x-3 sm:-space-x-4 mb-1.5">
                      {gameState?.currentTrick && gameState.currentTrick.length > 0 ? (
                        gameState.currentTrick.map((played, idx) => {
                          const isHighlighted =
                            played.card.id === gameState?.trickResultBanner?.winningCardId;

                          return (
                            <div
                              key={played.card.id || idx}
                              className="flex flex-col items-center group transition-all duration-300"
                              style={{
                                transform: `rotate(${(idx - (gameState.currentTrick.length - 1) / 2) * 6}deg)`,
                                zIndex: isHighlighted ? 25 : idx + 1,
                              }}
                            >
                              <div
                                className={`transition-all duration-300 ${
                                  isHighlighted
                                    ? '-translate-y-2 scale-105'
                                    : 'group-hover:-translate-y-1'
                                }`}
                              >
                                <CardView
                                  card={played.card}
                                  size="sm"
                                  className={`sm:w-16 sm:h-24 shadow-2xl transition-all ${
                                    isHighlighted
                                      ? 'ring-[3px] ring-amber-400 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.95)]'
                                      : ''
                                  }`}
                                />
                              </div>
                              <span className="mt-1 px-1.5 py-0.5 rounded-full bg-black/75 border border-casino-gold/40 text-[9px] font-semibold text-amber-200 truncate max-w-[62px] text-center shadow pointer-events-none">
                                {played.playerName}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors"
                          style={{
                            borderColor: `${theme.accentColor}55`,
                            color: `${theme.accentColor}80`,
                          }}
                        >
                          <span className="text-xl sm:text-2xl">♠</span>
                          <span className="text-[9px] uppercase tracking-wider mt-1">Empty</span>
                        </div>
                      )}
                    </div>

                    {/* Glowing Golden Round Badge with Counter (Image 5 center "18" badge!) */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#8a6813] via-[#f5d77f] to-[#aa8620] p-0.5 shadow-[0_0_15px_rgba(245,215,127,0.7)] flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-casino-gold font-bold font-serif text-xs sm:text-sm">
                        {gameState?.discardPileCount || gameState?.currentTrick.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------- DYNAMIC 2 TO 8 PLAYER SEATING ----------------- */}
              {Array.from({ length: gameState?.maxPlayers || 4 }).map((_, seatIdx) => {
                const maxSeats = gameState?.maxPlayers || 4;
                const mySeat = myPlayer?.seat ?? 0;
                const offset = (seatIdx - mySeat + maxSeats) % maxSeats;
                const coords = getSeatCoordinates(maxSeats, offset);
                const seatedPlayer = gameState?.players.find((p) => p.seat === seatIdx);

                return (
                  <div
                    key={seatIdx}
                    className="absolute z-20 pointer-events-auto"
                    style={{
                      left: coords.left,
                      right: coords.right,
                      top: coords.top,
                      bottom: coords.bottom,
                      transform: coords.transform,
                    }}
                  >
                    {seatedPlayer ? (
                      <PlayerSeatBadge
                        player={seatedPlayer}
                        isTurn={gameState?.currentTurnPlayerId === seatedPlayer.id}
                        isSelf={seatedPlayer.id === playerId}
                        isBhabhi={Boolean(
                          gameState?.status === 'game_over' &&
                            (seatedPlayer.isBhabhi || seatedPlayer.id === gameState?.bhabhiPlayerId)
                        )}
                        turnSeconds={turnCountdown}
                        gameStatus={gameState?.status}
                      />
                    ) : gameState?.status === 'waiting' ? (
                      isHost ? (
                        <EmptySeatPlaceholder onAddBot={() => dispatchAction({ type: 'ADD_BOT' })} />
                      ) : (
                        <EmptySeatWaiting />
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===================== CURVED CARD FAN (Matching Image 3) ===================== */}
          <div className="w-full max-w-4xl flex-shrink-0 flex flex-col items-center z-20 pb-2">
            {/* Interactive Turn Prompt Banner with Live Countdown Timer */}
            {gameState?.status === 'in_progress' && (
              <div className="flex items-center justify-center -mb-2 z-30 pointer-events-none">
                {gameState?.trickResolving ? (
                  <div className={`px-4 sm:px-6 py-1.5 rounded-full border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xl animate-bounce backdrop-blur-md ${
                    gameState?.trickResultBanner?.type === 'thola'
                      ? 'bg-red-950/95 border-red-500 text-amber-200 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                      : 'bg-emerald-950/95 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.7)]'
                  }`}>
                    <span>{gameState?.trickResultBanner?.text || 'Resolving complete turn...'}</span>
                  </div>
                ) : isMyTurn ? (
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 border border-amber-400/80 text-amber-200 text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-bounce-subtle">
                    <span>⭐</span>
                    {gameState?.isFirstTrickOfGame && !gameState?.suitLed ? (
                      <span>You hold the Ace of Spades (A♠)! Play it to lead!</span>
                    ) : (
                      <span>It's YOUR turn! Select a card to play</span>
                    )}
                    <span className="font-mono font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 text-[10px]">
                      ⏱️ {turnCountdown}s
                    </span>
                  </div>
                ) : (
                  <div className="px-3.5 py-0.5 rounded-full bg-black/60 border border-slate-800 text-slate-300 text-[11px] flex items-center gap-2 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      Waiting for{' '}
                      <strong className="text-casino-gold">
                        {gameState?.players.find((p) => p.id === gameState.currentTurnPlayerId)?.name || 'Next Player'}
                      </strong>
                      's move...
                    </span>
                    <span className="font-mono font-bold text-slate-400 text-[10px]">
                      ⏱️ {turnCountdown}s
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Natural Curved Fan Container: NO SLIDER, DYNAMIC PROXIMITY, CURVED ROTATION */}
            <div className="w-full flex items-end justify-center overflow-visible pt-8 pb-3 min-h-[120px] sm:min-h-[140px]">
              {sortedHand.length > 0 ? (
                sortedHand.map((card, idx) => {
                  const isSelected = selectedCardId === card.id;

                  // Move validation
                  const hasSuitLed = Boolean(
                    gameState?.suitLed &&
                      gameState?.myCards?.some((c) => c.suit === gameState.suitLed)
                  );
                  const matchesSuit = gameState?.suitLed ? card.suit === gameState.suitLed : true;
                  const canFollow = hasSuitLed ? matchesSuit : true;
                  const firstMoveValid =
                    !gameState?.isFirstTrickOfGame ||
                    Boolean(gameState?.suitLed) ||
                    (card.suit === 'SPADES' && card.rank === 'A');

                  const isPlayable = Boolean(
                    isMyTurn &&
                      gameState?.status === 'in_progress' &&
                      canFollow &&
                      firstMoveValid
                  );

                  // Curve calculation (Image 3: natural convex arc)
                  const centerIdx = (cardCount - 1) / 2;
                  const offset = idx - centerIdx;
                  // Max fan angle: up to 16 deg on extreme ends
                  const angle = cardCount > 1 ? (offset / Math.max(1, centerIdx)) * 8.5 : 0;
                  // Parabolic vertical drop: middle is highest, outer edges dip down
                  const yDrop = cardCount > 1 ? Math.pow(offset / Math.max(1, centerIdx), 2) * 12 : 0;

                  return (
                    <div
                      key={card.id}
                      data-card-item="true"
                      onTouchStart={(e) => handleCardTouchStart(card, e)}
                      onTouchEnd={(e) => handleCardTouchEnd(card, isPlayable, e)}
                      style={{
                        marginLeft: idx === 0 ? 0 : `${dynamicOverlapMargin}px`,
                        transform: isSelected
                          ? `translate3d(0, -32px, 0) scale(1.05) rotate(0deg)`
                          : `translate3d(0, ${yDrop}px, 0) rotate(${angle}deg)`,
                        transformOrigin: 'bottom center',
                        zIndex: isSelected ? 40 : idx + 1,
                      }}
                      className="transition-all duration-200 hover:-translate-y-4 hover:z-30 cursor-pointer flex-shrink-0"
                    >
                      <CardView
                        card={card}
                        isPlayable={isPlayable}
                        isSelected={isSelected}
                        size="md"
                        onClick={() => {
                          if (!touchedRecentlyRef.current) {
                            handleCardClick(card, isPlayable);
                          }
                        }}
                        className={
                          isSelected
                            ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.95)]'
                            : ''
                        }
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-3 font-medium">
                  {gameState?.status === 'waiting'
                    ? 'Cards will be dealt when match starts.'
                    : myPlayer?.isSafe
                    ? '🎉 You have discarded all cards and are SAFE!'
                    : 'No cards in hand.'}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS ROW - Responsive on 375px Mobile */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-3 mt-1 flex-wrap sm:flex-nowrap" data-action-btn="true">
              <button
                onClick={handlePlaySelectedCard}
                disabled={!isMyTurn || gameState?.status !== 'in_progress' || Boolean(gameState?.trickResolving)}
                className={`
                  flex items-center gap-1.5 px-4 sm:px-8 py-1.5 sm:py-2 rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm shadow-gold transition-all duration-200
                  ${
                    isMyTurn && gameState?.status === 'in_progress' && !gameState?.trickResolving
                      ? selectedCardId
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-95 animate-pulse-subtle'
                        : 'bg-amber-500/25 text-amber-200 border border-amber-400/50 hover:bg-amber-500/35'
                      : 'bg-amber-600/30 text-amber-200/50 cursor-not-allowed border border-amber-500/20'
                  }
                `}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {gameState?.trickResolving
                    ? t.resolvingTrick
                    : selectedCard
                    ? `Play ${selectedCard.rank}${SUIT_SYMBOLS[selectedCard.suit]}`
                    : t.playCard}
                </span>
              </button>

              {/* Quick Deselect Button (Visible when a card is selected) */}
              {selectedCardId && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('card');
                    setSelectedCardId(null);
                  }}
                  className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-semibold text-[11px] sm:text-xs shadow transition animate-fadeIn"
                  title="Put card back down (or click the card again / swipe down / press Esc)"
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                  <span>Deselect</span>
                </button>
              )}

              <button
                onClick={handleToggleSort}
                className="flex items-center gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-casino-gold/60 text-casino-gold font-semibold text-[11px] sm:text-xs shadow transition whitespace-nowrap"
              >
                <ArrowLeftRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t.sortHand}</span>
              </button>

              <button
                onClick={() => setShowChatMobile((prev) => !prev)}
                className="flex items-center gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-casino-gold/60 text-casino-gold font-semibold text-[11px] sm:text-xs shadow transition whitespace-nowrap"
              >
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t.chat}</span>
              </button>

              {/* Status Toggle on Mobile (< 1024px) */}
              <button
                onClick={() => setShowMatchStatusMobile((prev) => !prev)}
                className="lg:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px] shadow transition whitespace-nowrap"
              >
                <Users className="w-3 h-3" />
                <span>Status</span>
              </button>
            </div>
          </div>
        </main>

        {/* ----------------- RIGHT PANEL: CHAT ----------------- */}
        <aside
          className={`
            fixed lg:static top-16 right-2 z-40 lg:z-10
            w-56 sm:w-64 xl:w-72 flex-shrink-0 bg-slate-950/90 backdrop-blur-md
            border border-slate-800 rounded-2xl p-3
            flex flex-col justify-between shadow-2xl h-[80vh] lg:h-auto
            transition-transform duration-300
            ${showChatMobile ? 'translate-x-0' : 'translate-x-[110%] lg:translate-x-0'}
          `}
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-casino-gold" />
              <h3 className="text-xs font-bold text-white">Chat</h3>
            </div>
            <button
              onClick={() => setShowChatMobile(false)}
              className="text-slate-400 hover:text-white"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 min-h-0 space-y-2.5 overflow-y-auto py-2.5 pr-1 text-xs scrollbar-thin"
          >
            {gameState?.chatMessages?.map((msg) => {
              const isSelf = msg.playerId === playerId;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={msg.playerAvatar}
                    alt={msg.playerName}
                    className="w-6 h-6 rounded-full object-cover border border-casino-gold/50 flex-shrink-0"
                  />
                  <div
                    className={`max-w-[78%] rounded-xl p-2 ${
                      isSelf
                        ? 'bg-amber-500/20 border border-amber-400/50 text-amber-100 rounded-tr-none'
                        : 'bg-black/50 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-[9px] text-casino-gold truncate">
                        {msg.playerName}
                      </span>
                      <span className="text-[8px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className="text-[11px] leading-tight">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Emoji Reactions Row */}
          <div className="pt-2 border-t border-slate-800 flex-shrink-0">
            <div className="flex justify-between items-center px-1 mb-2">
              {['👍', '❤️', '🔥', '😂', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-casino-gold/20 flex items-center justify-center text-xs transition transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={80}
                className="flex-1 bg-black/60 border border-slate-700 focus:border-casino-gold rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-casino-gold/50"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center hover:brightness-110 active:scale-95 shadow transition flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 fill-current" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* GAME OVER & BHABHI DEFEAT SHOWCASE MODAL */}
      {gameState && (
        <GameOverModal
          isOpen={gameState.status === 'game_over'}
          gameState={gameState}
          playerId={playerId}
          isHost={Boolean(isHost)}
          onNextRound={() => dispatchAction({ type: 'START_NEXT_ROUND' })}
          onSetDeckType={(deckType) => dispatchAction({ type: 'SET_DECK_TYPE', deckType })}
          onLeave={onLeave}
          onOpenAuthModal={() => setShowProfileModal(true)}
        />
      )}

      {/* Profile & Avatar Selector Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={(profile) => {
          dispatchAction({
            type: 'UPDATE_PROFILE',
            playerName: profile.alias,
            playerAvatar: profile.avatarUrl,
          });
        }}
        currentProfile={{
          alias: myPlayer?.name || playerName,
          avatarUrl: myPlayer?.avatarUrl || playerAvatar,
        }}
      />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-casino-gold/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-casino-gold" />
                <h3 className="font-serif font-bold text-lg text-gold-gradient">
                  Official Bhabhi Thola Rules
                </h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-casino-gold mb-1">1. The Opening Move (Ace of Spades A♠)</p>
                <p>
                  The player holding the <strong>Ace of Spades (A♠)</strong> MUST start the game by leading it.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-blue-900/40">
                <p className="font-bold text-blue-400 mb-1">2. First Round Safety (Safe Opening)</p>
                <p>
                  In the very first trick (A♠ lead), if any player doesn&apos;t have a Spade, they can play any off-suit card safely. <strong>No Thola can happen in Trick 1!</strong> All played cards are sent to the discard pile, and the highest spade player leads Trick 2.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-casino-gold mb-1">3. Must Follow Suit</p>
                <p>
                  In subsequent tricks, players MUST follow the suit led if they have a card of that suit. If all players follow suit, the highest card of the suit led wins, cards are cleared, and the winner leads the next trick.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-red-900/40">
                <p className="font-bold text-red-400 mb-1">4. The &quot;Thola&quot; (Penalty Hit!)</p>
                <p>
                  When a player has <strong>NO cards of the suit led</strong>, they can throw <strong>ANY</strong> card from their hand. This is a <strong>THOLA</strong>. The trick ends immediately, and the player who played the <strong>highest card of the led suit</strong> must pick up the entire trick into their hand!
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-amber-900/40">
                <p className="font-bold text-amber-400 mb-1">5. Consecutive Thulla Relief (Taking Thullas Repeatedly)</p>
                <p>
                  To prevent an unfair endless loop when a player is repeatedly targeted with <strong>consecutive Tholas (2 in a row)</strong>:
                  <br />• <strong>Card Relief:</strong> The victim draws 1 card from the next active player to diversify their suits.
                  <br />• <strong>Lead Rotation:</strong> The lead passes to the player who gave the Thola (or next clockwise player) so the victim is not trapped leading again!
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-purple-900/40">
                <p className="font-bold text-purple-400 mb-1">6. The &quot;Power Card&quot; Rule (Winning on Last Card)</p>
                <p>
                  If you play your final card and that card happens to <strong>WIN the trick</strong> (highest card of suit led), you cannot escape yet! Because the winner holds the power and must lead the next trick, you must <strong>take 1 card from the next active player</strong> to your left (clockwise) and continue playing.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40">
                <p className="font-bold text-emerald-400 mb-1">7. Clearing Hand & Becoming SAFE</p>
                <p>
                  A player becomes <strong>SAFE</strong> (winner) when they run out of cards cleanly without winning the trick on their final card or taking a Thola.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/40">
                <p className="font-bold text-rose-400 mb-1">8. The &quot;Bhabhi&quot; (Loser)</p>
                <p>
                  Play continues until only <strong>ONE player</strong> remains holding cards. That last remaining player is the <strong>BHABHI</strong>!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full py-2.5 bg-casino-gold text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition shadow-gold"
            >
              Understood, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Seat badge matching the provided avatars & showing Bhabhi / Safe status & Live Turn Timer
const PlayerSeatBadge: React.FC<{
  player: PlayerPublic;
  isTurn: boolean;
  isSelf?: boolean;
  isBhabhi?: boolean;
  turnSeconds?: number;
  gameStatus?: string;
}> = ({ player, isTurn, isSelf = false, isBhabhi = false, turnSeconds = 15, gameStatus }) => {
  const isSafe = Boolean(
    gameStatus &&
      gameStatus !== 'waiting' &&
      (player.isSafe || (gameStatus === 'in_progress' && (player.cardCount ?? 0) === 0))
  );
  const strokeDashoffset = 175.93 * (1 - Math.max(0, turnSeconds) / 15);
  const timerStrokeColor =
    turnSeconds <= 4
      ? 'stroke-red-500'
      : turnSeconds <= 8
      ? 'stroke-amber-400'
      : 'stroke-emerald-400';
  const timerTextColor =
    turnSeconds <= 4
      ? 'text-red-400 border-red-500/70'
      : turnSeconds <= 8
      ? 'text-amber-300 border-amber-400/70'
      : 'text-emerald-300 border-emerald-400/70';

  return (
    <div
      className={`flex flex-col items-center relative transition-all duration-300 ${
        isSafe ? 'opacity-35 grayscale contrast-50' : ''
      }`}
    >
      {/* Floating Timer Pill on active turn (never shown if player is safe) */}
      {isTurn && !isBhabhi && !isSafe && (
        <div
          className={`absolute -top-4.5 px-2 py-0.5 rounded-full bg-black/95 border text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xl z-30 animate-pulse ${timerTextColor}`}
        >
          <span>⏱️</span>
          <span>{turnSeconds}s</span>
        </div>
      )}

      {/* Concentric Avatar Container with Perfectly Centered SVG Ring */}
      <div className="relative w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center">
        {/* Animated Circular Countdown SVG Ring - Concentric with 64x64 viewBox */}
        {isTurn && !isBhabhi && !isSafe && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10"
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2.5"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              className={`transition-all duration-1000 ease-linear ${timerStrokeColor}`}
              strokeWidth="3.5"
              strokeDasharray={175.93}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}
            />
          </svg>
        )}

        <div
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full p-0.5 shadow-xl transition-all ${
            isBhabhi
              ? 'bg-gradient-to-tr from-red-600 via-amber-500 to-red-600 ring-4 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.95)] animate-pulse'
              : isSafe
              ? 'bg-slate-700 border border-slate-600'
              : isTurn
              ? 'bg-gradient-to-tr from-[#aa8620] via-[#f5d77f] to-[#aa8620] shadow-[0_0_15px_rgba(245,215,127,0.7)]'
              : 'bg-gradient-to-tr from-[#aa8620] via-[#f5d77f] to-[#aa8620]'
          }`}
        >
          <img
            src={player.avatarUrl}
            alt={player.name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {player.isHost && (
          <span className="absolute -top-1 -right-1 bg-casino-gold text-slate-950 rounded-full p-0.5 text-[7px] font-bold shadow z-20">
            ★
          </span>
        )}

        {isBhabhi && (
          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full px-1 py-0.2 text-[8px] font-black shadow border border-amber-300 z-20">
            💀
          </span>
        )}

        {isSafe && (
          <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full px-1 py-0.2 text-[8px] font-bold shadow border border-emerald-400 z-20">
            🛡️
          </span>
        )}
      </div>

      <div
        className={`mt-0.5 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-colors z-20 ${
          isBhabhi
            ? 'bg-red-950/90 border border-red-500 text-red-200'
            : isSafe
            ? 'bg-slate-900/90 border border-slate-700 text-slate-400'
            : 'bg-black/80 border border-casino-gold/50 text-white'
        }`}
      >
        <span className="text-[10px] font-bold max-w-[55px] truncate">
          {player.name} {isSelf && '(You)'}
        </span>
        {isBhabhi ? (
          <span className="text-[8px] font-black text-red-300 uppercase tracking-tight bg-red-900/60 px-1 rounded">
            BHABHI ({player.cardCount})
          </span>
        ) : isSafe ? (
          <span className="text-[8px] font-bold text-emerald-400">
            SAFE
          </span>
        ) : gameStatus === 'waiting' ? (
          <span className="text-[8px] text-emerald-400 font-medium">
            Ready
          </span>
        ) : (
          <span className="text-[9px] text-slate-300 font-mono">
            🂠 {player.cardCount}
          </span>
        )}
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            player.isConnected ? (isSafe ? 'bg-slate-500' : 'bg-emerald-400') : 'bg-slate-500'
          }`}
        />
      </div>
    </div>
  );
};

// Host only: Clickable button to add bot
const EmptySeatPlaceholder: React.FC<{ onAddBot: () => void }> = ({ onAddBot }) => {
  return (
    <button
      onClick={onAddBot}
      className="flex flex-col items-center group opacity-85 hover:opacity-100 transition cursor-pointer"
      title="Host: Add Bot to Seat"
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-amber-400/60 bg-black/60 flex items-center justify-center text-amber-300 group-hover:scale-105 transition shadow-lg">
        <Bot className="w-4 h-4 text-casino-gold" />
      </div>
      <div className="mt-0.5 bg-black/80 border border-amber-400/40 px-1.5 py-0.2 rounded-full text-[8px] text-amber-300 font-semibold shadow">
        + Add Bot
      </div>
    </button>
  );
};

// Non-host (Guest) players: Display open seat with NO bot buttons or options
const EmptySeatWaiting: React.FC = () => {
  return (
    <div className="flex flex-col items-center opacity-50 pointer-events-none select-none">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-dashed border-slate-700 bg-black/40 flex items-center justify-center text-slate-500 shadow-inner">
        <span className="text-xs">♠</span>
      </div>
      <div className="mt-0.5 bg-black/60 border border-slate-800 px-1.5 py-0.2 rounded-full text-[8px] text-slate-500 font-mono">
        Open Seat
      </div>
    </div>
  );
};
