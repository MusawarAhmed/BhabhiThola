export type ThemeId = 'emerald' | 'crimson' | 'sapphire' | 'midnight' | 'obsidian' | 'maharaja';

export type CardDeckStyle =
  | 'noir-gold'           // Art Deco Noir & Gold Foil (User Image)
  | 'mughal-gold'         // Mughal Royal Court & Gold Foil
  | 'vintage-ivory'       // Image 4: Antique Victorian Parchment / Cream Damask
  | 'midnight-sapphire'   // Image 3: Midnight Navy Blue & Filigree Gold
  | 'obsidian-gold'       // Image 5: Stealth Obsidian Matte Black & Gold Foil
  | 'classic-bicycle'     // Classic Vegas Linen White
  | 'royal-gold'          // Monaco Gold Foil Luxe
  | 'cyber-neon';         // Cyberpunk Neon

export type CardBackStyle =
  | 'noir-art-deco'          // Art Deco Geometric Gold Labyrinth (User Image)
  | 'mughal-lattice'         // Royal Mughal Gold Jaali Lattice
  | 'vintage-navy-cartouche' // Image 4 bottom-right
  | 'sapphire-baroque'       // Image 3 bottom-right
  | 'obsidian-mandala'       // Image 5 bottom-right
  | 'lattice-pattern'        // Classic Bavarian Lattice
  | 'imperial-ruby'
  | 'cyber-holo';

export type SiteLanguage = 'en' | 'ur' | 'hi' | 'pa' | 'ar' | 'es';

export interface CardDesignSettings {
  deckStyle: CardDeckStyle;
  backStyle: CardBackStyle;
  cornerRankSize: 'normal' | 'large';
  courtArtStyle: 'vintage-illustrated' | 'minimal-vector';
}

export const DEFAULT_CARD_DESIGN: CardDesignSettings = {
  deckStyle: 'noir-gold',
  backStyle: 'noir-art-deco',
  cornerRankSize: 'normal',
  courtArtStyle: 'vintage-illustrated',
};

export const DEFAULT_SITE_LANGUAGE: SiteLanguage = 'en';

export interface CasinoTheme {
  id: ThemeId;
  name: string;
  badge: string;
  tagline: string;
  feltStyle: string;
  railStyle: string;
  railBorder: string;
  goldTrim: string;
  bgGradient: string;
  accentColor: string;
  accentText: string;
  glowShadow: string;
  badgeBg: string;
  previewImage?: string;
}

export interface AnimationSettings {
  dealStyle: 'casino-pitch' | 'smooth-ribbon' | 'tactile-snap';
  ambientGlow: 'subtle' | 'vibrant' | 'cinematic';
  cardLanding: 'perspective-tilt' | 'spring-bounce' | 'flat-snap';
  soundPack: 'classic-vegas' | 'minimal-bell' | 'muted';
}

export interface SiteEvent {
  id: string;
  title: string;
  tag: string;
  description: string;
  glowColor: 'gold' | 'emerald' | 'rose' | 'cyan' | 'purple';
  isActive: boolean;
  linkText?: string;
}

