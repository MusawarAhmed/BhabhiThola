import { NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || urlObj.host;
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const code = urlObj.searchParams.get('code');
  const error = urlObj.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error || 'missing_auth_code')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=missing_google_client_id`);
  }

  try {
    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'token_exchange_failed')}`);
    }

    // 2. Fetch authenticated user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=email_not_provided_by_google`);
    }

    const userId = `google_${profile.sub || profile.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const alias = profile.name || profile.email.split('@')[0];
    const avatarUrl = profile.picture || '/avatars/male_m1.jpg';

    // 3. Persist user in Neon PostgreSQL database
    await ensureTablesExist();

    if (db) {
      try {
        const [existing] = await db
          .select()
          .from(users)
          .where(or(eq(users.id, userId), eq(users.email, profile.email)))
          .limit(1);

        if (existing) {
          await db
            .update(users)
            .set({
              alias: existing.alias || alias,
              avatarUrl: avatarUrl || existing.avatarUrl,
              isVerified: true,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id));
        } else {
          await db.insert(users).values({
            id: userId,
            email: profile.email,
            phone: null,
            alias,
            avatarUrl,
            gender: 'male',
            authProvider: 'google',
            passwordHash: null,
            gamesPlayed: 0,
            gamesWon: 0,
            bhabhiCount: 0,
            guestGamesPlayed: 0,
            isVerified: true,
          });
        }
      } catch (dbErr) {
        console.warn('Neon DB user sync warning:', dbErr);
      }
    }

    // 4. Redirect user back to home with verified profile payload
    const redirectTarget = new URL('/', baseUrl);
    redirectTarget.searchParams.set('auth_success', 'google');
    redirectTarget.searchParams.set('user_id', userId);
    redirectTarget.searchParams.set('email', profile.email);
    redirectTarget.searchParams.set('name', alias);
    if (avatarUrl) redirectTarget.searchParams.set('avatar', avatarUrl);

    return NextResponse.redirect(redirectTarget.toString());
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(err.message || 'unknown_oauth_error')}`);
  }
}
