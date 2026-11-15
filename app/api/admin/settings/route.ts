import { NextResponse } from 'next/server';
import { db, sql, ensureTablesExist } from '@/lib/db';
import { siteSettings, users, rooms, type DbSiteSetting } from '@/lib/db/schema';
import { eq, sql as dSql } from 'drizzle-orm';
import {
  ThemeId,
  DEFAULT_ANIMATION_SETTINGS,
  DEFAULT_SITE_EVENT,
  DEFAULT_CARD_DESIGN,
  DEFAULT_SITE_LANGUAGE,
  CASINO_THEMES,
  CardDesignSettings,
  SiteLanguage,
} from '@/lib/theme/types';

export const dynamic = 'force-dynamic';

const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || 'admin777';

// Server in-memory settings cache
let cachedThemeId: ThemeId = 'emerald';
let cachedAnimationSettings = DEFAULT_ANIMATION_SETTINGS;
let cachedActiveEvent = DEFAULT_SITE_EVENT;
let cachedCardDesign: CardDesignSettings = DEFAULT_CARD_DESIGN;
let cachedLanguage: SiteLanguage = DEFAULT_SITE_LANGUAGE;

export async function GET() {
  try {
    await ensureTablesExist();

    if (db) {
      try {
        const rows = await db.select().from(siteSettings);
        for (const row of rows) {
          if (row.key === 'theme' && row.value && (row.value as any).themeId) {
            cachedThemeId = (row.value as any).themeId;
          }
          if (row.key === 'animations' && row.value) {
            cachedAnimationSettings = row.value as any;
          }
          if (row.key === 'event' && row.value !== undefined) {
            cachedActiveEvent = row.value as any;
          }
          if (row.key === 'card_design' && row.value) {
            cachedCardDesign = row.value as any;
          }
          if (row.key === 'language' && row.value && (row.value as any).language) {
            cachedLanguage = (row.value as any).language;
          }
        }
      } catch (dbErr) {
        console.warn('DB read settings fallback to cache:', dbErr);
      }
    }

    // Quick System Stats
    let totalUsers = 0;
    let totalRooms = 0;
    let totalGamesPlayed = 0;

    if (db) {
      try {
        const [uCount] = await db.select({ count: dSql<number>`count(*)` }).from(users);
        const [rCount] = await db.select({ count: dSql<number>`count(*)` }).from(rooms);
        const [gSum] = await db.select({ sum: dSql<number>`coalesce(sum(games_played), 0)` }).from(users);

        totalUsers = Number(uCount?.count || 0);
        totalRooms = Number(rCount?.count || 0);
        totalGamesPlayed = Number(gSum?.sum || 0);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      themeId: cachedThemeId,
      animationSettings: cachedAnimationSettings,
      activeEvent: cachedActiveEvent,
      cardDesign: cachedCardDesign,
      language: cachedLanguage,
      stats: {
        totalUsers,
        totalRooms,
        totalGamesPlayed,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      themeId: cachedThemeId,
      animationSettings: cachedAnimationSettings,
      activeEvent: cachedActiveEvent,
      cardDesign: cachedCardDesign,
      language: cachedLanguage,
      stats: { totalUsers: 0, totalRooms: 0, totalGamesPlayed: 0 },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const passkey = req.headers.get('x-admin-key') || body.adminPasskey;

    // Verify admin passkey
    if (passkey !== ADMIN_PASSKEY && body.action !== 'VERIFY_KEY') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin Passkey' }, { status: 401 });
    }

    if (body.action === 'VERIFY_KEY') {
      if (passkey === ADMIN_PASSKEY) {
        return NextResponse.json({ success: true, message: 'Admin authenticated' });
      }
      return NextResponse.json({ success: false, error: 'Incorrect Passkey. Use default: admin777' }, { status: 401 });
    }

    await ensureTablesExist();

    // 1. UPDATE THEME
    if (body.action === 'UPDATE_THEME') {
      const newThemeId = body.themeId as ThemeId;
      if (!CASINO_THEMES[newThemeId]) {
        return NextResponse.json({ success: false, error: 'Invalid theme ID' }, { status: 400 });
      }
      cachedThemeId = newThemeId;

      if (db) {
        try {
          await db
            .insert(siteSettings)
            .values({ key: 'theme', value: { themeId: newThemeId }, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: { themeId: newThemeId }, updatedAt: new Date() },
            });
        } catch (dbErr) {
          console.warn('DB save theme error:', dbErr);
        }
      }

      return NextResponse.json({ success: true, themeId: newThemeId });
    }

    // 2. UPDATE ANIMATIONS
    if (body.action === 'UPDATE_ANIMATIONS') {
      const newSettings = body.animationSettings;
      cachedAnimationSettings = newSettings;

      if (db) {
        try {
          await db
            .insert(siteSettings)
            .values({ key: 'animations', value: newSettings, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: newSettings, updatedAt: new Date() },
            });
        } catch (dbErr) {
          console.warn('DB save animations error:', dbErr);
        }
      }

      return NextResponse.json({ success: true, animationSettings: newSettings });
    }

    // 3. UPDATE EVENT BANNER
    if (body.action === 'UPDATE_EVENT') {
      const newEvent = body.event;
      cachedActiveEvent = newEvent;

      if (db) {
        try {
          await db
            .insert(siteSettings)
            .values({ key: 'event', value: newEvent, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: newEvent, updatedAt: new Date() },
            });
        } catch (dbErr) {
          console.warn('DB save event error:', dbErr);
        }
      }

      return NextResponse.json({ success: true, activeEvent: newEvent });
    }

    // 4. UPDATE CARD DESIGN
    if (body.action === 'UPDATE_CARD_DESIGN') {
      const newDesign = body.cardDesign;
      cachedCardDesign = newDesign;

      if (db) {
        try {
          await db
            .insert(siteSettings)
            .values({ key: 'card_design', value: newDesign, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: newDesign, updatedAt: new Date() },
            });
        } catch (dbErr) {
          console.warn('DB save card design error:', dbErr);
        }
      }

      return NextResponse.json({ success: true, cardDesign: newDesign });
    }

    // 5. UPDATE SITE LANGUAGE
    if (body.action === 'UPDATE_LANGUAGE') {
      const newLang = body.language as SiteLanguage;
      cachedLanguage = newLang;

      if (db) {
        try {
          await db
            .insert(siteSettings)
            .values({ key: 'language', value: { language: newLang }, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: { language: newLang }, updatedAt: new Date() },
            });
        } catch (dbErr) {
          console.warn('DB save language error:', dbErr);
        }
      }

      return NextResponse.json({ success: true, language: newLang });
    }

    // 6. UPDATE ALL SETTINGS IN ONE MASTER SAVE (Global Apply)
    if (body.action === 'UPDATE_ALL_SETTINGS') {
      const { themeId, animationSettings, activeEvent, cardDesign, language } = body;

      if (themeId && CASINO_THEMES[themeId as ThemeId]) cachedThemeId = themeId;
      if (animationSettings) cachedAnimationSettings = animationSettings;
      if (activeEvent !== undefined) cachedActiveEvent = activeEvent;
      if (cardDesign) cachedCardDesign = cardDesign;
      if (language) cachedLanguage = language;

      if (db) {
        try {
          const updates = [
            { key: 'theme', value: { themeId: cachedThemeId } },
            { key: 'animations', value: cachedAnimationSettings },
            { key: 'event', value: cachedActiveEvent },
            { key: 'card_design', value: cachedCardDesign },
            { key: 'language', value: { language: cachedLanguage } },
          ];

          for (const item of updates) {
            await db
              .insert(siteSettings)
              .values({ key: item.key, value: item.value, updatedAt: new Date() })
              .onConflictDoUpdate({
                target: siteSettings.key,
                set: { value: item.value, updatedAt: new Date() },
              });
          }
        } catch (dbErr) {
          console.warn('DB batch save error:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        themeId: cachedThemeId,
        animationSettings: cachedAnimationSettings,
        activeEvent: cachedActiveEvent,
        cardDesign: cachedCardDesign,
        language: cachedLanguage,
        message: 'All settings updated and broadcasted globally',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin settings POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
