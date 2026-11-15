'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemeId,
  CasinoTheme,
  AnimationSettings,
  SiteEvent,
  CASINO_THEMES,
  DEFAULT_ANIMATION_SETTINGS,
  DEFAULT_SITE_EVENT,
} from './types';

interface ThemeContextType {
  themeId: ThemeId;
  theme: CasinoTheme;
  animationSettings: AnimationSettings;
  activeEvent: SiteEvent | null;
  setThemeId: (id: ThemeId) => void;
  setAnimationSettings: (settings: AnimationSettings) => void;
  setActiveEvent: (event: SiteEvent | null) => void;
  refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'emerald',
  theme: CASINO_THEMES.emerald,
  animationSettings: DEFAULT_ANIMATION_SETTINGS,
  activeEvent: DEFAULT_SITE_EVENT,
  setThemeId: () => {},
  setAnimationSettings: () => {},
  setActiveEvent: () => {},
  refreshSettings: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>('emerald');
  const [animationSettings, setAnimationSettingsState] = useState<AnimationSettings>(DEFAULT_ANIMATION_SETTINGS);
  const [activeEvent, setActiveEventState] = useState<SiteEvent | null>(DEFAULT_SITE_EVENT);

  // Load local and remote settings on initial mount
  useEffect(() => {
    // 1. Quick local storage read
    try {
      const savedTheme = localStorage.getItem('bhabhi_site_theme') as ThemeId;
      if (savedTheme && CASINO_THEMES[savedTheme]) {
        setThemeIdState(savedTheme);
      }

      const savedAnim = localStorage.getItem('bhabhi_site_animations');
      if (savedAnim) {
        setAnimationSettingsState(JSON.parse(savedAnim));
      }

      const savedEvent = localStorage.getItem('bhabhi_site_event');
      if (savedEvent) {
        setActiveEventState(JSON.parse(savedEvent));
      }
    } catch {}

    // 2. Fetch server-persisted settings from DB
    refreshSettings();
  }, []);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        if (data.themeId && CASINO_THEMES[data.themeId as ThemeId]) {
          setThemeIdState(data.themeId as ThemeId);
          localStorage.setItem('bhabhi_site_theme', data.themeId);
        }
        if (data.animationSettings) {
          setAnimationSettingsState(data.animationSettings);
          localStorage.setItem('bhabhi_site_animations', JSON.stringify(data.animationSettings));
        }
        if (data.activeEvent !== undefined) {
          setActiveEventState(data.activeEvent);
          if (data.activeEvent) {
            localStorage.setItem('bhabhi_site_event', JSON.stringify(data.activeEvent));
          } else {
            localStorage.removeItem('bhabhi_site_event');
          }
        }
      }
    } catch {}
  };

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem('bhabhi_site_theme', id);
  };

  const setAnimationSettings = (settings: AnimationSettings) => {
    setAnimationSettingsState(settings);
    localStorage.setItem('bhabhi_site_animations', JSON.stringify(settings));
  };

  const setActiveEvent = (event: SiteEvent | null) => {
    setActiveEventState(event);
    if (event) {
      localStorage.setItem('bhabhi_site_event', JSON.stringify(event));
    } else {
      localStorage.removeItem('bhabhi_site_event');
    }
  };

  const theme = CASINO_THEMES[themeId] || CASINO_THEMES.emerald;

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme,
        animationSettings,
        activeEvent,
        setThemeId,
        setAnimationSettings,
        setActiveEvent,
        refreshSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
