import React from 'react';
import { Card } from '@/lib/types/game';
import { SUIT_SYMBOLS } from '@/lib/game/engine';

interface CardViewProps {
  card?: Card;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isFaceDown = false,
  isPlayable = false,
  isSelected = false,
  onClick,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-14 sm:w-12 sm:h-16 text-[10px] sm:text-xs rounded-md',
    md: 'w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 text-xs sm:text-sm rounded-lg',
    lg: 'w-20 h-28 sm:w-24 sm:h-36 text-sm sm:text-base rounded-xl',
  };

  if (isFaceDown || !card) {
    return (
      <div
        className={`relative flex-shrink-0 ${sizeClasses[size]} bg-gradient-to-br from-red-950 via-red-900 to-amber-950 border-2 border-casino-gold/60 shadow-card flex items-center justify-center select-none overflow-hidden ${className}`}
      >
        <div className="absolute inset-1 border border-casino-gold/30 rounded flex items-center justify-center bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:6px_6px]">
          <div className="w-6 h-6 rounded-full border border-casino-gold/50 flex items-center justify-center bg-black/40 text-casino-gold font-serif font-bold text-[10px]">
            ♠
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';
  const textColor = isRed ? 'text-red-600' : 'text-slate-950';
  const symbol = SUIT_SYMBOLS[card.suit];
  const isAceOfSpades = card.suit === 'SPADES' && card.rank === 'A';

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative flex-shrink-0 ${sizeClasses[size]} bg-gradient-to-b from-[#ffffff] via-[#fcfbf9] to-[#f4f2ed]
        border ${
          isSelected
            ? 'border-amber-300 ring-[3px] ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.95)] -translate-y-4 z-40'
            : isPlayable
            ? 'border-casino-gold/80 ring-1 ring-casino-gold/30 hover:-translate-y-3 hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)] hover:z-30 cursor-pointer'
            : 'border-slate-300/80 opacity-70 cursor-not-allowed hover:opacity-85'
        }
        shadow-[0_4px_10px_rgba(0,0,0,0.35)] transition-transform duration-150 select-none flex flex-col justify-between p-1 sm:p-1.5 overflow-hidden
        ${className}
      `}
    >
      {/* Top Left Rank & Small Suit Symbol (Matching Reference Image 3: Bold, Clean, Authentic) */}
      <div className={`flex flex-col items-start leading-none ${textColor} font-bold font-serif pl-0.5 pt-0.5`}>
        <span className="text-xs sm:text-sm md:text-base font-black tracking-tight">{card.rank}</span>
        <span className="text-[10px] sm:text-xs md:text-sm -mt-0.5">{symbol}</span>
      </div>

      {/* Center Large Crisp Artwork (No upside-down clutter on bottom) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isAceOfSpades ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl text-slate-950 filter drop-shadow font-serif">♠</span>
            <span className="text-[7px] sm:text-[8px] font-serif uppercase tracking-widest text-casino-goldDark font-bold mt-0.5">
              Ace
            </span>
          </div>
        ) : (
          <span
            className={`text-xl sm:text-2xl md:text-3xl ${textColor} ${
              ['J', 'Q', 'K'].includes(card.rank) ? 'opacity-90 font-serif' : 'opacity-95'
            }`}
          >
            {symbol}
          </span>
        )}
      </div>

      {/* Clean bottom margin without inverted text clutter */}
      <div className="h-1 sm:h-2 w-full pointer-events-none" />
    </div>
  );
};
