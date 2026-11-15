'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Lock,
  Palette,
  Play,
  Flame,
  Radio,
  BarChart3,
  Check,
  RefreshCw,
  ArrowLeft,
  Volume2,
  Layers,
  Users,
  Trophy,
  Zap,
  Globe,
  Sliders,
  Eye,
  RotateCw,
} from 'lucide-react';
import {
  ThemeId,
  CasinoTheme,
  AnimationSettings,
  SiteEvent,
  CardDeckStyle,
  CardBackStyle,
  SiteLanguage,
  CardDesignSettings,
  CASINO_THEMES,
  DEFAULT_ANIMATION_SETTINGS,
  DEFAULT_SITE_EVENT,
  DEFAULT_CARD_DESIGN,
  DEFAULT_SITE_LANGUAGE,
} from '@/lib/theme/types';
import { useTheme } from '@/lib/theme/theme-context';
import { CardView, OrnateSuitSvg } from '@/components/CardView';
import { TRANSLATIONS, LANGUAGE_LABELS } from '@/lib/i18n';
import { Card } from '@/lib/types/game';

// Sample dummy cards for the live preview
const DUMMY_PREVIEW_TRICK: Card[] = [
  { id: 'c_as', suit: 'SPADES', rank: 'A', value: 14 },
  { id: 'c_kh', suit: 'HEARTS', rank: 'K', value: 13 },
  { id: 'c_qd', suit: 'DIAMONDS', rank: 'Q', value: 12 },
  { id: 'c_jc', suit: 'CLUBS', rank: 'J', value: 11 },
];

