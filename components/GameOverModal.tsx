'use client';

import React from 'react';
import { Crown, Sparkles, RefreshCw, LogOut, Flame, ShieldCheck, Layers } from 'lucide-react';
import { GameState, DeckType } from '@/lib/types/game';

interface GameOverModalProps {
  isOpen: boolean;
  gameState: GameState;
  playerId: string;
  isHost: boolean;
  onNextRound: () => void;
  onSetDeckType: (deckType: DeckType) => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  gameState,
  playerId,
  isHost,
  onNextRound,
  onSetDeckType,
  onLeave,
}) => {
  if (!isOpen || gameState.status !== 'game_over') return null;

  // Identify Bhabhi (Loser)
  const bhabhiPlayer =
    gameState.players.find((p) => p.id === gameState.bhabhiPlayerId || p.isBhabhi) ||
    gameState.players.find((p) => p.cardCount > 0) ||
    gameState.players[0];

  const isSelfBhabhi = bhabhiPlayer?.id === playerId;
  const safePlayers = gameState.players.filter((p) => p.id !== bhabhiPlayer?.id);
  const hostPlayer = gameState.players.find((p) => p.isHost) || gameState.players[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#133525] via-[#0a1e15] to-[#040e0a] border-2 border-casino-gold rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(212,175,55,0.45)] text-slate-100 flex flex-col gap-4 overflow-hidden">
        {/* Subtle decorative gold corner accents */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-casino-gold/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-casino-gold/60 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-casino-gold/60 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-casino-gold/60 rounded-br-xl pointer-events-none" />

        {/* HEADER */}
        <div className="text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casino-gold/10 border border-casino-gold/50 text-casino-gold font-serif text-xs uppercase tracking-widest mb-1 shadow-inner">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>Round {gameState.roundNumber} / {gameState.maxRounds} Complete</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-wider text-gold-gradient drop-shadow">
            BHABHI DECLARED!
          </h2>
        </div>

        {/* HERO LOSER SPOTLIGHT (The Bhabhi Showdown Banner) */}
        <div className="relative rounded-2xl bg-gradient-to-r from-red-950/70 via-black/80 to-red-950/70 border border-red-500/60 p-4 flex flex-col items-center text-center shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]">
          {/* Avatar with Flaming Halo */}
          <div className="relative mb-2">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-red-600 animate-spin-slow opacity-80 blur-sm" />
            <img
              src={bhabhiPlayer?.avatarUrl}
              alt={bhabhiPlayer?.name}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-2xl"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow">
              <Flame className="w-3 h-3 fill-current animate-bounce" />
              <span>BHABHI</span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide mt-1">
            {isSelfBhabhi ? 'YOU ARE THE BHABHI!' : `${bhabhiPlayer?.name} IS THE BHABHI!`}
          </h3>

          <p className="text-xs text-red-300/90 mt-0.5">
            {isSelfBhabhi
              ? `You were trapped with ${bhabhiPlayer?.cardCount || 'the remaining'} penalty cards!`
              : `${bhabhiPlayer?.name} was left holding ${bhabhiPlayer?.cardCount || 'the remaining'} penalty cards and lost this round.`}
          </p>
        </div>

        {/* ROUND STANDINGS ROSTER */}
        <div className="rounded-xl bg-black/40 border border-emerald-900/60 p-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between px-1">
            <span>Finishing Order</span>
            <span>Status</span>
          </div>

          {/* Safe Players List */}
          {safePlayers.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/30 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 text-xs">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-500/50"
                />
                <span className="font-semibold text-slate-200">
                  {p.name} {p.id === playerId && '(You)'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600/40">
                <ShieldCheck className="w-3 h-3" />
                <span>SAFE</span>
              </div>
            </div>
          ))}

          {/* Bhabhi Loser Entry */}
          {bhabhiPlayer && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-950/50 border border-red-500/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-400 text-xs">💀</span>
                <img
                  src={bhabhiPlayer.avatarUrl}
                  alt={bhabhiPlayer.name}
                  className="w-5 h-5 rounded-full object-cover border border-red-500/60"
                />
                <span className="font-bold text-red-200">
                  {bhabhiPlayer.name} {isSelfBhabhi && '(You)'}
                </span>
              </div>
              <span className="text-[10px] font-black text-red-300 bg-red-900/80 px-2 py-0.5 rounded border border-red-500/50">
                LOST ({bhabhiPlayer.cardCount} Cards)
              </span>
            </div>
          )}
        </div>

        {/* DECK CONFIGURATION TOGGLE (Visible to Host or info to players) */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/50 border border-casino-gold/30 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-casino-gold" />
            <span className="text-slate-300 text-[11px] font-medium">Deck Configuration:</span>
          </div>

          {isHost ? (
            <div className="flex items-center gap-1 bg-[#091b13] p-0.5 rounded-lg border border-casino-gold/40">
              <button
                onClick={() => onSetDeckType('single')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  gameState.deckType !== 'double'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Single (52)
              </button>
              <button
                onClick={() => onSetDeckType('double')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  gameState.deckType === 'double'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Double (104)
              </button>
            </div>
          ) : (
            <span className="font-mono font-bold text-casino-gold text-[11px]">
              {gameState.deckType === 'double' ? 'Double Deck (104 Cards)' : 'Single Deck (52 Cards)'}
            </span>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {isHost ? (
            <button
              onClick={onNextRound}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black font-serif tracking-wider uppercase py-3 rounded-2xl text-xs sm:text-sm shadow-gold transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                Deal Round {Math.min((gameState.roundNumber || 1) + 1, gameState.maxRounds)}
              </span>
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-black/60 border border-emerald-900/60 text-slate-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Waiting for {hostPlayer?.name || 'Host'} to deal next round...</span>
            </div>
          )}

          <button
            onClick={onLeave}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-200 font-semibold text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