export const CASINO_THEMES: Record<ThemeId, CasinoTheme> = {
  emerald: {
    id: 'emerald',
    name: 'Monte Carlo Emerald',
    badge: 'CLASSIC LUXURY',
    tagline: 'Rich green casino baize with polished dark walnut rail & champagne gold trim',
    feltStyle: 'radial-gradient(ellipse at center, #1b4931 0%, #0d281a 60%, #05140c 100%)',
    railStyle: 'linear-gradient(to bottom, #5c3014 0%, #331606 50%, #1a0902 100%)',
    railBorder: '#804a1f',
    goldTrim: 'linear-gradient(135deg, #f5d77f 0%, #d4af37 50%, #785a08 100%)',
    bgGradient: 'from-emerald-950 via-slate-950 to-black',
    accentColor: '#d4af37',
    accentText: 'text-amber-300',
    glowShadow: '0 0 45px rgba(212, 175, 55, 0.4)',
    badgeBg: 'bg-emerald-950 border-emerald-500/60 text-emerald-400',
    previewImage: '/themes/table_emerald_vip.jpg',
  },
  crimson: {
    id: 'crimson',
    name: 'Macau Red Velvet',
    badge: 'HIGH ROLLER VIP',
    tagline: 'Deep royal burgundy felt with dark mahogany rail & radiant rose gold accents',
    feltStyle: 'radial-gradient(ellipse at center, #59101d 0%, #30080f 60%, #140205 100%)',
    railStyle: 'linear-gradient(to bottom, #4f1e1a 0%, #2b0c0a 50%, #170403 100%)',
    railBorder: '#8a2b25',
    goldTrim: 'linear-gradient(135deg, #fbcfe8 0%, #f43f5e 50%, #881337 100%)',
    bgGradient: 'from-rose-950 via-slate-950 to-black',
    accentColor: '#f43f5e',
    accentText: 'text-rose-300',
    glowShadow: '0 0 45px rgba(244, 63, 94, 0.45)',
    badgeBg: 'bg-rose-950 border-rose-500/60 text-rose-400',
    previewImage: '/themes/table_maharaja_ruby.jpg',
  },
  maharaja: {
    id: 'maharaja',
    name: 'Royal Maharaja Heritage',
    badge: 'PALACE VIP',
    tagline: 'Deep royal ruby velvet cloth with gold filigree embroidery & carved teak rail',
    feltStyle: 'radial-gradient(ellipse at center, #6b1122 0%, #3d0913 60%, #1a0206 100%)',
    railStyle: 'linear-gradient(to bottom, #4a2810 0%, #291406 50%, #120802 100%)',
    railBorder: '#c68a35',
    goldTrim: 'linear-gradient(135deg, #fef08a 0%, #d4af37 50%, #854d0e 100%)',
    bgGradient: 'from-amber-950 via-rose-950 to-black',
    accentColor: '#d4af37',
    accentText: 'text-amber-300',
    glowShadow: '0 0 50px rgba(212, 175, 55, 0.5)',
    badgeBg: 'bg-amber-950 border-amber-500/60 text-amber-300',
    previewImage: '/themes/table_maharaja_ruby.jpg',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Monaco Royal Sapphire',
    badge: 'RIVIERA YACHT CLUB',
    tagline: 'Deep ocean blue velvet cloth with dark carbon rail & platinum ice highlights',
    feltStyle: 'radial-gradient(ellipse at center, #123b66 0%, #09203a 60%, #030d17 100%)',
    railStyle: 'linear-gradient(to bottom, #1e293b 0%, #0f172a 50%, #020617 100%)',
    railBorder: '#2563eb',
    goldTrim: 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 50%, #0369a1 100%)',
    bgGradient: 'from-sky-950 via-slate-950 to-black',
    accentColor: '#38bdf8',
    accentText: 'text-sky-300',
    glowShadow: '0 0 45px rgba(56, 189, 248, 0.45)',
    badgeBg: 'bg-blue-950 border-blue-500/60 text-blue-400',
  },
  midnight: {
    id: 'midnight',
    name: 'Cyberpunk Neon Velvet',
    badge: 'FUTURISTIC LOUNGE',
    tagline: 'Electric violet felt with neon cyan laser trim & synthwave casino glow',
    feltStyle: 'radial-gradient(ellipse at center, #24143d 0%, #130924 60%, #07030d 100%)',
    railStyle: 'linear-gradient(to bottom, #3b0764 0%, #1e1b4b 50%, #0f172a 100%)',
    railBorder: '#7c3aed',
    goldTrim: 'linear-gradient(135deg, #67e8f9 0%, #c084fc 50%, #06b6d4 100%)',
    bgGradient: 'from-purple-950 via-slate-950 to-black',
    accentColor: '#06b6d4',
    accentText: 'text-cyan-300',
    glowShadow: '0 0 45px rgba(192, 132, 252, 0.5)',
    badgeBg: 'bg-purple-950 border-purple-500/60 text-purple-400',
    previewImage: '/themes/table_cyberpunk_neon.jpg',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Tournament Stealth Obsidian',
    badge: 'WORLD SERIES PRO',
    tagline: 'Matte black carbon texture felt with titanium rail & polished metallic gold',
    feltStyle: 'radial-gradient(ellipse at center, #27272a 0%, #18181b 60%, #09090b 100%)',
    railStyle: 'linear-gradient(to bottom, #3f3f46 0%, #27272a 50%, #18181b 100%)',
    railBorder: '#52525b',
    goldTrim: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #854d0e 100%)',
    bgGradient: 'from-zinc-950 via-black to-black',
    accentColor: '#eab308',
    accentText: 'text-amber-300',
    glowShadow: '0 0 45px rgba(234, 179, 8, 0.4)',
    badgeBg: 'bg-zinc-900 border-zinc-700 text-zinc-300',
  },
};

export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  dealStyle: 'smooth-ribbon',
  ambientGlow: 'vibrant',
  cardLanding: 'perspective-tilt',
  soundPack: 'classic-vegas',
};

export const DEFAULT_SITE_EVENT: SiteEvent = {
  id: 'evt_weekend_championship',
  title: '🏆 Weekend Royal Bhabhi Championship',
  tag: 'LIVE EVENT',
  description: 'Double deck tables are awarding 2X VIP Status Escapes! Join a VIP room to compete.',
  glowColor: 'gold',
  isActive: true,
};