export default function AdminDashboardPage() {
  const {
    themeId,
    theme,
    animationSettings,
    activeEvent,
    cardDesign,
    language,
    setThemeId,
    setAnimationSettings,
    setActiveEvent,
    setCardDesign,
    setLanguage,
  } = useTheme();

  // Admin Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Active Left Settings Tab
  const [activeTab, setActiveTab] = useState<'themes' | 'cards' | 'language' | 'animations' | 'events' | 'metrics'>('themes');

  // Unified Draft Settings States (Synced with Live Preview on the Right)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(themeId);
  const [deckStyle, setDeckStyle] = useState<CardDeckStyle>(cardDesign?.deckStyle || 'vintage-ivory');
  const [backStyle, setBackStyle] = useState<CardBackStyle>(cardDesign?.backStyle || 'vintage-navy-cartouche');
  const [siteLang, setSiteLang] = useState<SiteLanguage>(language || 'en');
  const [animState, setAnimState] = useState<AnimationSettings>(animationSettings);

  // Event Announcement Draft State
  const [eventTitle, setEventTitle] = useState(activeEvent?.title || DEFAULT_SITE_EVENT.title);
  const [eventTag, setEventTag] = useState(activeEvent?.tag || DEFAULT_SITE_EVENT.tag);
  const [eventDesc, setEventDesc] = useState(activeEvent?.description || DEFAULT_SITE_EVENT.description);
  const [eventGlow, setEventGlow] = useState(activeEvent?.glowColor || DEFAULT_SITE_EVENT.glowColor);
  const [eventActive, setEventActive] = useState(activeEvent?.isActive ?? true);

  // Interactive Live Preview States
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [previewDealing, setPreviewDealing] = useState(false);
  const [previewThola, setPreviewThola] = useState(false);

  // Metrics
  const [dbStats, setDbStats] = useState({ totalUsers: 0, totalRooms: 0, totalGamesPlayed: 0 });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Check existing session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('bhabhi_admin_authed');
    if (savedAuth === 'true') {
      setIsAdminAuth(true);
    }
  }, []);

  // Sync draft states when context changes
  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    if (cardDesign) {
      setDeckStyle(cardDesign.deckStyle);
      setBackStyle(cardDesign.backStyle);
    }
  }, [cardDesign]);

  useEffect(() => {
    if (language) {
      setSiteLang(language);
    }
  }, [language]);

  useEffect(() => {
    setAnimState(animationSettings);
  }, [animationSettings]);

  useEffect(() => {
    if (activeEvent) {
      setEventTitle(activeEvent.title);
      setEventTag(activeEvent.tag);
      setEventDesc(activeEvent.description);
      setEventGlow(activeEvent.glowColor);
      setEventActive(activeEvent.isActive);
    }
  }, [activeEvent]);

  // Load server metrics
  useEffect(() => {
    if (isAdminAuth) {
      fetch('/api/admin/settings')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.stats) {
            setDbStats(d.stats);
          }
        })
        .catch(() => {});
    }
  }, [isAdminAuth]);

  // Handle Passkey Login
  const handleVerifyPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': passkeyInput.trim() },
        body: JSON.stringify({ action: 'VERIFY_KEY' }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdminAuth(true);
        sessionStorage.setItem('bhabhi_admin_authed', 'true');
        sessionStorage.setItem('bhabhi_admin_passkey', passkeyInput.trim());
      } else {
        setAuthError(data.error || 'Invalid Admin Passkey. (Default: admin777)');
      }
    } catch (err: any) {
      setAuthError('Connection failed: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const getPasskey = () => {
    return sessionStorage.getItem('bhabhi_admin_passkey') || passkeyInput.trim() || 'admin777';
  };

  // Master Global Save
  const handleSaveAllGlobally = async () => {
    setIsSavingAll(true);
    setSaveStatus(null);

    const payload = {
      action: 'UPDATE_ALL_SETTINGS',
      adminPasskey: getPasskey(),
      themeId: selectedTheme,
      cardDesign: {
        deckStyle,
        backStyle,
        cornerRankSize: 'normal',
        courtArtStyle: 'vintage-illustrated',
      },
      language: siteLang,
      animationSettings: animState,
      activeEvent: {
        id: 'event_' + Date.now(),
        title: eventTitle.trim(),
        tag: eventTag.trim(),
        description: eventDesc.trim(),
        glowColor: eventGlow,
        isActive: eventActive,
        linkText: 'JOIN TABLE',
      },
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': getPasskey(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setThemeId(selectedTheme);
        setCardDesign(payload.cardDesign as CardDesignSettings);
        setLanguage(siteLang);
        setAnimationSettings(animState);
        setActiveEvent(payload.activeEvent as SiteEvent);

        setSaveStatus('SUCCESS: All settings synchronized & broadcasted to Neon DB & all live players!');
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus('ERROR: ' + (data.error || 'Failed to save settings'));
      }
    } catch (err: any) {
      setSaveStatus('ERROR: ' + err.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  // Sound test
  const playSoundTest = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  };

  const currentPreviewTheme = CASINO_THEMES[selectedTheme] || CASINO_THEMES.emerald;
  const currentPreviewT = TRANSLATIONS[siteLang] || TRANSLATIONS.en;

  // ----------------- LOCKED VIEW IF NOT AUTHENTICATED -----------------
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-zinc-950 to-black text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border-2 border-casino-gold/50 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center shadow-gold mb-3">
              <Lock className="w-7 h-7 text-slate-950" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gold-gradient">
              Casino Director Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to Game Administrator. Enter master passkey to unlock.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleVerifyPasskey} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-casino-gold mb-1.5">
                Master Admin Passkey
              </label>
              <input
                type="password"
                placeholder="Enter passkey (default: admin777)"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full bg-black/60 border border-slate-700 focus:border-casino-gold rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-casino-gold/50 font-mono tracking-widest transition"
                autoFocus
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standard default passkey: <code className="text-amber-400">admin777</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !passkeyInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold uppercase tracking-wider rounded-xl text-xs shadow-gold transition disabled:opacity-50"
            >
              {isVerifying ? 'Verifying Passkey...' : 'Unlock Director Studio'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-casino-gold transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Casino Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- 2-COLUMN MASTER DASHBOARD -----------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-zinc-950 to-black text-slate-100 flex flex-col p-3 sm:p-5 md:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-[1600px] mx-auto w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-casino-gold/25 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-casino-goldDark to-casino-gold flex items-center justify-center shadow-gold">
            <Crown className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-black text-gold-gradient tracking-wide">
                Casino Director Studio
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 uppercase font-semibold">
                Live Admin Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Settings & Theme Control (Left) • Live Master Game Stage Simulation (Right)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Quick Apply Button */}
          <button
            onClick={handleSaveAllGlobally}
            disabled={isSavingAll}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-gold transition"
          >
            {isSavingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-slate-950" />}
            <span>Save & Apply Globally</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Launch Game</span>
          </Link>

          <button
            onClick={() => {
              sessionStorage.removeItem('bhabhi_admin_authed');
              sessionStorage.removeItem('bhabhi_admin_passkey');
              setIsAdminAuth(false);
            }}
            className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 text-red-200 rounded-xl text-xs font-semibold transition"
            title="Lock Studio"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Global Status Banner */}
      {saveStatus && (
        <div
          className={`max-w-[1600px] mx-auto w-full mb-4 p-3 rounded-xl border text-xs font-bold text-center transition animate-fadeIn ${
            saveStatus.startsWith('SUCCESS')
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
              : 'bg-red-950/90 border-red-500 text-red-200'
          }`}
        >
          {saveStatus}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2-COLUMN MASTER LAYOUT: LEFT = SETTINGS TABS | RIGHT = LIVE PREVIEW STAGE */}
      {/* ========================================================================= */}
      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================== LEFT COLUMN: SETTINGS ======================== */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          {/* Top Selection Tab Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 mb-4 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {[
              { id: 'themes', label: 'Cloth & Themes', icon: Palette },
              { id: 'cards', label: 'Luxury Card Decks', icon: Layers },
              { id: 'language', label: 'Global Language', icon: Globe },
              { id: 'animations', label: 'Physics & SFX', icon: Zap },
              { id: 'events', label: 'Broadcast Events', icon: Radio },
              { id: 'metrics', label: 'DB Metrics', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-gold'
                      : 'bg-black/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* INNER SETTINGS PANELS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            {/* 1. CLOTH & FELT THEMES */}
            {activeTab === 'themes' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-casino-gold" />
                    Casino Atmosphere & Felt Cloth Theme
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select your luxury casino baize. The live simulation on the right reflects your choice instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(CASINO_THEMES) as ThemeId[]).map((tId) => {
                    const item = CASINO_THEMES[tId];
                    const isSelected = selectedTheme === tId;

                    return (
                      <div
                        key={tId}
                        onClick={() => setSelectedTheme(tId)}
                        className={`cursor-pointer rounded-2xl p-3 border-2 transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'border-casino-gold bg-amber-500/10 shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.01]'
                            : 'border-slate-800 bg-black/40 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          {/* Mini Oval Table Felt Swatch */}
                          <div
                            className="w-full h-16 rounded-[45px] p-1.5 flex items-center justify-center mb-2.5 shadow-md border"
                            style={{
                              background: item.railStyle,
                              borderColor: item.railBorder,
                            }}
                          >
                            <div
                              className="w-full h-full rounded-[40px] flex items-center justify-center shadow-inner border border-black/40"
                              style={{
                                background: item.feltStyle,
                              }}
                            >
                              <span className="text-[9px] font-bold tracking-wider uppercase text-white/90">
                                {item.badge}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                            {isSelected && <Check className="w-4 h-4 text-casino-gold" />}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {item.tagline}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTheme(tId);
                          }}
                          className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition uppercase tracking-wider ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ Active Theme' : 'Select Atmosphere'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. LUXURY CARD DECKS (DIRECT MATCH TO USER REFERENCE IMAGES 3, 4, 5) */}
            {activeTab === 'cards' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-casino-gold" />
                    Luxury Card Decks (From Reference Images 3, 4, 5)
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-end authentic illustrated court faces and baroque card backs. Zero AI-generated look; pure vector geometry.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'noir-gold' as CardDeckStyle,
                      backId: 'noir-art-deco' as CardBackStyle,
                      title: 'Art Deco Noir Gold & Velvet',
                      reference: 'Uploaded Reference Sheet',
                      badge: 'AUTHENTIC SLICED DECK',
                      desc: 'Matte obsidian slate card faces with metallic gold foil Spades, crimson Hearts/Diamonds, crisp silver Clubs, and authentic Art Deco geometric labyrinth gold back.',
                      sampleCards: [
                        { id: 'ng_a', suit: 'SPADES', rank: 'A', value: 14 },
                        { id: 'ng_k', suit: 'HEARTS', rank: 'K', value: 13 },
                        { id: 'ng_7', suit: 'CLUBS', rank: '7', value: 7 },
                      ] as Card[],
                    },
                    {
                      id: 'vintage-ivory' as CardDeckStyle,
                      backId: 'vintage-navy-cartouche' as CardBackStyle,
                      title: 'Antique Victorian Parchment',
                      reference: 'Reference Image 4',
                      badge: 'VICTORIAN DAMASK',
                      desc: 'Aged ivory cream parchment with dark Victorian ink & blood-ruby damask lace. Classic colored woodcut royalty.',
                      sampleCards: [
                        { id: 'd1_a', suit: 'SPADES', rank: 'A', value: 14 },
                        { id: 'd1_k', suit: 'HEARTS', rank: 'K', value: 13 },
                        { id: 'd1_7', suit: 'DIAMONDS', rank: '7', value: 7 },
                      ] as Card[],
                    },
                    {
                      id: 'midnight-sapphire' as CardDeckStyle,
                      backId: 'sapphire-baroque' as CardBackStyle,
                      title: 'Midnight Royal Sapphire',
                      reference: 'Reference Image 3',
                      badge: 'GOLD FILIGREE',
                      desc: 'Deep midnight navy card surface with double gold wire frames, gold filigree pips, and crimson velvet gems.',
                      sampleCards: [
                        { id: 'd2_a', suit: 'SPADES', rank: 'A', value: 14 },
                        { id: 'd2_k', suit: 'HEARTS', rank: 'K', value: 13 },
                        { id: 'd2_7', suit: 'DIAMONDS', rank: '7', value: 7 },
                      ] as Card[],
                    },
                    {
                      id: 'obsidian-gold' as CardDeckStyle,
                      backId: 'obsidian-mandala' as CardBackStyle,
                      title: 'Stealth Obsidian Gold Foil',
                      reference: 'Reference Image 5',
                      badge: 'METALLIC GOLD',
                      desc: 'Matte black carbon finish with metallic gold foil hairline borders and ruby gem faceted suits.',
                      sampleCards: [
                        { id: 'd3_a', suit: 'SPADES', rank: 'A', value: 14 },
                        { id: 'd3_k', suit: 'HEARTS', rank: 'K', value: 13 },
                        { id: 'd3_7', suit: 'DIAMONDS', rank: '7', value: 7 },
                      ] as Card[],
                    },
                    {
                      id: 'classic-bicycle' as CardDeckStyle,
                      backId: 'lattice-pattern' as CardBackStyle,
                      title: 'Classic Vegas Bicycle Linen',
                      reference: 'Traditional Casino Standard',
                      badge: 'VEGAS LINEN',
                      desc: 'Crisp white casino linen card stock, bold red & black pips, authentic illustrated court royalty, Bavarian lattice back.',
                      sampleCards: [
                        { id: 'd4_a', suit: 'SPADES', rank: 'A', value: 14 },
                        { id: 'd4_k', suit: 'HEARTS', rank: 'K', value: 13 },
                        { id: 'd4_7', suit: 'DIAMONDS', rank: '7', value: 7 },
                      ] as Card[],
                    },
                  ].map((deck) => {
                    const isSelected = deckStyle === deck.id;

                    return (
                      <div
                        key={deck.id}
                        onClick={() => {
                          setDeckStyle(deck.id);
                          setBackStyle(deck.backId);
                        }}
                        className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-casino-gold bg-amber-500/10 shadow-[0_0_22px_rgba(212,175,55,0.35)] scale-[1.01]'
                            : 'border-slate-800 bg-black/50 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <h4 className="text-sm font-bold text-white">{deck.title}</h4>
                              <span className="text-[10px] text-amber-400 font-semibold">{deck.reference}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-casino-gold shrink-0" />}
                          </div>

                          {/* Visual Sample Card Swatches directly inside option */}
                          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-black/60 border border-slate-800/80 my-3">
                            {deck.sampleCards.map((c) => (
                              <CardView
                                key={c.id}
                                card={c}
                                size="sm"
                                overrideDeckStyle={deck.id}
                                className="pointer-events-none scale-90"
                              />
                            ))}
                            {/* Card Back Swatch */}
                            <CardView
                              size="sm"
                              isFaceDown={true}
                              overrideBackStyle={deck.backId}
                              className="pointer-events-none scale-90"
                            />
                          </div>

                          <span className="inline-block text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-black text-amber-400 border border-amber-500/30 mb-2">
                            {deck.badge}
                          </span>
                          <p className="text-[11px] text-slate-300 leading-snug mb-3">
                            {deck.desc}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeckStyle(deck.id);
                            setBackStyle(deck.backId);
                          }}
                          className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition uppercase tracking-wider ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 font-black shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ACTIVE CARD DECK' : 'Select Deck'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. GLOBAL LANGUAGE */}
            {activeTab === 'language' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-casino-gold" />
                    Global Site Language & Localization
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch site-wide language across all tables, thola hit alerts, deal buttons, and lobby navigation.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(LANGUAGE_LABELS) as SiteLanguage[]).map((langKey) => {
                    const item = LANGUAGE_LABELS[langKey];
                    const isSelected = siteLang === langKey;

                    return (
                      <div
                        key={langKey}
                        onClick={() => setSiteLang(langKey)}
                        className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                          isSelected
                            ? 'border-casino-gold bg-amber-500/15 shadow-[0_0_18px_rgba(212,175,55,0.3)] scale-[1.02]'
                            : 'border-slate-800 bg-black/40 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <span className="text-2xl mb-1 block">{item.flag}</span>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <p className="text-[11px] font-serif text-amber-300 font-semibold mt-0.5">{item.nativeName}</p>
                        <span
                          className={`inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. ANIMATION PHYSICS & SFX */}
            {activeTab === 'animations' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-casino-gold" />
                    Card Physics & Audio Feedback
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure dealing aerodynamics, table ambient spotlights, and card snap audio.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Dealing Velocity */}
                  <div>
                    <label className="block text-xs uppercase font-semibold text-casino-gold mb-2">
                      Card Dealing Velocity
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'smooth-ribbon', label: 'Smooth Ribbon', sub: '0.75s curved cubic-bezier deal' },
                        { id: 'casino-pitch', label: 'Casino Pitch', sub: '0.4s aerodynamic card slide' },
                        { id: 'tactile-snap', label: 'Tactile Snap', sub: 'Instant snap with realistic shadow' },
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setAnimState({ ...animState, dealStyle: opt.id as any })}
                          className={`cursor-pointer p-3 rounded-xl border text-xs transition ${
                            animState.dealStyle === opt.id
                              ? 'border-casino-gold bg-amber-500/10 text-white font-bold'
                              : 'border-slate-800 bg-black/40 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span>{opt.label}</span>
                            {animState.dealStyle === opt.id && <Check className="w-3.5 h-3.5 text-casino-gold" />}
                          </div>
                          <p className="text-[10px] text-slate-400">{opt.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ambient Spotlight */}
                  <div>
                    <label className="block text-xs uppercase font-semibold text-casino-gold mb-2">
                      Table Ambient Glow & Halo
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'vibrant', label: 'Vibrant Halo', sub: 'Warm ambient glow with pulse aura' },
                        { id: 'subtle', label: 'Subtle Traditional', sub: 'Gentle halo, distraction-free' },
                        { id: 'cinematic', label: 'Cinematic Contrast', sub: 'Concentrated studio spotlight' },
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setAnimState({ ...animState, ambientGlow: opt.id as any })}
                          className={`cursor-pointer p-3 rounded-xl border text-xs transition ${
                            animState.ambientGlow === opt.id
                              ? 'border-casino-gold bg-amber-500/10 text-white font-bold'
                              : 'border-slate-800 bg-black/40 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span>{opt.label}</span>
                            {animState.ambientGlow === opt.id && <Check className="w-3.5 h-3.5 text-casino-gold" />}
                          </div>
                          <p className="text-[10px] text-slate-400">{opt.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audio Pack */}
                  <div>
                    <label className="block text-xs uppercase font-semibold text-casino-gold mb-2">
                      Audio & Sound FX
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'classic-vegas', label: 'Classic Vegas Felt Click', sub: 'Realistic card slide & chip snaps' },
                        { id: 'minimal-bell', label: 'Minimal Chime', sub: 'Soft acoustic bell on turn' },
                        { id: 'muted', label: 'Completely Muted', sub: 'Zero sound effects' },
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setAnimState({ ...animState, soundPack: opt.id as any });
                            if (opt.id !== 'muted') playSoundTest();
                          }}
                          className={`cursor-pointer p-3 rounded-xl border text-xs transition ${
                            animState.soundPack === opt.id
                              ? 'border-casino-gold bg-amber-500/10 text-white font-bold'
                              : 'border-slate-800 bg-black/40 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span>{opt.label}</span>
                            {animState.soundPack === opt.id && <Check className="w-3.5 h-3.5 text-casino-gold" />}
                          </div>
                          <p className="text-[10px] text-slate-400">{opt.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. BROADCAST EVENTS */}
            {activeTab === 'events' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-casino-gold" />
                    Tournament & Announcement Broadcasts
                  </h3>
                  <p className="text-xs text-slate-400">
                    Broadcast ticker announcements across Lobby and Table in real time.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-casino-gold mb-1">Event Headline</label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="e.g. 🏆 Weekend Royal Bhabhi Championship"
                        className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-casino-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-casino-gold mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={eventTag}
                        onChange={(e) => setEventTag(e.target.value)}
                        placeholder="e.g. TOURNAMENT, LIVE EVENT"
                        className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-casino-gold uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-casino-gold mb-1">Details & Description</label>
                    <input
                      type="text"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder="e.g. Double deck tables are awarding 2X VIP Status Escapes! Join a VIP room to compete."
                      className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-casino-gold"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400">Broadcast Status:</span>
                    <button
                      type="button"
                      onClick={() => setEventActive((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        eventActive
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {eventActive ? '✓ Broadcast ON (Visible to all)' : '✕ Broadcast OFF (Hidden)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. DATABASE METRICS */}
            {activeTab === 'metrics' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-casino-gold" />
                    Cloud Database Metrics (Neon PostgreSQL)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live usage metrics from your serverless PostgreSQL database.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 text-center">
                    <Users className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                    <div className="text-2xl font-black text-white font-mono">{dbStats.totalUsers}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Players</div>
                  </div>
                  <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 text-center">
                    <Layers className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-2xl font-black text-white font-mono">{dbStats.totalRooms}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Rooms Hosted</div>
                  </div>
                  <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 text-center">
                    <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1.5" />
                    <div className="text-2xl font-black text-white font-mono">{dbStats.totalGamesPlayed}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Matches Finished</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================== RIGHT COLUMN: LIVE PREVIEW BOX ======================== */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col lg:sticky lg:top-5">
          <div className="bg-slate-900/90 border-2 border-casino-gold/60 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-md">
            {/* Header of Preview Box */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-xs font-bold text-gold-gradient uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-casino-gold" />
                  Live Simulation Stage
                </h3>
              </div>

              {/* Sandbox Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewFlipped((prev) => !prev)}
                  className="px-2 py-1 rounded bg-black/60 border border-slate-700 hover:border-casino-gold text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                  title="Flip between face-up and card back pattern"
                >
                  <RotateCw className="w-3 h-3 text-casino-gold" />
                  <span>{previewFlipped ? 'Face' : 'Back'}</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewDealing(true);
                    playSoundTest();
                    setTimeout(() => setPreviewDealing(false), 800);
                  }}
                  className="px-2 py-1 rounded bg-black/60 border border-slate-700 hover:border-casino-gold text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                  title="Deal animation"
                >
                  <Play className="w-3 h-3 text-emerald-400 fill-current" />
                  <span>Deal</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewThola(true);
                    setTimeout(() => setPreviewThola(false), 2000);
                  }}
                  className="px-2 py-1 rounded bg-red-950/60 border border-red-700/60 hover:border-red-500 text-red-200 text-[10px] font-semibold flex items-center gap-1"
                  title="Thola banner"
                >
                  <Flame className="w-3 h-3 text-red-400 fill-current" />
                  <span>Thola</span>
                </button>
                <button
                  onClick={playSoundTest}
                  className="px-2 py-1 rounded bg-black/60 border border-slate-700 hover:border-casino-gold text-slate-300 text-[10px] font-semibold"
                  title="Sound test"
                >
                  <Volume2 className="w-3 h-3 text-amber-400" />
                </button>
              </div>
            </div>

            {/* STAGE CONTAINER (MATCHING GAMETABLE 100%) */}
            <div
              className={`w-full rounded-2xl p-3 relative overflow-hidden transition-all duration-500 border border-slate-800 bg-gradient-to-b ${currentPreviewTheme.bgGradient}`}
            >
              {/* Event Announcement Ticker Banner */}
              {eventActive && (
                <div className="w-full mb-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/50 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] text-amber-200 shadow backdrop-blur">
                  <div className="flex items-center gap-1.5 overflow-hidden truncate">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="font-mono text-[8px] uppercase font-black px-1 rounded bg-amber-400 text-slate-950">
                      {eventTag || 'EVENT'}
                    </span>
                    <span className="font-bold truncate">{eventTitle}</span>
                  </div>
                </div>
              )}

              {/* Thola Alert Banner */}
              {previewThola && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-900 to-amber-900 border border-amber-300 text-white font-serif px-4 py-1.5 rounded-xl shadow-gold flex items-center gap-2 animate-bounce">
                  <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span className="font-bold text-[11px] uppercase tracking-wider">{currentPreviewT.tholaHit}</span>
                </div>
              )}

              {/* THE POKER TABLE OVAL (IDENTICAL PROPORTIONS TO GAMETABLE) */}
              <div className="relative w-full h-[220px] sm:h-[240px] mx-auto flex items-center justify-center my-2">
                {/* Outer Rail */}
                <div
                  className="w-full h-full rounded-[140px] sm:rounded-[180px] p-2 relative flex items-center justify-center transition-all duration-500 shadow-2xl"
                  style={{
                    background: currentPreviewTheme.railStyle,
                    borderColor: currentPreviewTheme.railBorder,
                    boxShadow: animState.ambientGlow === 'cinematic' ? currentPreviewTheme.glowShadow : '0 10px 30px rgba(0,0,0,0.85)',
                    borderWidth: '2px',
                  }}
                >
                  {/* Inner Gold Rim */}
                  <div
                    className="w-full h-full rounded-[130px] sm:rounded-[170px] p-1.5 shadow-inner flex items-center justify-center transition-all duration-500"
                    style={{
                      background: currentPreviewTheme.goldTrim,
                    }}
                  >
                    {/* Casino Felt */}
                    <div
                      className="w-full h-full rounded-[122px] sm:rounded-[162px] relative flex items-center justify-center overflow-hidden border border-black/40 shadow-[inset_0_0_40px_rgba(0,0,0,0.7)] transition-all duration-500"
                      style={{
                        background: currentPreviewTheme.feltStyle,
                      }}
                    >
                      {/* Watermark Ring */}
                      <div
                        className="absolute inset-3 rounded-[105px] sm:rounded-[145px] border pointer-events-none transition-colors duration-500"
                        style={{ borderColor: `${currentPreviewTheme.accentColor}33` }}
                      />

                      {/* CENTER CARDS DEALT WITH SELECTED DECK STYLE */}
                      <div className="relative flex flex-col items-center justify-center z-10">
                        <div
                          className={`flex items-center justify-center -space-x-2.5 transition-transform duration-300 ${
                            previewDealing ? 'scale-110 -translate-y-2' : ''
                          }`}
                        >
                          {DUMMY_PREVIEW_TRICK.map((card, idx) => (
                            <div
                              key={card.id}
                              className="flex flex-col items-center group transition-all duration-300"
                              style={{
                                transform: `rotate(${(idx - 1.5) * 6}deg)`,
                                zIndex: idx + 1,
                              }}
                            >
                              <CardView
                                card={card}
                                size="sm"
                                isFaceDown={previewFlipped}
                                overrideDeckStyle={deckStyle}
                                overrideBackStyle={backStyle}
                                className="shadow-lg"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Pot Discard Badge */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8a6813] via-[#f5d77f] to-[#aa8620] p-0.5 shadow-md flex items-center justify-center mt-1">
                          <div className="w-full h-full rounded-full bg-[#0a1e16] flex items-center justify-center text-casino-gold font-bold font-serif text-[10px]">
                            18
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Players around table */}
                  {/* Top */}
                  <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-casino-gold/50 shadow text-[9px] text-amber-300 font-semibold z-20">
                    <img src="/avatars/male_m1.jpg" alt="Avatar" className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>Ahmed (15)</span>
                  </div>
                  {/* Left */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-[-8px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-emerald-500/50 shadow text-[9px] text-emerald-300 font-semibold z-20">
                    <img src="/avatars/female_f2.jpg" alt="Avatar" className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>Zara</span>
                    <span className="text-[7px] bg-emerald-500/20 px-1 rounded text-emerald-400">SAFE</span>
                  </div>
                  {/* Right */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-[-8px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 shadow text-[9px] text-slate-300 font-semibold z-20">
                    <img src="/avatars/male_m3.jpg" alt="Avatar" className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>Bot (8)</span>
                  </div>
                  {/* Bottom (Self) */}
                  <div className="absolute bottom-[-14px] left-[15%] flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] text-[10px] text-amber-200 font-bold z-20">
                    <img src="/avatars/male_m2.jpg" alt="Avatar" className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-amber-400" />
                    <span>{currentPreviewT.yourTurn}</span>
                  </div>
                </div>
              </div>

              {/* Localized Bottom Action Bar in Preview */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span>{LANGUAGE_LABELS[siteLang]?.flag}</span>
                  <span className="font-bold text-amber-300">{LANGUAGE_LABELS[siteLang]?.name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">{currentPreviewTheme.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                    {currentPreviewT.dealCards}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {currentPreviewT.sortHand}
                  </span>
                </div>
              </div>
            </div>

            {/* Save & Apply Globally inside Preview Box */}
            <button
              onClick={handleSaveAllGlobally}
              disabled={isSavingAll}
              className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider shadow-gold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSavingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing to Neon Database...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Save & Broadcast Settings Globally</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto w-full pt-8 pb-4 text-center text-xs text-slate-500 border-t border-slate-900 mt-8">
        Bhabhi Thola Master Director Console • Next.js App Router • Vercel Serverless • Neon Lakebase PostgreSQL
      </footer>
    </div>
  );
}
