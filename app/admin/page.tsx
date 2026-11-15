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
} from 'lucide-react';
import {
  ThemeId,
  CasinoTheme,
  AnimationSettings,
  SiteEvent,
  CASINO_THEMES,
  DEFAULT_ANIMATION_SETTINGS,
  DEFAULT_SITE_EVENT,
} from '@/lib/theme/types';
import { useTheme } from '@/lib/theme/theme-context';

export default function AdminDashboardPage() {
  const {
    themeId,
    theme,
    animationSettings,
    activeEvent,
    setThemeId,
    setAnimationSettings,
    setActiveEvent,
    refreshSettings,
  } = useTheme();

  // Admin Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Active Tab
  const [adminTab, setAdminTab] = useState<'themes' | 'animations' | 'events' | 'metrics'>('themes');

  // Local Form States
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(themeId);
  const [animState, setAnimState] = useState<AnimationSettings>(animationSettings);
  const [eventTitle, setEventTitle] = useState(activeEvent?.title || DEFAULT_SITE_EVENT.title);
  const [eventTag, setEventTag] = useState(activeEvent?.tag || DEFAULT_SITE_EVENT.tag);
  const [eventDesc, setEventDesc] = useState(activeEvent?.description || DEFAULT_SITE_EVENT.description);
  const [eventGlow, setEventGlow] = useState(activeEvent?.glowColor || DEFAULT_SITE_EVENT.glowColor);
  const [eventActive, setEventActive] = useState(activeEvent?.isActive ?? true);

  // Metrics
  const [dbStats, setDbStats] = useState({ totalUsers: 0, totalRooms: 0, totalGamesPlayed: 0 });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Check existing session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('bhabhi_admin_authed');
    if (savedAuth === 'true') {
      setIsAdminAuth(true);
    }
  }, []);

  // Sync with global theme
  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

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
          if (d.stats) setDbStats(d.stats);
        })
        .catch(() => {});
    }
  }, [isAdminAuth]);

  // Handle Passkey Verification
  const handleVerifyPasskey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_KEY',
          adminPasskey: passkeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAdminAuth(true);
        sessionStorage.setItem('bhabhi_admin_authed', 'true');
        sessionStorage.setItem('bhabhi_admin_passkey', passkeyInput.trim());
      } else {
        setAuthError(data.error || 'Invalid Admin Passkey');
      }
    } catch {
      setAuthError('Connection error to Admin API');
    } finally {
      setIsVerifying(false);
    }
  };

  const getPasskey = () => sessionStorage.getItem('bhabhi_admin_passkey') || 'admin777';

  // 1. Save Theme Change
  const handleApplyTheme = async (newId: ThemeId) => {
    setSelectedTheme(newId);
    setThemeId(newId);
    setSaveStatus('Applying theme globally...');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getPasskey() },
        body: JSON.stringify({
          action: 'UPDATE_THEME',
          themeId: newId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus(`✓ ${CASINO_THEMES[newId].name} is now ACTIVE globally!`);
        setTimeout(() => setSaveStatus(null), 3500);
      }
    } catch {
      setSaveStatus('Theme saved locally');
    }
  };

  // 2. Save Animation Settings
  const handleSaveAnimations = async () => {
    setAnimationSettings(animState);
    setSaveStatus('Saving animation configuration...');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getPasskey() },
        body: JSON.stringify({
          action: 'UPDATE_ANIMATIONS',
          animationSettings: animState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('✓ Animation settings updated globally!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch {
      setSaveStatus('Animations saved locally');
    }
  };

  // 3. Save Event Announcement
  const handleSaveEvent = async () => {
    const updatedEvent: SiteEvent = {
      id: 'event_' + Date.now(),
      title: eventTitle.trim(),
      tag: eventTag.trim(),
      description: eventDesc.trim(),
      glowColor: eventGlow as any,
      isActive: eventActive,
    };

    setActiveEvent(updatedEvent);
    setSaveStatus('Broadcasting event announcement...');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getPasskey() },
        body: JSON.stringify({
          action: 'UPDATE_EVENT',
          event: updatedEvent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('✓ Live event announcement broadcast to all players!');
        setTimeout(() => setSaveStatus(null), 3500);
      }
    } catch {
      setSaveStatus('Event updated locally');
    }
  };

  // Logout
  const handleLogoutAdmin = () => {
    setIsAdminAuth(false);
    sessionStorage.removeItem('bhabhi_admin_authed');
    sessionStorage.removeItem('bhabhi_admin_passkey');
  };

  // ----------------- LOCKED VIEW: ADMIN PASSKEY LOGIN -----------------
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-black to-black text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border-2 border-casino-gold/50 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-md">
          {/* Corner gold trims */}
          <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-casino-gold/60 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-casino-gold/60 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-casino-gold/60 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-casino-gold/60 rounded-br-xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-casino-gold/15 border border-casino-gold/40 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <Crown className="w-8 h-8 text-casino-gold" />
            </div>
            <h1 className="text-2xl font-serif font-black text-gold-gradient tracking-wide">
              Casino Director Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Master Admin Control: Live Theme Engine, Custom Animations & Event Broadcasts
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-950/80 border border-red-500/70 text-red-200 text-xs text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleVerifyPasskey} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1.5">
                Director Passkey / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter Passkey (Default: admin777)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-casino-gold rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-casino-gold"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !passkeyInput}
              className="w-full py-3 bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldDark text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Control Panel'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setPasskeyInput('admin777');
                }}
                className="text-[11px] text-amber-300/80 hover:text-amber-200 hover:underline"
              >
                Use Quick Default Passkey (admin777)
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-casino-gold flex items-center justify-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Game Lobby</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- UNLOCKED VIEW: ADMIN STUDIO DASHBOARD -----------------
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-[#030712] to-black text-slate-100 flex flex-col justify-between p-3 sm:p-6 md:p-8">
      
      {/* Admin Top Navigation */}
      <header className="flex flex-row justify-between items-center max-w-6xl mx-auto w-full border-b border-casino-gold/30 pb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-casino-gold/15 border border-casino-gold/50 shadow-gold">
            <Crown className="w-6 h-6 text-casino-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-lg sm:text-xl text-gold-gradient tracking-wide">
                Casino Director Studio
              </h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-bold">
                Live Admin Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Dynamic Visual Theme Switcher • Animation Engine • Live Tournament Announcements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-casino-gold/40 text-casino-gold hover:bg-casino-gold/10 text-xs font-semibold transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch Live Table</span>
          </Link>
          <button
            onClick={handleLogoutAdmin}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 text-xs font-semibold transition"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-6xl mx-auto w-full flex-1 my-4 space-y-5">
        
        {/* Save Status Toast */}
        {saveStatus && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-semibold text-center shadow-lg animate-pulse">
            {saveStatus}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 bg-slate-950/70 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setAdminTab('themes')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              adminTab === 'themes'
                ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme Studio (5 Themes)</span>
          </button>
          <button
            onClick={() => setAdminTab('animations')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              adminTab === 'animations'
                ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Animation Engine</span>
          </button>
          <button
            onClick={() => setAdminTab('events')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              adminTab === 'events'
                ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Events & Tournaments</span>
          </button>
          <button
            onClick={() => setAdminTab('metrics')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              adminTab === 'metrics'
                ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Database Metrics</span>
          </button>
        </div>

        {/* ================= TAB 1: THEME STUDIO ================= */}
        {adminTab === 'themes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-black text-white">
                  Select Game Atmosphere & Cloth Theme
                </h2>
                <p className="text-xs text-slate-400">
                  Click any luxury theme to switch the entire application in real time (felt, rails, trim & lighting).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-casino-gold bg-casino-gold/10 border border-casino-gold/30 px-3 py-1 rounded-xl">
                Active: {CASINO_THEMES[selectedTheme].name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(CASINO_THEMES) as ThemeId[]).map((id) => {
                const t = CASINO_THEMES[id];
                const isCurrent = selectedTheme === id;

                return (
                  <div
                    key={id}
                    className={`rounded-2xl border-2 p-4 transition-all duration-300 flex flex-col justify-between relative overflow-hidden bg-slate-900/80 backdrop-blur-md ${
                      isCurrent
                        ? 'border-casino-gold ring-2 ring-casino-gold/50 shadow-[0_0_35px_rgba(212,175,55,0.4)] scale-[1.01]'
                        : 'border-slate-800 hover:border-slate-700 hover:scale-[1.005]'
                    }`}
                  >
                    {/* Theme Swatch Preview Box */}
                    <div className="relative h-32 rounded-xl mb-3 overflow-hidden p-2 flex items-center justify-center border border-white/10 shadow-inner" style={{ background: t.bgGradient }}>
                      {/* Mini Oval Table Felt Swatch */}
                      <div
                        className="w-40 h-24 rounded-[50px] p-2 flex items-center justify-center border shadow-xl transition"
                        style={{
                          background: t.railStyle,
                          borderColor: t.railBorder,
                          boxShadow: t.glowShadow,
                        }}
                      >
                        <div
                          className="w-full h-full rounded-[40px] border flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/90 shadow-inner"
                          style={{
                            background: t.feltStyle,
                            borderImage: t.goldTrim,
                          }}
                        >
                          <span>{t.badge}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-sm text-white">{t.name}</h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${t.badgeBg}`}>
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.tagline}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTheme(id)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow ${
                        isCurrent
                          ? 'bg-emerald-600 text-white font-black cursor-default'
                          : 'bg-slate-800 hover:bg-casino-gold hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-casino-gold'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Theme</span>
                        </>
                      ) : (
                        <span>Activate Globally</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ANIMATION ENGINE ================= */}
        {adminTab === 'animations' && (
          <div className="space-y-5 bg-slate-900/80 p-5 sm:p-6 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-black text-white">
                Card & Table Animation Physics
              </h2>
              <p className="text-xs text-slate-400">
                Tune dealing aerodynamics, ambient table spotlights, and tactile card feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Deal Style */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs uppercase tracking-wider text-casino-gold font-bold block">
                  Card Dealing Velocity & Trajectory
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'casino-pitch', name: 'Casino Pitch (Snappy & Angled)', desc: 'High-speed 0.4s aerodynamic card slide like a Vegas dealer pitch' },
                    { id: 'smooth-ribbon', name: 'Smooth Ribbon (Fluid Deceleration)', desc: 'Classic 0.75s curved cubic-bezier deal with soft feathered stop' },
                    { id: 'tactile-snap', name: 'Tactile Snap (Direct Placement)', desc: 'Instantaneous tactile pop with realistic drop shadow impact' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setAnimState({ ...animState, dealStyle: d.id as any })}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        animState.dealStyle === d.id
                          ? 'border-casino-gold bg-casino-gold/15 text-white'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{d.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Ambient Table Lighting */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs uppercase tracking-wider text-casino-gold font-bold block">
                  Table Ambient Glow & Halo
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'vibrant', name: 'Vibrant High Roller Halo', desc: 'Rich dynamic gold/accent pulse around table rails with ambient spotlight' },
                    { id: 'subtle', name: 'Subtle Traditional Glow', desc: 'Soft warm casino lighting, gentle halo, distraction-free' },
                    { id: 'cinematic', name: 'Cinematic High-Contrast Dark', desc: 'Deep black surround with concentrated spotlight on the active trick cards' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setAnimState({ ...animState, ambientGlow: g.id as any })}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        animState.ambientGlow === g.id
                          ? 'border-casino-gold bg-casino-gold/15 text-white'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{g.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveAnimations}
              className="px-6 py-2.5 bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldDark text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Save & Apply Animation Physics</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: EVENTS & TOURNAMENTS ================= */}
        {adminTab === 'events' && (
          <div className="space-y-5 bg-slate-900/80 p-5 sm:p-6 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-black text-white">
                Live Announcement & Tournament Broadcasts
              </h2>
              <p className="text-xs text-slate-400">
                Display a real-time event ticker at the top of the lobby and table for all connected players.
              </p>
            </div>

            {/* Live Banner Preview Box */}
            <div>
              <label className="text-xs uppercase tracking-wider text-casino-gold font-bold block mb-1.5">
                Live Banner Preview (How players will see it)
              </label>
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-lg ${
                eventGlow === 'rose'
                  ? 'bg-rose-950/80 border-rose-500/70 text-rose-200'
                  : eventGlow === 'emerald'
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200'
                  : eventGlow === 'cyan'
                  ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200'
                  : eventGlow === 'purple'
                  ? 'bg-purple-950/80 border-purple-500/70 text-purple-200'
                  : 'bg-amber-950/80 border-amber-500/70 text-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-black/60 border border-white/20">
                    {eventTag || 'LIVE EVENT'}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">{eventTitle || 'Event Title'}</h4>
                    <p className="text-[11px] opacity-80">{eventDesc || 'Description text'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full animate-ping ${eventActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="text-[10px] uppercase font-bold">{eventActive ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            {/* Event Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1">
                  Event Headline / Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. 🏆 Weekend Royal Bhabhi Championship"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={eventTag}
                  onChange={(e) => setEventTag(e.target.value)}
                  placeholder="e.g. TOURNAMENT, VIP BONUS, DIWALI SPECIAL"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1">
                  Announcement Details / Description
                </label>
                <input
                  type="text"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="e.g. Double Deck tables award 2X VIP status. Play now with 4+ players!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1">
                  Glow Accent Color
                </label>
                <select
                  value={eventGlow}
                  onChange={(e) => setEventGlow(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-casino-gold"
                >
                  <option value="gold">Gold (Royal VIP)</option>
                  <option value="emerald">Emerald (Monte Carlo)</option>
                  <option value="rose">Rose (Macau Crimson)</option>
                  <option value="cyan">Cyan (Monaco Sapphire)</option>
                  <option value="purple">Purple (Cyberpunk Neon)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="text-xs font-semibold text-white">Broadcast Status:</label>
                <button
                  type="button"
                  onClick={() => setEventActive(!eventActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    eventActive
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {eventActive ? '✓ Broadcast ON (Visible to all)' : '✕ Broadcast OFF (Hidden)'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveEvent}
              className="px-6 py-2.5 bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldDark text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-gold hover:opacity-95 transition flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-slate-950" />
              <span>Broadcast Event Globally</span>
            </button>
          </div>
        )}

        {/* ================= TAB 4: DATABASE METRICS ================= */}
        {adminTab === 'metrics' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-black text-white">
                Live Cloud Database Metrics (Neon PostgreSQL)
              </h2>
              <p className="text-xs text-slate-400">
                Real-time usage analytics queryable from your Lakebase Postgres instance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-center">
                <Users className="w-8 h-8 text-casino-gold mx-auto mb-2" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Registered VIP & Guest Players
                </span>
                <span className="text-3xl font-black text-white mt-1 block">
                  {dbStats.totalUsers}
                </span>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-center">
                <Layers className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Total Rooms Hosted
                </span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">
                  {dbStats.totalRooms}
                </span>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-center">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Total Matches Played
                </span>
                <span className="text-3xl font-black text-amber-400 mt-1 block">
                  {dbStats.totalGamesPlayed}
                </span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3 border-t border-slate-900 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span>Bhabhi Thola Master Director Console</span>
        <Link href="/" className="text-casino-gold hover:underline">
          Return to Game &rarr;
        </Link>
      </footer>

    </div>
  );
}
