'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Check,
  X,
  Phone,
  User,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Trophy,
  AlertTriangle,
  LogOut,
  Mail,
  Lock,
  BarChart3,
  Flame,
  Dice5,
} from 'lucide-react';

export interface UserProfile {
  id?: string;
  alias: string;
  avatarUrl: string;
  gender: 'male' | 'female';
  authProvider: 'guest' | 'google' | 'phone' | 'email';
  identifier?: string;
  email?: string;
  phone?: string;
  gamesPlayed?: number;
  gamesWon?: number;
  bhabhiCount?: number;
  guestGamesPlayed?: number;
  hasPassword?: boolean;
}

const MALE_AVATARS = [
  '/avatars/male_m1.jpg',
  '/avatars/male_m2.jpg',
  '/avatars/male_m3.jpg',
  '/avatars/male_m4.jpg',
  '/avatars/male_m5.jpg',
  '/avatars/male_m6.jpg',
  '/avatars/male_m7.jpg',
  '/avatars/male_m8.jpg',
];

const FEMALE_AVATARS = [
  '/avatars/female_f1.jpg',
  '/avatars/female_f2.jpg',
  '/avatars/female_f3.jpg',
  '/avatars/female_f4.jpg',
  '/avatars/female_f5.jpg',
  '/avatars/female_f6.jpg',
  '/avatars/female_f7.jpg',
  '/avatars/female_f8.jpg',
];

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  currentProfile?: Partial<UserProfile>;
  forceAuthMode?: boolean; // When guest limit reached
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  currentProfile,
  forceAuthMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'auth' | 'stats'>('profile');
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/male_m1.jpg');
  const [authMethod, setAuthMethod] = useState<'guest' | 'google' | 'phone' | 'email'>('guest');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [bhabhiCount, setBhabhiCount] = useState(0);
  const [guestGamesPlayed, setGuestGamesPlayed] = useState(0);
  const [hasPassword, setHasPassword] = useState(false);

  // Authentication form states
  const [phoneInput, setPhoneInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [showGoogleSetupGuide, setShowGoogleSetupGuide] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a random unique guest name
  const generateRandomGuest = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newAlias = `Guest-${randomNum}`;
    setAlias(newAlias);
    const randGender = Math.random() > 0.5 ? 'male' : 'female';
    setGender(randGender);
    const avatars = randGender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;
    setSelectedAvatar(avatars[Math.floor(Math.random() * avatars.length)]);
  };

  // Sync profile data on open
  useEffect(() => {
    if (!isOpen) return;

    if (forceAuthMode) {
      setActiveTab('auth');
    }

    const stored = localStorage.getItem('bhabhi_user_profile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserProfile;
        setUserId(parsed.id || '');
        setAlias(parsed.alias || '');
        setGender(parsed.gender || 'male');
        setSelectedAvatar(parsed.avatarUrl || MALE_AVATARS[0]);
        setAuthMethod(parsed.authProvider || 'guest');
        setEmail(parsed.email || (parsed.authProvider === 'google' ? parsed.identifier || '' : ''));
        setPhone(parsed.phone || (parsed.authProvider === 'phone' ? parsed.identifier || '' : ''));
        setGamesPlayed(parsed.gamesPlayed || 0);
        setGamesWon(parsed.gamesWon || 0);
        setBhabhiCount(parsed.bhabhiCount || 0);
        setGuestGamesPlayed(parsed.guestGamesPlayed || 0);
        setHasPassword(Boolean(parsed.hasPassword));

        // Fetch latest stats from DB if userId exists
        if (parsed.id) {
          fetch(`/api/auth?userId=${encodeURIComponent(parsed.id)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.user) {
                const u = data.user;
                setGamesPlayed(u.gamesPlayed || 0);
                setGamesWon(u.gamesWon || 0);
                setBhabhiCount(u.bhabhiCount || 0);
                setGuestGamesPlayed(u.guestGamesPlayed || 0);
                setHasPassword(Boolean(u.passwordHash));
              }
            })
            .catch(() => {});
        }
      } catch {}
    } else {
      // First visit: initialize with a random unique Guest-XXXXXX name
      generateRandomGuest();
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      setUserId(guestId);
      setAuthMethod('guest');
    }
  }, [isOpen, forceAuthMode]);

  if (!isOpen) return null;

  const currentAvatars = gender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  const handleGenderSwitch = (newGender: 'male' | 'female') => {
    setGender(newGender);
    const newSet = newGender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;
    if (!newSet.includes(selectedAvatar)) {
      setSelectedAvatar(newSet[0]);
    }
  };

  // 1. Google Sign-In Flow
  const handleGoogleSignInClick = async (customEmail?: string) => {
    setIsLoading(true);
    setStatusMessage(null);

    const emailToUse = customEmail || googleEmailInput.trim() || `${alias.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player'}@gmail.com`;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GOOGLE_SIGN_IN',
          email: emailToUse,
          name: alias.startsWith('Guest-') ? emailToUse.split('@')[0] : alias,
          avatarUrl: selectedAvatar,
          gender,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const updated: UserProfile = {
          id: u.id,
          alias: u.alias,
          avatarUrl: u.avatarUrl,
          gender: u.gender as 'male' | 'female',
          authProvider: 'google',
          email: u.email,
          identifier: u.email,
          gamesPlayed: u.gamesPlayed,
          gamesWon: u.gamesWon,
          bhabhiCount: u.bhabhiCount,
          guestGamesPlayed: 0,
          hasPassword: Boolean(u.passwordHash),
        };

        localStorage.setItem('bhabhi_user_profile', JSON.stringify(updated));
        setUserId(u.id);
        setAlias(u.alias);
        setAuthMethod('google');
        setEmail(u.email);
        setShowGooglePrompt(false);
        setStatusMessage({ text: `✓ Signed in successfully with Google (${u.email})!`, type: 'success' });
        onProfileUpdated(updated);
      } else {
        setStatusMessage({ text: data.error || 'Failed to sign in with Google', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error connecting to Google Auth API', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Phone OTP Request Flow
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setStatusMessage({ text: 'Please enter a valid phone number', type: 'error' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PHONE_SEND_OTP',
          phone: phoneInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPhoneOtp(true);
        setDemoOtpHint(data.demoOtp || '1234');
        setStatusMessage({ text: `SMS code sent to ${phoneInput}! (Use code: ${data.demoOtp || '1234'})`, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || 'Failed to send SMS code', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error sending SMS code', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Phone OTP Confirmation Flow
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PHONE_VERIFY_OTP',
          phone: phoneInput.trim(),
          code: verificationCode.trim(),
          alias: alias.startsWith('Guest-') ? `VIP_${phoneInput.slice(-4)}` : alias,
          avatarUrl: selectedAvatar,
          gender,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const updated: UserProfile = {
          id: u.id,
          alias: u.alias,
          avatarUrl: u.avatarUrl,
          gender: u.gender as 'male' | 'female',
          authProvider: 'phone',
          phone: u.phone,
          identifier: u.phone,
          gamesPlayed: u.gamesPlayed,
          gamesWon: u.gamesWon,
          bhabhiCount: u.bhabhiCount,
          guestGamesPlayed: 0,
          hasPassword: Boolean(u.passwordHash),
        };

        localStorage.setItem('bhabhi_user_profile', JSON.stringify(updated));
        setUserId(u.id);
        setAlias(u.alias);
        setAuthMethod('phone');
        setPhone(u.phone);
        setShowPhoneOtp(false);
        setStatusMessage({ text: `✓ Phone verified successfully (${u.phone})!`, type: 'success' });
        onProfileUpdated(updated);
      } else {
        setStatusMessage({ text: data.error || 'Invalid verification code', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error verifying phone OTP', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Save Password Flow
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setStatusMessage({ text: 'Password must be at least 4 characters long', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_PASSWORD',
          userId: userId || 'user_' + Math.random().toString(36).substring(2, 9),
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHasPassword(true);
        setNewPassword('');
        setConfirmPassword('');
        setStatusMessage({ text: '✓ Password set successfully! You can now log in from any device.', type: 'success' });

        const stored = localStorage.getItem('bhabhi_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.hasPassword = true;
          localStorage.setItem('bhabhi_user_profile', JSON.stringify(parsed));
        }
      } else {
        setStatusMessage({ text: data.error || 'Could not save password', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error saving password', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Save & Take Seat (Save Profile)
  const handleSave = async () => {
    const finalAlias = alias.trim() || `Guest-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalProfile: UserProfile = {
      id: userId || 'player_' + Math.random().toString(36).substring(2, 9),
      alias: finalAlias,
      avatarUrl: selectedAvatar,
      gender,
      authProvider: authMethod,
      identifier: authMethod === 'google' ? email : authMethod === 'phone' ? phone : undefined,
      email: email || undefined,
      phone: phone || undefined,
      gamesPlayed,
      gamesWon,
      bhabhiCount,
      guestGamesPlayed,
      hasPassword,
    };

    localStorage.setItem('bhabhi_user_profile', JSON.stringify(finalProfile));

    // Save to DB in background
    if (userId) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PROFILE',
          userId,
          alias: finalAlias,
          avatarUrl: selectedAvatar,
          gender,
          email,
          phone,
        }),
      }).catch(() => {});
    }

    onProfileUpdated(finalProfile);
    onClose();
  };

  // 6. Log Out / Reset to Guest
  const handleLogout = () => {
    localStorage.removeItem('bhabhi_user_profile');
    generateRandomGuest();
    setAuthMethod('guest');
    setEmail('');
    setPhone('');
    setGamesPlayed(0);
    setGamesWon(0);
    setBhabhiCount(0);
    setGuestGamesPlayed(0);
    setHasPassword(false);
    setStatusMessage({ text: 'Logged out. Switched to Guest mode.', type: 'success' });
    setActiveTab('profile');
  };

  const isGuestOverLimit = authMethod === 'guest' && guestGamesPlayed >= 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      {/* Modal Card - Widened & Fully Responsive for 375px Mobile up to 4K */}
      <div className="bg-slate-900 border-2 border-casino-gold/50 rounded-2xl w-full max-w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-casino-gold/15 border border-casino-gold/40 shadow-[0_0_15px_rgba(234,179,8,0.2)] shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-casino-gold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-serif font-black text-base sm:text-xl text-gold-gradient tracking-wide truncate">
                  VIP Club Profile
                </h3>
                {authMethod !== 'guest' ? (
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> VIP Verified
                  </span>
                ) : (
                  <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                    isGuestOverLimit
                      ? 'bg-red-950 border border-red-500/60 text-red-400 animate-pulse'
                      : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                  }`}>
                    <User className="w-3 h-3" /> Guest ({guestGamesPlayed}/2)
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate">
                Connect Google or Phone for permanent VIP stats & unlimited games
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800/80 transition shrink-0 ml-2"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tab Navigation - Responsive on 375px Mobile */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 sm:px-6 gap-1 sm:gap-2 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-casino-gold text-casino-gold bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile & 3D Avatars</span>
            <span className="sm:hidden">Avatars</span>
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'auth'
                ? 'border-casino-gold text-casino-gold bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign-In & Security</span>
            <span className="sm:hidden">Security</span>
            {authMethod === 'guest' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute right-1.5 top-1.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-casino-gold text-casino-gold bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Player Stats & Dashboard</span>
            <span className="sm:hidden">Stats</span>
          </button>
        </div>

        {/* Guest Limit Alert Banner */}
        {isGuestOverLimit && (
          <div className="mx-6 mt-4 p-3 bg-red-950/80 border border-red-500/70 rounded-xl flex items-center gap-3 text-red-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Guest Match Limit Reached (2/2 Games Played):</span> As a guest on this browser, you have completed your 2 free trial matches. Please sign in with Google or Phone to continue playing at the table and preserve your high-roller stats!
            </div>
            <button
              onClick={() => setActiveTab('auth')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition"
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`mx-6 mt-3 p-2.5 rounded-xl border text-xs text-center font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                : 'bg-red-950/80 border-red-500/80 text-red-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Modal Scrollable Body - Single Unified Scrollbar with sleek look */}
        <div className="p-3.5 sm:p-6 overflow-y-auto max-h-[calc(92vh-130px)] sm:max-h-[calc(92vh-150px)] space-y-4 sm:space-y-6">
          
          {/* TAB 1: PROFILE & 3D AVATAR SELECTION */}
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6">
              
              {/* Profile Preview Card */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-emerald-950/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-casino-gold/30 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 text-center sm:text-left shadow-inner">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedAvatar}
                      alt="Avatar preview"
                      className="w-14 h-14 sm:w-18 sm:h-18 rounded-full object-cover ring-2 ring-casino-gold shadow-gold"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-casino-gold text-slate-950 text-[9px] sm:text-[10px] font-black rounded-full px-1.5 shadow">
                      VIP
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                      <span className="font-bold text-base sm:text-lg text-white">{alias || 'VIP Player'}</span>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-casino-gold/20 text-casino-gold border border-casino-gold/40">
                        {gender === 'male' ? '♂️ Male' : '♀️ Female'}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                      {authMethod === 'google' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Google: {email || alias}
                        </span>
                      )}
                      {authMethod === 'phone' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Phone: {phone}
                        </span>
                      )}
                      {authMethod === 'guest' && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-amber-500" /> Guest Mode ({guestGamesPlayed}/2 matches)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateRandomGuest}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Roll a new random unique guest name & avatar"
                  >
                    <Dice5 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-casino-gold" />
                    <span>Random Alias</span>
                  </button>
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1.5">
                  Display Name / Player Alias
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={25}
                  placeholder="e.g. Guest-675577, CardMaster, RoyalShark"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-casino-gold rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-casino-gold/50"
                />
              </div>

              {/* Gender Switcher */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1.5">
                  Select Gender
                </label>
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('male')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      gender === 'male'
                        ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>♂️ Male (8 Avatars)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('female')}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      gender === 'female'
                        ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>♀️ Female (8 Avatars)</span>
                  </button>
                </div>
              </div>

              {/* 3D Avatar Grid (8 portraits with responsive column count: 4 on mobile, 8 on desktop) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase tracking-wider text-casino-gold font-semibold">
                    Select 3D Avatar Portrait
                  </label>
                  <span className="text-[11px] text-slate-400">Click portrait to select</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 bg-slate-950/70 p-2.5 sm:p-3.5 rounded-xl border border-slate-800">
                  {currentAvatars.map((url, idx) => {
                    const isSelected = selectedAvatar === url;
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedAvatar(url)}
                        className={`group relative rounded-xl p-1 transition-all duration-200 flex flex-col items-center ${
                          isSelected
                            ? 'ring-2 ring-amber-400 bg-amber-400/20 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                            : 'hover:bg-slate-800 hover:scale-102 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-casino-gold/50 shadow">
                          <img
                            src={url}
                            alt={`Avatar ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5 text-slate-950 font-bold" />
                          </div>
                        )}
                        <span className="text-[8px] sm:text-[9px] text-slate-400 mt-1 font-mono">
                          #{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN-IN & SECURITY (GOOGLE, PHONE, PASSWORD) */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              
              {/* Account Status Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Current Account Status</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {authMethod === 'google' && `Connected via Google Account: ${email}`}
                    {authMethod === 'phone' && `Connected via Phone: ${phone}`}
                    {authMethod === 'guest' && `Playing as Temporary Guest (${guestGamesPlayed}/2 games played)`}
                  </p>
                </div>
                {authMethod !== 'guest' ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 text-xs rounded-xl font-semibold flex items-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
                    Guest Session
                  </span>
                )}
              </div>

              {/* 1. Google Authentication Section */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.26 21.36 7.36 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-sm text-white">Google Single Sign-On</h4>
                </div>

                <p className="text-xs text-slate-400">
                  Connect your real Google account via official Google OAuth 2.0. Automatically imports your Google name, avatar photo, and syncs your stats directly to Neon PostgreSQL.
                </p>

                {/* 1. Official Google OAuth Redirect Button */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/auth/google/login';
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.26 21.36 7.36 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z" />
                  </svg>
                  <span>
                    {authMethod === 'google' ? `✓ Connected as ${email || alias}` : 'Launch Google Account Picker (Official OAuth)'}
                  </span>
                </button>

                {/* Sub-actions: Setup Guide & Manual Test fallback */}
                <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setShowGoogleSetupGuide(!showGoogleSetupGuide)}
                    className="text-casino-gold hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>⚙️ How to connect official Google Cloud Keys</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGooglePrompt(!showGooglePrompt)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {showGooglePrompt ? 'Hide manual test' : 'Quick test email'}
                  </button>
                </div>

                {/* Google Cloud Console Setup Instructions */}
                {showGoogleSetupGuide && (
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-casino-gold/40 text-xs text-slate-300 space-y-2">
                    <div className="font-bold text-casino-gold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-casino-gold" />
                      <span>Connect Real Google OAuth in 3 Steps:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>
                        Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-amber-400 underline">Google Cloud Console &rarr; Credentials</a> and click <strong>Create Credentials &rarr; OAuth client ID</strong>.
                      </li>
                      <li>
                        Select Application type: <strong>Web application</strong>. Under <strong>Authorized redirect URIs</strong>, add:
                        <code className="block bg-black px-2 py-1 rounded text-[10px] text-emerald-400 font-mono mt-1 select-all">
                          https://bhabhithola.vercel.app/api/auth/google/callback
                        </code>
                        <code className="block bg-black px-2 py-1 rounded text-[10px] text-emerald-400 font-mono mt-0.5 select-all">
                          https://bhabhithola-git-main-musawarahmeds-projects.vercel.app/api/auth/google/callback
                        </code>
                      </li>
                      <li>
                        In your <strong>Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables</strong>, add:
                        <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-amber-300 mt-1">
                          <span>• GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com</span>
                          <span>• GOOGLE_CLIENT_SECRET = your-client-secret</span>
                          <span>• NEXT_PUBLIC_GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {/* Manual Test Fallback Prompt */}
                {showGooglePrompt && (
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-3">
                    <label className="block text-xs text-slate-300 font-semibold">
                      Quick Test / Demo Google Email:
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={googleEmailInput}
                          onChange={(e) => setGoogleEmailInput(e.target.value)}
                          placeholder="e.g. yourname@gmail.com"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-casino-gold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGoogleSignInClick(googleEmailInput)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                      >
                        {isLoading ? 'Verifying...' : 'Authenticate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGooglePrompt(false)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Phone Number Authentication Section */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-casino-gold/15 border border-casino-gold/30">
                    <Phone className="w-4 h-4 text-casino-gold" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Phone Number Verification</h4>
                </div>

                <p className="text-xs text-slate-400">
                  Verify your mobile number via SMS OTP code. Securely links your phone to your VIP account.
                </p>

                {!showPhoneOtp ? (
                  <form onSubmit={handleSendPhoneOtp} className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Enter phone: +92 300 1234567 or +1 234 567 8900"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-casino-gold rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition"
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/50 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span>SMS sent to: <strong>{phoneInput}</strong></span>
                      <span className="font-mono text-slate-400">Demo Code: {demoOtpHint}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 4-digit SMS OTP (1234)"
                        maxLength={6}
                        className="flex-1 bg-black border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-casino-gold"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:brightness-110 transition"
                      >
                        {isLoading ? 'Verifying...' : 'Confirm OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPhoneOtp(false)}
                        className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 3. Password Setup for Cross-Device Access */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-casino-gold/15 border border-casino-gold/30">
                      <KeyRound className="w-4 h-4 text-casino-gold" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Cross-Device Account Password</h4>
                      <p className="text-xs text-slate-400">
                        {hasPassword
                          ? '✓ Password is set! You can update it below.'
                          : 'Set a password so you can sign in from any PC or mobile browser.'}
                      </p>
                    </div>
                  </div>
                  {hasPassword && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50">
                      Password Active
                    </span>
                  )}
                </div>

                <form onSubmit={handleSavePassword} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password (min 4 chars)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-casino-gold"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-casino-gold"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !newPassword}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-casino-gold border border-casino-gold/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{hasPassword ? 'Update Password' : 'Save Password'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: STATS & DASHBOARD */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              {/* VIP Level Banner */}
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-amber-950/60 p-5 rounded-2xl border border-casino-gold/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-casino-gold/20 border border-casino-gold/50 shadow-gold">
                    <Trophy className="w-8 h-8 text-casino-gold" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-lg text-gold-gradient">
                      VIP High-Roller Statistics
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live performance metrics synced to Neon PostgreSQL
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Win / Safe Rate</span>
                  <span className="font-black text-xl text-emerald-400">
                    {gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                    Matches Played
                  </span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {gamesPlayed}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                    Safe Escapes (Won)
                  </span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {gamesWon}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                    Bhabhi (Thola) Count
                  </span>
                  <span className="text-2xl font-black text-rose-400 mt-1 block">
                    {bhabhiCount}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                    Guest Matches
                  </span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">
                    {guestGamesPlayed} / 2
                  </span>
                </div>
              </div>

              {/* DB Connectivity & Account Security Info */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cloud Database Synchronization</span>
                </div>
                <p>
                  Your match results, penalties, safe escapes, and profile selections are persisted across rooms using Neon PostgreSQL. When signed in with Google or Phone, your identity is preserved even if you switch browsers or devices.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Save & Action Buttons */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 hidden sm:block truncate">
            {authMethod === 'guest' ? (
              <span>Guest session: <strong>{2 - Math.min(2, guestGamesPlayed)}</strong> matches remaining</span>
            ) : (
              <span className="text-emerald-400 font-semibold">VIP Account Connected</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldDark text-slate-950 font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0" />
              <span>Save & Take Seat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
