import React from 'react';
import { Card } from '@/lib/types/game';
import { SUIT_SYMBOLS } from '@/lib/game/engine';
import { useTheme } from '@/lib/theme/theme-context';
import { CardDeckStyle, CardBackStyle } from '@/lib/theme/types';

interface CardViewProps {
  card?: Card;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  overrideDeckStyle?: CardDeckStyle;
  overrideBackStyle?: CardBackStyle;
}

// Ornate SVG Court Portraits inspired by traditional Bicycle / Casino decks (Image 5)
const CourtPortrait: React.FC<{ rank: string; suit: string; isRed: boolean }> = ({ rank, suit, isRed }) => {
  const accentColor = isRed ? '#dc2626' : '#1e293b';
  const goldColor = '#d4af37';
  const robeColor = isRed ? '#991b1b' : '#1e3a8a';

  if (rank === 'K') {
    return (
      <svg viewBox="0 0 60 75" className="w-full h-full max-w-[42px] max-h-[52px] filter drop-shadow">
        {/* Robe */}
        <path d="M10 70 L20 38 L40 38 L50 70 Z" fill={robeColor} stroke="#000" strokeWidth="1" />
        <path d="M22 40 L30 65 L38 40 Z" fill={goldColor} />
        {/* Collar & Ermine fur */}
        <path d="M16 38 C20 46 40 46 44 38 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
        {/* Beard & Face */}
        <circle cx="30" cy="27" r="10" fill="#fde68a" stroke="#000" strokeWidth="0.8" />
        <path d="M23 27 Q30 38 37 27 Q30 34 23 27 Z" fill="#475569" />
        <ellipse cx="26" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <ellipse cx="34" cy="25" rx="1.2" ry="1.5" fill="#000" />
        {/* Crown */}
        <path d="M20 20 L22 10 L26 16 L30 8 L34 16 L38 10 L40 20 Z" fill={goldColor} stroke="#78350f" strokeWidth="1" />
        <circle cx="30" cy="8" r="1.5" fill={accentColor} />
        <circle cx="22" cy="10" r="1.2" fill={accentColor} />
        <circle cx="38" cy="10" r="1.2" fill={accentColor} />
        {/* Sword / Sceptre */}
        <line x1="46" y1="22" x2="46" y2="68" stroke="#cbd5e1" strokeWidth="2.5" />
        <circle cx="46" cy="20" r="3" fill={goldColor} />
      </svg>
    );
  }

  if (rank === 'Q') {
    return (
      <svg viewBox="0 0 60 75" className="w-full h-full max-w-[42px] max-h-[52px] filter drop-shadow">
        {/* Robe */}
        <path d="M12 70 L22 36 L38 36 L48 70 Z" fill={robeColor} stroke="#000" strokeWidth="1" />
        <path d="M24 38 L30 62 L36 38 Z" fill={goldColor} />
        {/* Royal Veil / Hair */}
        <path d="M18 20 C14 36 14 50 18 58" stroke={goldColor} strokeWidth="3" fill="none" />
        <path d="M42 20 C46 36 46 50 42 58" stroke={goldColor} strokeWidth="3" fill="none" />
        {/* Face */}
        <circle cx="30" cy="26" r="9.5" fill="#fde68a" stroke="#000" strokeWidth="0.8" />
        <ellipse cx="26" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <ellipse cx="34" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <path d="M27 30 Q30 33 33 30" stroke={accentColor} strokeWidth="1.2" fill="none" />
        {/* Queen Tiara */}
        <path d="M22 18 L24 10 L28 15 L30 7 L32 15 L36 10 L38 18 Z" fill={goldColor} stroke="#92400e" strokeWidth="1" />
        <circle cx="30" cy="7" r="1.5" fill="#e11d48" />
        {/* Sceptre / Rose */}
        <line x1="14" y1="36" x2="14" y2="68" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="14" cy="34" r="3" fill="#e11d48" />
      </svg>
    );
  }

  // Jack (J)
  return (
    <svg viewBox="0 0 60 75" className="w-full h-full max-w-[42px] max-h-[52px] filter drop-shadow">
      {/* Tunic */}
      <path d="M12 70 L20 38 L40 38 L48 70 Z" fill={robeColor} stroke="#000" strokeWidth="1" />
      <path d="M26 38 L30 68 L34 38 Z" fill={goldColor} />
      {/* Face & Hair */}
      <circle cx="30" cy="27" r="9.5" fill="#fde68a" stroke="#000" strokeWidth="0.8" />
      <path d="M21 24 C19 32 20 36 22 38" stroke="#92400e" strokeWidth="3" fill="none" />
      <path d="M39 24 C41 32 40 36 38 38" stroke="#92400e" strokeWidth="3" fill="none" />
      <ellipse cx="26" cy="26" rx="1.2" ry="1.5" fill="#000" />
      <ellipse cx="34" cy="26" rx="1.2" ry="1.5" fill="#000" />
      {/* Feathered Beret / Cap */}
      <path d="M18 20 C22 10 38 10 42 20 Z" fill={accentColor} stroke="#000" strokeWidth="0.8" />
      <path d="M36 12 Q46 6 48 18" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
      {/* Halberd / Axe */}
      <line x1="48" y1="20" x2="48" y2="70" stroke="#94a3b8" strokeWidth="2" />
      <path d="M48 20 Q56 16 52 26 Z" fill="#cbd5e1" />
    </svg>
  );
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  isFaceDown = false,
  isPlayable = false,
  isSelected = false,
  onClick,
  className = '',
  size = 'md',
  overrideDeckStyle,
  overrideBackStyle,
}) => {
  const { cardDesign } = useTheme();
  const deckStyle = overrideDeckStyle || cardDesign?.deckStyle || 'classic-bicycle';
  const backStyle = overrideBackStyle || cardDesign?.backStyle || 'lattice-pattern';

  const sizeClasses = {
    sm: 'w-10 h-14 sm:w-12 sm:h-16 text-[10px] sm:text-xs rounded-md',
    md: 'w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 text-xs sm:text-sm rounded-lg',
    lg: 'w-20 h-28 sm:w-24 sm:h-36 text-sm sm:text-base rounded-xl',
  };

  // ---------------- FACE DOWN CARDS (AUTHENTIC CARD BACKS) ----------------
  if (isFaceDown || !card) {
    if (backStyle === 'lattice-pattern') {
      // Authentic Bavarian Crosshatch Diamond Lattice (Image 5 bottom-right)
      return (
        <div
          className={`relative flex-shrink-0 ${sizeClasses[size]} bg-[#1b3a6b] border-2 border-slate-300 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
        >
          {/* Outer white margin */}
          <div className="absolute inset-1 border border-white/60 rounded bg-[#162d55] flex items-center justify-center overflow-hidden">
            {/* Crosshatch Lattice Pattern */}
            <div
              className="absolute inset-0 opacity-80"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 1px, transparent 0, transparent 6px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 1px, transparent 0, transparent 6px)
                `,
              }}
            />
            {/* Center Oval Medallion */}
            <div className="w-7 h-9 rounded-full border-2 border-white/80 flex items-center justify-center bg-[#0d1d38] shadow z-10">
              <span className="text-white text-xs font-serif">♠</span>
            </div>
          </div>
        </div>
      );
    }

    if (backStyle === 'imperial-ruby') {
      return (
        <div
          className={`relative flex-shrink-0 ${sizeClasses[size]} bg-gradient-to-br from-red-950 via-rose-900 to-amber-950 border-2 border-casino-gold shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
        >
          <div className="absolute inset-1 border border-casino-gold/50 rounded flex items-center justify-center bg-[radial-gradient(#d4af37_1.2px,transparent_1.2px)] [background-size:6px_6px]">
            <div className="w-7 h-7 rounded-full border border-casino-gold flex items-center justify-center bg-black/60 text-casino-gold font-serif text-[11px] shadow-gold">
              👑
            </div>
          </div>
        </div>
      );
    }

    if (backStyle === 'obsidian-dragon') {
      return (
        <div
          className={`relative flex-shrink-0 ${sizeClasses[size]} bg-slate-950 border-2 border-amber-400/80 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
        >
          <div className="absolute inset-1 border border-amber-500/40 rounded flex items-center justify-center bg-zinc-900">
            <div className="w-8 h-8 rounded-full border border-amber-400 flex items-center justify-center bg-black text-amber-300 font-bold text-xs shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              ♠
            </div>
          </div>
        </div>
      );
    }

    // Default: Sapphire Yacht
    return (
      <div
        className={`relative flex-shrink-0 ${sizeClasses[size]} bg-[#0f2942] border-2 border-cyan-400/60 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
      >
        <div className="absolute inset-1 border border-cyan-300/40 rounded flex items-center justify-center bg-[#071626]">
          <div className="w-6 h-6 rounded-full border border-cyan-400 flex items-center justify-center text-cyan-200 text-xs">
            ♦
          </div>
        </div>
      </div>
    );
  }

  // ---------------- FACE UP CARDS ----------------
  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';
  const symbol = SUIT_SYMBOLS[card.suit];
  const isCourt = ['J', 'Q', 'K'].includes(card.rank);
  const isAceOfSpades = card.suit === 'SPADES' && card.rank === 'A';

  // Styling based on Deck Style
  let cardSurfaceClass = 'bg-gradient-to-b from-[#ffffff] via-[#fdfdfc] to-[#f4f2ec] text-slate-950';
  let textColor = isRed ? 'text-red-600' : 'text-slate-950';
  let borderClass = 'border-slate-300';

  if (deckStyle === 'royal-gold') {
    cardSurfaceClass = 'bg-gradient-to-b from-[#fffef7] via-[#fffbf0] to-[#f7eed4] text-amber-950';
    textColor = isRed ? 'text-rose-700' : 'text-amber-950';
    borderClass = 'border-amber-400/80 shadow-[0_0_8px_rgba(212,175,55,0.3)]';
  } else if (deckStyle === 'cyber-neon') {
    cardSurfaceClass = 'bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white';
    textColor = isRed ? 'text-rose-400' : 'text-cyan-400';
    borderClass = isRed ? 'border-rose-500/70' : 'border-cyan-500/70';
  }

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative flex-shrink-0 ${sizeClasses[size]} ${cardSurfaceClass}
        border ${
          isSelected
            ? 'border-amber-400 ring-[3px] ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.95)] -translate-y-4 z-40'
            : isPlayable
            ? `${borderClass} ring-1 ring-casino-gold/40 hover:-translate-y-3 hover:shadow-[0_6px_20px_rgba(212,175,55,0.45)] hover:z-30 cursor-pointer`
            : `${borderClass} opacity-70 cursor-not-allowed hover:opacity-85`
        }
        shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-150 select-none flex flex-col justify-between p-1 sm:p-1.5 overflow-hidden
        ${className}
      `}
    >
      {/* Top Left Rank & Pip */}
      <div className={`flex flex-col items-start leading-none ${textColor} font-bold font-serif pl-0.5 pt-0.5 z-10`}>
        <span className="text-xs sm:text-sm md:text-base font-black tracking-tight">{card.rank}</span>
        <span className="text-[10px] sm:text-xs md:text-sm -mt-0.5">{symbol}</span>
      </div>

      {/* Center Illustrated Artwork */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1">
        {isAceOfSpades ? (
          <div className="flex flex-col items-center justify-center">
            {/* Ornate Ace Filigree */}
            <div className="relative flex items-center justify-center">
              <span className="text-3xl sm:text-4xl md:text-5xl text-slate-950 font-serif drop-shadow">♠</span>
              <span className="absolute -top-1 text-[8px] text-amber-600 font-bold">★</span>
            </div>
            <span className="text-[7px] sm:text-[8px] font-serif uppercase tracking-widest text-amber-700 font-bold -mt-0.5">
              SPADE
            </span>
          </div>
        ) : isCourt ? (
          <div className="w-full h-full flex items-center justify-center">
            <CourtPortrait rank={card.rank} suit={card.suit} isRed={isRed} />
          </div>
        ) : (
          <span className={`text-2xl sm:text-3xl md:text-4xl ${textColor} font-serif drop-shadow-sm`}>
            {symbol}
          </span>
        )}
      </div>

      {/* Bottom Right Mirrored Inverted Rank & Pip (Classic Authentic Bicycle Card Design) */}
      <div className={`flex flex-col items-end leading-none ${textColor} font-bold font-serif pr-0.5 pb-0.5 rotate-180 z-10`}>
        <span className="text-xs sm:text-sm md:text-base font-black tracking-tight">{card.rank}</span>
        <span className="text-[10px] sm:text-xs md:text-sm -mt-0.5">{symbol}</span>
      </div>
    </div>
  );
};
