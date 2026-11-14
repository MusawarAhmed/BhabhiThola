'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Sparkles,
  Users,
  HelpCircle,
  ArrowRight,
  Spade,
  Layers,
  User,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { DeckType } from '@/lib/types/game';
import { ProfileModal, UserProfile } from './ProfileModal';

interface LobbyProps {
  playerId: string;
  onJoinRoom: (roomId: string, playerName: string, roomCode: string, avatarUrl?: string) => void;
}

interface RoomCodeDetectionResult {
  checked: boolean;
  exists: boolean;
  status?: string;
  playerCount?: number;
  maxPlayers?: number;
  roundNumber?: number;
}

export const Lobby: React.FC<LobbyProps> = ({ playerId, onJoinRoom }) => {
  const [playerName, setPlayerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/avatars/male_m1.jpg');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [joinCode, setJoinCode] = useState('');
  const [deckType, setDeckType] = useState<DeckType>('single');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [showRules, setShowRules] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authProvider, setAuthProvider] = useState<'guest' | 'google' | 'phone' | 'email'>('guest');
  const [guestGamesPlayed, setGuestGamesPlayed] = useState<number>(0);
  const [forceAuthModal, setForceAuthModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Live Room Code Detection State
  const [detectionResult, setDetectionResult] = useState<RoomCodeDetectionResult | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved profile on mount or create unique Guest-675577
  useEffect(() => {
    const stored = localStorage.getItem('bhabhi_user_profile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed.alias) setPlayerName(parsed.alias);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.authProvider) setAuthProvider(parsed.authProvider);
        if (parsed.guestGamesPlayed !== undefined) setGuestGamesPlayed(parsed.guestGamesPlayed);

        if (parsed.id) {
          fetch(`/api/auth?userId=${encodeURIComponent(parsed.id)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.user) {
                setPlayerName(d.user.alias || parsed.alias);
                setAvatarUrl(d.user.avatarUrl || parsed.avatarUrl);
                setAuthProvider(d.user.authProvider || parsed.authProvider);
                setGuestGamesPlayed(d.user.guestGamesPlayed || 0);
              }
            })
            .catch(() => {});
        }
      } catch {}
    } else {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const guestAlias = `Guest-${randomNum}`;
      const randGender = Math.random() > 0.5 ? 'male' : 'female';
      const randAvatar = `/avatars/${randGender}_${randGender === 'male' ? 'm' : 'f'}${Math.floor(Math.random() * 8) + 1}.jpg`;
      const initialProfile: UserProfile = {
        id: playerId || 'guest_' + Math.random().toString(36).substring(2, 9),
        alias: guestAlias,
        avatarUrl: randAvatar,
        gender: randGender,
        authProvider: 'guest',
        guestGamesPlayed: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        bhabhiCount: 0,
      };
      localStorage.setItem('bhabhi_user_profile', JSON.stringify(initialProfile));
      setPlayerName(guestAlias);
      setAvatarUrl(randAvatar);
      setGender(randGender);
      setAuthProvider('guest');
      setGuestGamesPlayed(0);

      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GUEST_LOGIN',
          userId: initialProfile.id,
          alias: guestAlias,
          avatarUrl: randAvatar,
          gender: randGender,
        }),
      }).catch(() => {});
    }
  }, [playerId]);

  // Debounced Room Code Detection
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setDetectionResult(null);
      setIsCheckingCode(false);
      return;
    }

    setIsCheckingCode(true);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/rooms?checkCode=${encodeURIComponent(cleanCode)}`);
        const data = await res.json();
        if (data.success && data.exists) {
          setDetectionResult({
            checked: true,
            exists: true,
            status: data.status,
            playerCount: data.playerCount,
            maxPlayers: data.maxPlayers,
            roundNumber: data.roundNumber,
          });
        } else {
          setDetectionResult({
            checked: true,
            exists: false,
          });
        }
      } catch {
        setDetectionResult(null);
      } finally {
        setIsCheckingCode(false);
      }
    }, 350);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [joinCode]);

  const handleProfileUpdated = (profile: UserProfile) => {
    setPlayerName(profile.alias);
    setAvatarUrl(profile.avatarUrl);
    setGender(profile.gender);
    setAuthProvider(profile.authProvider);
    if (profile.guestGamesPlayed !== undefined) {
      setGuestGamesPlayed(profile.guestGamesPlayed);
    }
  };

  const handleCreateRoom = async (overrideCode?: string) => {
    if (authProvider === 'guest' && guestGamesPlayed >= 2) {
      setError('Guest trial limit of 2 games reached! Please sign in with Google or Phone to continue.');
      setForceAuthModal(true);
      setShowProfileModal(true);
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your player alias');
      return;
    }
    setError('');
    setIsCreating(true);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: overrideCode || undefined,
          playerId,
          playerName: playerName.trim(),
          avatarUrl,
          deckType,
          maxPlayers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onJoinRoom(data.roomId, playerName.trim(), data.roomCode, avatarUrl);
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (err: any) {
      setError('Connection failed: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authProvider === 'guest' && guestGamesPlayed >= 2) {
      setError('Guest trial limit of 2 games reached! Please sign in with Google or Phone to continue.');
      setForceAuthModal(true);
      setShowProfileModal(true);
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your player alias');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError('');
    const code = joinCode.trim().toUpperCase();
    const roomId = 'room_' + code.toLowerCase();

    // If detection revealed this code does NOT exist yet, create room with this exact code!
    if (detectionResult && !detectionResult.exists) {
      await handleCreateRoom(code);
      return;
    }

    try {
      // Pre-register player via HTTP with custom avatar
      await fetch(
        `/api/rooms?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(
          playerId
        )}&playerName=${encodeURIComponent(playerName.trim())}&avatarUrl=${encodeURIComponent(
          avatarUrl
        )}`
      );
      onJoinRoom(roomId, playerName.trim(), code, avatarUrl);
    } catch {
      onJoinRoom(roomId, playerName.trim(), code, avatarUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-2.5 sm:p-4 md:p-8">
      {/* Top Bar - Ultra-Responsive for 375px Mobile up to Desktop */}
      <header className="flex flex-row justify-between items-center max-w-5xl mx-auto w-full border-b border-casino-gold/20 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-casino-goldDark to-casino-gold flex items-center justify-center shadow-gold shrink-0">
            <Spade className="w-4 h-4 sm:w-6 sm:h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <span className="font-serif tracking-wider sm:tracking-widest text-sm sm:text-lg font-bold text-gold-gradient block leading-tight">
              BHABHI THOLA
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-widest text-emerald-400 font-mono">
              Vercel Serverless • Neon Postgres
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Profile Pill with Guest / VIP indicator */}
          <button
            onClick={() => {
              setForceAuthModal(false);
              setShowProfileModal(true);
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full border bg-slate-900/90 hover:bg-slate-800 transition text-[11px] sm:text-xs font-semibold shadow ${
              authProvider === 'guest' ? 'border-amber-500/50' : 'border-casino-gold/60'
            }`}
            title="Click to view VIP profile"
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ${
                authProvider === 'guest' ? 'ring-amber-400' : 'ring-casino-gold'
              }`}
            />
            <span className={`max-w-[70px] sm:max-w-[95px] truncate ${
              authProvider === 'guest' ? 'text-amber-300' : 'text-casino-goldLight'
            }`}>
              {playerName || 'Guest'}
            </span>
            {authProvider === 'guest' ? (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded-full border border-amber-500/30">
                {guestGamesPlayed}/2
              </span>
            ) : (
              <span className="text-[8px] sm:text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded-full border border-emerald-500/40 font-bold">
                VIP
              </span>
            )}
          </button>

          {/* Sign In or VIP Dashboard Action Pill */}
          {authProvider === 'guest' ? (
            <button
              onClick={() => {
                setForceAuthModal(true);
                setShowProfileModal(true);
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition text-[11px] sm:text-xs font-bold shadow-gold whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setForceAuthModal(false);
                setShowProfileModal(true);
              }}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full border border-casino-gold/50 bg-slate-900/80 hover:bg-slate-800 text-casino-goldLight transition text-[11px] sm:text-xs font-semibold whitespace-nowrap"
            >
              <Crown className="w-3.5 h-3.5 text-casino-gold shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center justify-center p-1.5 sm:px-3 sm:py-1 rounded-full border border-casino-gold/40 text-casino-goldLight hover:bg-casino-gold/10 transition text-xs font-medium"
            title="Game Rules"
          >
            <HelpCircle className="w-3.5 h-3.5 text-casino-gold" />
            <span className="hidden md:inline ml-1">Rules</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-4 sm:py-6">
        <div className="bg-slate-900/85 backdrop-blur-md border-2 border-casino-gold/40 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Decorative Golden Corner Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-casino-gold rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-casino-gold rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-casino-gold rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-casino-gold rounded-br-xl pointer-events-none" />

          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-casino-gold/10 border border-casino-gold/30 mb-2">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-casino-gold" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gold-gradient tracking-wider">
              Royal Casino Table
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              Multiplayer trick-taking & penalty card showdown
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-center">
              {error}
            </div>
          )}

          {/* Player Alias & Clickable Avatar Selector */}
          <div className="mb-4 sm:mb-5">
            <label className="block text-[11px] sm:text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1.5">
              Your Alias & Profile
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="relative group p-0.5 rounded-xl border border-casino-gold/60 bg-black/50 hover:scale-105 transition flex-shrink-0"
                title="Click to change avatar & gender"
              >
                <img
                  src={avatarUrl}
                  alt={playerName}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover"
                />
                <span className="absolute -bottom-1 -right-1 bg-casino-gold text-slate-950 text-[7px] font-black rounded px-1 shadow">
                  EDIT
                </span>
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="e.g. CardShark, RoyalPlayer"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-casino-gold rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-casino-gold/40 transition"
                />
              </div>
            </div>
          </div>

          {/* Table Capacity (Person Limit: 2 to 8 Players) */}
          <div className="mb-4 sm:mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-casino-gold font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-casino-gold" />
                <span>Table Capacity (Limit)</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                {maxPlayers} Max Players
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-700/80">
              {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlayers(num)}
                  className={`py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center min-w-0 ${
                    maxPlayers === num
                      ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{num}</span>
                  {num === 4 && <span className="text-[6px] sm:text-[7px] font-normal leading-none -mt-0.5">VIP</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Deck Configuration Selector */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-casino-gold font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-casino-gold" />
                <span>Deck Configuration</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {deckType === 'double' ? '104 Cards' : '52 Cards'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => setDeckType('single')}
                className={`py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  deckType === 'single'
                    ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="truncate">🃏 Single Deck (52)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeckType('double')}
                className={`py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  deckType === 'double'
                    ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="truncate">🂠 Double Deck (104)</span>
              </button>
            </div>
          </div>

          {/* Action Tabs / Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleCreateRoom()}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldDark text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-gold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 group text-sm uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isCreating ? 'Opening Table...' : 'Create VIP Room'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-slate-500 text-xs font-mono uppercase">
                or join existing
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Room Code with Live Auto-Detection */}
            <form onSubmit={handleJoinByCode} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ROOM CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-casino-gold rounded-xl px-4 py-3 text-center tracking-widest font-mono text-casino-gold placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-casino-gold/40 uppercase"
                  />
                  {isCheckingCode && (
                    <div className="absolute right-3 top-3.5">
                      <span className="animate-spin text-xs">⏳</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-1/3 py-3 px-3 rounded-xl transition flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold shadow ${
                    detectionResult?.exists
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                      : detectionResult && !detectionResult.exists
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400'
                      : 'bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>
                    {detectionResult?.exists
                      ? 'Join Table'
                      : detectionResult && !detectionResult.exists
                      ? 'Create'
                      : 'Join'}
                  </span>
                </button>
              </div>

              {/* Live Room Code Detection Feedback Banner */}
              {detectionResult && (
                <div
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition animate-fadeIn ${
                    detectionResult.exists
                      ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300'
                      : 'bg-slate-950/90 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {detectionResult.exists ? (
                    <>
                      <span>
                        🟢 <strong>Table Found:</strong> {detectionResult.playerCount}/
                        {detectionResult.maxPlayers} Players
                        {detectionResult.status === 'in_progress' ? ' • Match In Progress' : ' • Waiting'}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-900/60 px-1.5 py-0.5 rounded">
                        Ready
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        ✨ <strong>New Code:</strong> Table doesn&apos;t exist yet.
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">
                        Click Create to host!
                      </span>
                    </>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Profile & Avatar Selector Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setForceAuthModal(false);
        }}
        onProfileUpdated={handleProfileUpdated}
        forceAuthMode={forceAuthModal}
        currentProfile={{
          alias: playerName,
          avatarUrl,
          gender,
          authProvider,
          guestGamesPlayed,
        }}
      />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-casino-gold/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-casino-gold" />
                <h3 className="font-serif font-bold text-lg text-gold-gradient">
                  Bhabhi Thola Rules
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
                <p className="font-bold text-casino-gold mb-1">1. The Opening Move (Ace of Spades)</p>
                <p>
                  52 cards are distributed among players. The player holding the <strong>Ace of Spades (A♠)</strong> MUST start the first trick by playing it!
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-casino-gold mb-1">2. Must Follow Suit</p>
                <p>
                  Every player must play a card matching the suit led if they possess one. Higher card of the suit led wins the trick.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-red-400 mb-1">3. The &quot;Thola&quot; (Penalty Hit!)</p>
                <p>
                  If a player does <strong>NOT</strong> have any card of the suit led, they can throw <strong>ANY</strong> card!
                  This is a <strong>THOLA</strong>. The player who played the <strong>highest card of the original suit led</strong> takes ALL cards played in the trick into their hand!
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-emerald-400 mb-1">4. Clearing Hand & Becoming SAFE</p>
                <p>
                  As soon as you play your final card, you exit the table as <strong>SAFE</strong> (winner).
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-amber-400 mb-1">5. The &quot;Bhabhi&quot; (Loser)</p>
                <p>
                  The game continues until only <strong>ONE</strong> player remains holding cards. That last player is crowned the <strong>BHABHI</strong>!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full py-2.5 bg-casino-gold text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition"
            >
              Understood, Let&apos;s Play
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-3 border-t border-slate-900">
        Engineered with Next.js App Router • Vercel Native WebSockets (`upgradeWebSocket`) • Neon Serverless PostgreSQL
      </footer>
    </div>
  );
};
