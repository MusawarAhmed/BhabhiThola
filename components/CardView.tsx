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

// Ornate SVG Suits directly reflecting user reference Images 3, 4, 5
export const OrnateSuitSvg: React.FC<{
  suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
  deckStyle: CardDeckStyle;
  className?: string;
}> = ({ suit, deckStyle, className = 'w-6 h-6' }) => {
  const isRed = suit === 'HEARTS' || suit === 'DIAMONDS';

  // 1. Image 3: Midnight Royal Sapphire (Navy with Gold Filigree / Crimson Velvet)
  if (deckStyle === 'midnight-sapphire') {
    if (suit === 'SPADES') {
      return (
        <svg viewBox="0 0 32 36" className={`${className} filter drop-shadow`}>
          <path
            d="M16 2 C16 2 28 14 28 22 C28 27 24 30 19 30 C16 30 14 28 13 26 C13 29 11 34 8 34 L24 34 C21 34 19 29 19 26 C18 28 16 30 13 30 C8 30 4 27 4 22 C4 14 16 2 16 2 Z"
            fill="#d4af37"
            stroke="#aa8620"
            strokeWidth="0.8"
          />
          <path d="M16 6 C16 6 24 16 23 22 C22 25 19 27 16 23 C13 27 10 25 9 22 C8 16 16 6 16 6 Z" fill="#151923" />
          <circle cx="16" cy="17" r="2" fill="#d4af37" />
        </svg>
      );
    }
    if (suit === 'HEARTS') {
      return (
        <svg viewBox="0 0 32 32" className={`${className} filter drop-shadow`}>
          <path
            d="M16 29 C16 29 2 18 2 9 C2 4 6 1 11 1 C14 1 16 3 16 5 C16 3 18 1 21 1 C26 1 30 4 30 9 C30 18 16 29 16 29 Z"
            fill="#991424"
            stroke="#d4af37"
            strokeWidth="1.2"
          />
          <path d="M16 24 C16 24 7 15 7 9 C7 6 9 4 12 4 C14 4 15 5 16 7 C17 5 18 4 20 4 C23 4 25 6 25 9 C25 15 16 24 16 24 Z" fill="#7f1d1d" />
          <circle cx="16" cy="12" r="2.2" fill="#d4af37" />
        </svg>
      );
    }
    if (suit === 'DIAMONDS') {
      return (
        <svg viewBox="0 0 32 36" className={`${className} filter drop-shadow`}>
          <path d="M16 2 L30 18 L16 34 L2 18 Z" fill="#991424" stroke="#d4af37" strokeWidth="1.2" />
          <path d="M16 7 L25 18 L16 29 L7 18 Z" fill="#7f1d1d" stroke="#f5d77f" strokeWidth="0.8" />
          <circle cx="16" cy="18" r="2" fill="#d4af37" />
        </svg>
      );
    }
    // Clubs
    return (
      <svg viewBox="0 0 32 36" className={`${className} filter drop-shadow`}>
        <circle cx="16" cy="10" r="7" fill="#d4af37" />
        <circle cx="10" cy="19" r="7" fill="#d4af37" />
        <circle cx="22" cy="19" r="7" fill="#d4af37" />
        <path d="M14 20 L18 20 L21 34 L11 34 Z" fill="#d4af37" />
        <circle cx="16" cy="10" r="4" fill="#151923" />
        <circle cx="10" cy="19" r="4" fill="#151923" />
        <circle cx="22" cy="19" r="4" fill="#151923" />
      </svg>
    );
  }

  // 2. Image 4: Antique Victorian Parchment (Black Ink & Blood Ruby with Damask Lace)
  if (deckStyle === 'vintage-ivory') {
    if (suit === 'SPADES') {
      return (
        <svg viewBox="0 0 32 36" className={className}>
          <path
            d="M16 2 C16 2 28 14 28 22 C28 27 24 30 19 30 C16 30 14 28 13 26 C13 29 11 34 8 34 L24 34 C21 34 19 29 19 26 C18 28 16 30 13 30 C8 30 4 27 4 22 C4 14 16 2 16 2 Z"
            fill="#1c1917"
          />
          <path d="M16 8 C16 8 23 16 22 21 C21 24 19 25 16 22 C13 25 11 24 10 21 C9 16 16 8 16 8 Z" fill="#f6f0e3" opacity="0.35" />
        </svg>
      );
    }
    if (suit === 'HEARTS') {
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <path
            d="M16 29 C16 29 2 18 2 9 C2 4 6 1 11 1 C14 1 16 3 16 5 C16 3 18 1 21 1 C26 1 30 4 30 9 C30 18 16 29 16 29 Z"
            fill="#881326"
          />
          <path d="M16 23 C16 23 8 15 8 9 C8 6 10 4 13 4 C14 4 15 5 16 7 C17 5 18 4 19 4 C22 4 24 6 24 9 C24 15 16 23 16 23 Z" fill="#f6f0e3" opacity="0.3" />
        </svg>
      );
    }
    if (suit === 'DIAMONDS') {
      return (
        <svg viewBox="0 0 32 36" className={className}>
          <path d="M16 2 L30 18 L16 34 L2 18 Z" fill="#881326" />
          <path d="M16 8 L24 18 L16 28 L8 18 Z" fill="#f6f0e3" opacity="0.3" />
        </svg>
      );
    }
    // Clubs
    return (
      <svg viewBox="0 0 32 36" className={className}>
        <circle cx="16" cy="10" r="7" fill="#1c1917" />
        <circle cx="10" cy="19" r="7" fill="#1c1917" />
        <circle cx="22" cy="19" r="7" fill="#1c1917" />
        <path d="M14 20 L18 20 L21 34 L11 34 Z" fill="#1c1917" />
        <circle cx="16" cy="10" r="3.5" fill="#f6f0e3" opacity="0.3" />
        <circle cx="10" cy="19" r="3.5" fill="#f6f0e3" opacity="0.3" />
        <circle cx="22" cy="19" r="3.5" fill="#f6f0e3" opacity="0.3" />
      </svg>
    );
  }

  // 3. Image 5: Stealth Obsidian (Matte Black & Metallic Gold Foil / Ruby Gem)
  if (deckStyle === 'obsidian-gold') {
    if (suit === 'SPADES') {
      return (
        <svg viewBox="0 0 32 36" className={`${className} filter drop-shadow`}>
          <path
            d="M16 2 C16 2 28 14 28 22 C28 27 24 30 19 30 C16 30 14 28 13 26 C13 29 11 34 8 34 L24 34 C21 34 19 29 19 26 C18 28 16 30 13 30 C8 30 4 27 4 22 C4 14 16 2 16 2 Z"
            fill="#f5d77f"
            stroke="#aa8620"
            strokeWidth="0.8"
          />
          <path d="M16 7 C16 7 24 16 23 21 C22 24 19 25 16 22 C13 25 10 24 9 21 C8 16 16 7 16 7 Z" fill="#0d0f12" />
          <circle cx="16" cy="17" r="1.8" fill="#f5d77f" />
        </svg>
      );
    }
    if (suit === 'HEARTS') {
      return (
        <svg viewBox="0 0 32 32" className={`${className} filter drop-shadow`}>
          <path
            d="M16 29 C16 29 2 18 2 9 C2 4 6 1 11 1 C14 1 16 3 16 5 C16 3 18 1 21 1 C26 1 30 4 30 9 C30 18 16 29 16 29 Z"
            fill="#9f1239"
            stroke="#f5d77f"
            strokeWidth="1.2"
          />
          <circle cx="16" cy="11" r="2.5" fill="#f5d77f" />
        </svg>
      );
    }
    if (suit === 'DIAMONDS') {
      return (
        <svg viewBox="0 0 32 36" className={`${className} filter drop-shadow`}>
          <path d="M16 2 L30 18 L16 34 L2 18 Z" fill="#9f1239" stroke="#f5d77f" strokeWidth="1.2" />
          <path d="M16 9 L23 18 L16 27 L9 18 Z" fill="#881337" />
          <circle cx="16" cy="18" r="1.8" fill="#f5d77f" />
        </svg>
      );
    }
    // Clubs
    return (
      <svg viewBox="0 0 32 36" className={`${className} filter drop-shadow`}>
        <circle cx="16" cy="10" r="7" fill="#f5d77f" />
        <circle cx="10" cy="19" r="7" fill="#f5d77f" />
        <circle cx="22" cy="19" r="7" fill="#f5d77f" />
        <path d="M14 20 L18 20 L21 34 L11 34 Z" fill="#f5d77f" />
        <circle cx="16" cy="10" r="3.5" fill="#0d0f12" />
        <circle cx="10" cy="19" r="3.5" fill="#0d0f12" />
        <circle cx="22" cy="19" r="3.5" fill="#0d0f12" />
      </svg>
    );
  }

  // 4. Default: Classic Vegas Linen (Traditional Red / Black)
  const fillColor = isRed ? '#dc2626' : '#0f172a';
  return (
    <span className={`font-serif ${isRed ? 'text-red-600' : 'text-slate-900'} leading-none select-none`}>
      {SUIT_SYMBOLS[suit]}
    </span>
  );
};

