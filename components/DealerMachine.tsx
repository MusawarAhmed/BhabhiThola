'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { DeckType } from '@/lib/types/game';

interface DealerMachineProps {
  isDealing: boolean;
  deckType?: DeckType;
  soundEnabled?: boolean;
}

export const DealerMachine: React.FC<DealerMachineProps> = ({
  isDealing,
  deckType = 'single',
  soundEnabled = true,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthetic card sounds using Web Audio API (zero external assets needed)
  useEffect(() => {
    if (!isDealing || !soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // 1. Riffle Shuffle Sound (Series of rapid flutter clicks)
      const playRiffle = () => {
        const now = ctx.currentTime;
        for (let i = 0; i < 18; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140 + Math.random() * 220, now + i * 0.045);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(800 + Math.random() * 400, now + i * 0.045);

          gain.gain.setValueAtTime(0.04, now + i * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.035);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.045);
          osc.stop(now + i * 0.045 + 0.04);
        }
      };

      // 2. Deal card snap sound (crisp snap per card packet)
      const playCardSnap = (delaySec: number) => {
        const t = ctx.currentTime + delaySec;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.07);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
      };

      playRiffle();

      // Trigger deal snaps as cards fly out
      playCardSnap(1.0);
      playCardSnap(1.25);
      playCardSnap(1.5);
      playCardSnap(1.75);
      playCardSnap(2.0);

      return () => {
        try {
          ctx.close();
        } catch {}
      };
    } catch {
      // Audio fallback safe
    }
  }, [isDealing, soundEnabled]);

  if (!isDealing) return null;

  const totalCards = deckType === 'double' ? 104 : 52;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
      {/* Semi-transparent dark felt overlay during deal */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300" />

      {/* Main Dealer Machine Enclosure */}
      <div className="relative z-50 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        {/* Shuffler Machine Box */}
        <div className="relative w-48 sm:w-56 h-28 sm:h-32 rounded-2xl bg-gradient-to-b from-[#2a1708] via-[#1a0e05] to-[#0c0602] border-2 border-casino-gold shadow-[0_0_40px_rgba(212,175,55,0.6)] p-2.5 flex flex-col justify-between overflow-hidden">
          {/* Metallic Gold Trim & Screws */}
          <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-casino-gold/60 shadow" />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-casino-gold/60 shadow" />
          <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-casino-gold/60 shadow" />
          <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-casino-gold/60 shadow" />

          {/* Machine Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-casino-gold animate-spin-slow" />
              <span className="text-[10px] font-mono tracking-widest text-casino-gold uppercase font-bold">
                AUTO-SHUFFLER
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold">
              {totalCards} CARDS
            </span>
          </div>

          {/* Center Card Slot / Shuffling Window */}
          <div className="relative w-full h-12 rounded-lg bg-black/80 border border-casino-gold/40 flex items-center justify-center overflow-hidden">
            {/* Split Deck Riffle Animation */}
            <div className="relative flex items-center justify-center gap-1">
              {/* Left Stack */}
              <div className="w-9 h-11 rounded bg-gradient-to-br from-red-950 to-amber-950 border border-casino-gold/60 shadow-md animate-pulse transform -rotate-6">
                <div className="w-full h-full flex items-center justify-center text-casino-gold text-[10px] font-serif">
                  ♠
                </div>
              </div>

              {/* Shuffling Energy Wave */}
              <div className="w-4 flex flex-col items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="text-[8px] font-mono text-emerald-400 font-bold">VIP</span>
              </div>

              {/* Right Stack */}
              <div className="w-9 h-11 rounded bg-gradient-to-br from-red-950 to-amber-950 border border-casino-gold/60 shadow-md animate-pulse transform rotate-6">
                <div className="w-full h-full flex items-center justify-center text-casino-gold text-[10px] font-serif">
                  ♥
                </div>
              </div>
            </div>
          </div>

          {/* Machine Status Screen */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] font-mono text-slate-300 font-semibold tracking-wider">
                DEALING HANDS...
              </span>
            </div>
            <span className="text-[10px] font-mono text-casino-gold font-bold">
              {deckType === 'double' ? '2 DECK' : '1 DECK'}
            </span>
          </div>
        </div>

        {/* FLYING CARDS DISPERSION ANIMATION (Flying from center out to the 4 seats) */}
        {/* 1. Downward towards You */}
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-south" />
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-south [animation-delay:0.3s]" />

        {/* 2. Leftwards towards West (Zara) */}
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-west [animation-delay:0.1s]" />
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-west [animation-delay:0.4s]" />

        {/* 3. Upwards towards North (Ahmed) */}
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-north [animation-delay:0.2s]" />
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-north [animation-delay:0.5s]" />

        {/* 4. Rightwards towards East (Ayesha) */}
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-east [animation-delay:0.25s]" />
        <div className="absolute w-8 h-12 rounded bg-gradient-to-br from-red-900 to-amber-950 border border-casino-gold shadow-2xl animate-deal-east [animation-delay:0.55s]" />
      </div>
    </div>
  );
};