// Royal Court Portraits (Jack, Queen, King) tailored to deck palettes
const CourtPortrait: React.FC<{ rank: string; suit: string; deckStyle: CardDeckStyle }> = ({ rank, suit, deckStyle }) => {
  const isRed = suit === 'HEARTS' || suit === 'DIAMONDS';

  let robeColor = isRed ? '#881326' : '#1e3a8a';
  let goldColor = '#d4af37';
  let faceColor = '#fde68a';
  let strokeColor = '#000';

  if (deckStyle === 'midnight-sapphire') {
    robeColor = isRed ? '#991424' : '#1e293b';
    goldColor = '#f5d77f';
    faceColor = '#e2e8f0';
    strokeColor = '#d4af37';
  } else if (deckStyle === 'obsidian-gold') {
    robeColor = isRed ? '#9f1239' : '#111317';
    goldColor = '#f5d77f';
    faceColor = '#fcd34d';
    strokeColor = '#f5d77f';
  } else if (deckStyle === 'vintage-ivory') {
    robeColor = isRed ? '#831522' : '#1e293b';
    goldColor = '#b45309';
    faceColor = '#fef3c7';
    strokeColor = '#1c1917';
  }

  if (rank === 'K') {
    return (
      <svg viewBox="0 0 60 75" className="w-full h-full max-w-[42px] max-h-[52px] filter drop-shadow">
        <path d="M10 70 L20 38 L40 38 L50 70 Z" fill={robeColor} stroke={strokeColor} strokeWidth="1" />
        <path d="M22 40 L30 65 L38 40 Z" fill={goldColor} />
        <path d="M16 38 C20 46 40 46 44 38 Z" fill="#fff" stroke={strokeColor} strokeWidth="0.8" />
        <circle cx="30" cy="27" r="10" fill={faceColor} stroke={strokeColor} strokeWidth="0.8" />
        <path d="M23 27 Q30 38 37 27 Q30 34 23 27 Z" fill="#475569" />
        <ellipse cx="26" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <ellipse cx="34" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <path d="M20 20 L22 10 L26 16 L30 8 L34 16 L38 10 L40 20 Z" fill={goldColor} stroke="#78350f" strokeWidth="1" />
        <circle cx="30" cy="8" r="1.5" fill={isRed ? '#e11d48' : '#3b82f6'} />
        <line x1="46" y1="22" x2="46" y2="68" stroke="#cbd5e1" strokeWidth="2.5" />
        <circle cx="46" cy="20" r="3" fill={goldColor} />
      </svg>
    );
  }

  if (rank === 'Q') {
    return (
      <svg viewBox="0 0 60 75" className="w-full h-full max-w-[42px] max-h-[52px] filter drop-shadow">
        <path d="M12 70 L22 36 L38 36 L48 70 Z" fill={robeColor} stroke={strokeColor} strokeWidth="1" />
        <path d="M24 38 L30 62 L36 38 Z" fill={goldColor} />
        <path d="M18 20 C14 36 14 50 18 58" stroke={goldColor} strokeWidth="3" fill="none" />
        <path d="M42 20 C46 36 46 50 42 58" stroke={goldColor} strokeWidth="3" fill="none" />
        <circle cx="30" cy="26" r="9.5" fill={faceColor} stroke={strokeColor} strokeWidth="0.8" />
        <ellipse cx="26" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <ellipse cx="34" cy="25" rx="1.2" ry="1.5" fill="#000" />
        <path d="M22 18 L24 10 L28 15 L30 7 L32 15 L36 10 L38 18 Z" fill={goldColor} stroke="#92400e" strokeWidth="1" />
        <circle cx="30" cy="7" r="1.5" fill="#e11d48" />
        <line x1="14" y1="36" x2="14" y2="68" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="14" cy="34" r="3" fill="#e11d48" />
      </svg>
    );
  }

  // Jack (J)
  return (
    <svg viewBox="0 0 60 75" className="w-full h-full max-w-[42px] max-h-[52px] filter drop-shadow">
      <path d="M12 70 L20 38 L40 38 L48 70 Z" fill={robeColor} stroke={strokeColor} strokeWidth="1" />
      <path d="M26 38 L30 68 L34 38 Z" fill={goldColor} />
      <circle cx="30" cy="27" r="9.5" fill={faceColor} stroke={strokeColor} strokeWidth="0.8" />
      <ellipse cx="26" cy="26" rx="1.2" ry="1.5" fill="#000" />
      <ellipse cx="34" cy="26" rx="1.2" ry="1.5" fill="#000" />
      <path d="M18 20 C22 10 38 10 42 20 Z" fill={isRed ? '#e11d48' : '#3b82f6'} stroke={strokeColor} strokeWidth="0.8" />
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
  const deckStyle = overrideDeckStyle || cardDesign?.deckStyle || 'vintage-ivory';
  const backStyle = overrideBackStyle || cardDesign?.backStyle || 'vintage-navy-cartouche';

  const sizeClasses = {
    sm: 'w-10 h-14 sm:w-12 sm:h-16 text-[10px] sm:text-xs rounded-md',
    md: 'w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 text-xs sm:text-sm rounded-lg',
    lg: 'w-20 h-28 sm:w-24 sm:h-36 text-sm sm:text-base rounded-xl',
  };

  // ---------------- FACE DOWN CARDS (IMAGE 3, 4, 5 AUTHENTIC CARD BACKS) ----------------
  if (isFaceDown || !card) {
    // 1. Image 4 bottom-right: Vintage Navy Cartouche with Baroque Gold Frame
    if (backStyle === 'vintage-navy-cartouche') {
      return (
        <div
          className={`relative flex-shrink-0 ${sizeClasses[size]} bg-[#12223e] border border-amber-300/80 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
        >
          <div className="absolute inset-1 border border-amber-400/50 rounded bg-[#0b172c] flex items-center justify-center overflow-hidden">
            {/* Victorian Damask Lattice */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `radial-gradient(#d4af37 1px, transparent 1px)`,
                backgroundSize: '5px 5px',
              }}
            />
            {/* Center Ornate Cartouche */}
            <div className="w-8 h-10 sm:w-9 sm:h-12 border-2 border-amber-400/80 rounded-full flex items-center justify-center bg-[#07101f] shadow-lg z-10 p-1">
              <span className="text-amber-300 text-xs sm:text-sm">♠</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Image 3 bottom-right: Midnight Sapphire Baroque Medallion
    if (backStyle === 'sapphire-baroque') {
      return (
        <div
          className={`relative flex-shrink-0 ${sizeClasses[size]} bg-[#0f172a] border-2 border-amber-400/90 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
        >
          <div className="absolute inset-1 border-2 border-amber-500/60 rounded bg-[#0a0f1d] flex items-center justify-center overflow-hidden">
            <div className="w-9 h-11 border-2 border-amber-300/90 rotate-45 flex items-center justify-center bg-[#070b16] shadow">
              <span className="text-amber-300 text-xs -rotate-45 font-serif">♦</span>
            </div>
          </div>
        </div>
      );
    }

    // 3. Image 5 bottom-right: Obsidian Mandala Gold Foil
    if (backStyle === 'obsidian-mandala') {
      return (
        <div
          className={`relative flex-shrink-0 ${sizeClasses[size]} bg-[#07080a] border-2 border-amber-400 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
        >
          <div className="absolute inset-1 border border-amber-500/60 rounded bg-[#0c0e12] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-amber-400 flex items-center justify-center bg-black text-amber-300 text-xs shadow-[0_0_12px_rgba(245,215,127,0.6)]">
              👑
            </div>
          </div>
        </div>
      );
    }

    // 4. Bavarian Diamond Crosshatch Lattice
    return (
      <div
        className={`relative flex-shrink-0 ${sizeClasses[size]} bg-[#1b3a6b] border-2 border-slate-300 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
      >
        <div className="absolute inset-1 border border-white/60 rounded bg-[#162d55] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-75"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 1px, transparent 0, transparent 6px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 1px, transparent 0, transparent 6px)
              `,
            }}
          />
          <div className="w-7 h-9 rounded-full border border-white/80 flex items-center justify-center bg-[#0d1d38] shadow z-10 text-white text-xs">
            ♠
          </div>
        </div>
      </div>
    );
  }

  // ---------------- FACE UP CARDS (IMAGE 3, 4, 5 LUXURY DECKS) ----------------
  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';
  const isCourt = ['J', 'Q', 'K'].includes(card.rank);
  const isAceOfSpades = card.suit === 'SPADES' && card.rank === 'A';

  // Deck Styling Palettes matching Images 3, 4, 5
  let cardSurfaceClass = 'bg-gradient-to-b from-[#fbf8f0] via-[#f5efe2] to-[#ebdcc3] text-[#1c1917]';
  let textColor = isRed ? 'text-[#881326]' : 'text-[#1c1917]';
  let borderClass = 'border-[#c8b99d] shadow-[0_4px_10px_rgba(0,0,0,0.35)]';

  if (deckStyle === 'midnight-sapphire') {
    cardSurfaceClass = 'bg-gradient-to-b from-[#181d29] via-[#141822] to-[#0e121a] text-white';
    textColor = isRed ? 'text-[#f43f5e]' : 'text-[#f5d77f]';
    borderClass = 'border-amber-400/80 shadow-[0_4px_14px_rgba(0,0,0,0.6)]';
  } else if (deckStyle === 'obsidian-gold') {
    cardSurfaceClass = 'bg-gradient-to-b from-[#13151a] via-[#0d0f12] to-[#07080a] text-white';
    textColor = isRed ? 'text-[#f43f5e]' : 'text-[#f5d77f]';
    borderClass = 'border-amber-400 shadow-[0_4px_16px_rgba(0,0,0,0.8)]';
  } else if (deckStyle === 'classic-bicycle') {
    cardSurfaceClass = 'bg-gradient-to-b from-[#ffffff] via-[#fcfbf9] to-[#f4f2ed] text-slate-950';
    textColor = isRed ? 'text-red-600' : 'text-slate-950';
    borderClass = 'border-slate-300 shadow-[0_4px_10px_rgba(0,0,0,0.3)]';
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative flex-shrink-0 ${sizeClasses[size]} ${cardSurfaceClass}
        border ${
          isSelected
            ? 'border-amber-400 ring-[3px] ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.95)] z-40 cursor-pointer'
            : isPlayable
            ? `${borderClass} ring-1 ring-casino-gold/40 hover:-translate-y-2 hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)] hover:z-30 cursor-pointer`
            : `${borderClass} opacity-75 hover:opacity-90 cursor-pointer`
        }
        transition-all duration-200 select-none flex flex-col justify-between p-1 sm:p-1.5 overflow-hidden
        ${className}
      `}
    >
      {/* Ornate Corner Framing (Reference Images 3, 4, 5) */}
      <div className="absolute inset-0.5 border border-current opacity-15 pointer-events-none rounded-[5px]" />

      {/* Top Left Rank & Pip */}
      <div className={`flex flex-col items-start leading-none ${textColor} font-bold font-serif pl-0.5 pt-0.5 z-10`}>
        <span className="text-xs sm:text-sm md:text-base font-black tracking-tight">{card.rank}</span>
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 -mt-0.5">
          <OrnateSuitSvg suit={card.suit} deckStyle={deckStyle} className="w-full h-full" />
        </div>
      </div>

      {/* Center Artwork */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1">
        {isAceOfSpades ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-9 sm:w-11 sm:h-12 flex items-center justify-center">
              <OrnateSuitSvg suit="SPADES" deckStyle={deckStyle} className="w-full h-full" />
            </div>
            <span className={`text-[7px] sm:text-[8px] font-serif uppercase tracking-widest font-black mt-0.5 ${textColor}`}>
              SPADE
            </span>
          </div>
        ) : isCourt ? (
          <div className="w-full h-full flex items-center justify-center">
            <CourtPortrait rank={card.rank} suit={card.suit} deckStyle={deckStyle} />
          </div>
        ) : (
          <div className="w-7 h-8 sm:w-9 sm:h-10 flex items-center justify-center">
            <OrnateSuitSvg suit={card.suit} deckStyle={deckStyle} className="w-full h-full" />
          </div>
        )}
      </div>

      {/* Bottom Right Mirrored Inverted Rank & Pip */}
      <div className={`flex flex-col items-end leading-none ${textColor} font-bold font-serif pr-0.5 pb-0.5 rotate-180 z-10`}>
        <span className="text-xs sm:text-sm md:text-base font-black tracking-tight">{card.rank}</span>
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 -mt-0.5">
          <OrnateSuitSvg suit={card.suit} deckStyle={deckStyle} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
