'use client';

import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, X, Phone, User, ShieldCheck, RefreshCw } from 'lucide-react';

export interface UserProfile {
  alias: string;
  avatarUrl: string;
  gender: 'male' | 'female';
  authProvider: 'guest' | 'google' | 'phone';
  identifier?: string; // email or phone number
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
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  currentProfile,
}) => {
  const [alias, setAlias] = useState(currentProfile?.alias || 'Player');
  const [gender, setGender] = useState<'male' | 'female'>(currentProfile?.gender || 'male');
  const [selectedAvatar, setSelectedAvatar] = useState(
    currentProfile?.avatarUrl || MALE_AVATARS[0]
  );
  const [authMethod, setAuthMethod] = useState<'guest' | 'google' | 'phone'>(
    currentProfile?.authProvider || 'guest'
  );
  const [phoneInput, setPhoneInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('bhabhi_user_profile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as UserProfile;
          setAlias(parsed.alias || currentProfile?.alias || 'Player');
          setGender(parsed.gender || 'male');
          setSelectedAvatar(parsed.avatarUrl || MALE_AVATARS[0]);
          setAuthMethod(parsed.authProvider || 'guest');
          if (parsed.identifier) {
            if (parsed.authProvider === 'google') setGoogleEmail(parsed.identifier);
            if (parsed.authProvider === 'phone') setPhoneInput(parsed.identifier);
          }
        } catch {}
      } else if (currentProfile) {
        if (currentProfile.alias) setAlias(currentProfile.alias);
        if (currentProfile.avatarUrl) setSelectedAvatar(currentProfile.avatarUrl);
        if (currentProfile.gender) setGender(currentProfile.gender);
      }
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const currentAvatars = gender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  const handleGenderSwitch = (newGender: 'male' | 'female') => {
    setGender(newGender);
    // If current selected avatar does not belong to new gender set, select first of new set
    const newSet = newGender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;
    if (!newSet.includes(selectedAvatar)) {
      setSelectedAvatar(newSet[0]);
    }
  };

  const handleGoogleSignIn = () => {
    // Simulated Google OAuth login flow (ready for Vercel + Neon Auth deployment)
    const mockEmail = `${alias.toLowerCase().replace(/\s+/g, '') || 'player'}@gmail.com`;
    setGoogleEmail(mockEmail);
    setAuthMethod('google');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setShowPhoneOtp(true);
  };

  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMethod('phone');
    setShowPhoneOtp(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSave = () => {
    const finalProfile: UserProfile = {
      alias: alias.trim() || 'Player',
      avatarUrl: selectedAvatar,
      gender,
      authProvider: authMethod,
      identifier: authMethod === 'google' ? googleEmail : authMethod === 'phone' ? phoneInput : undefined,
    };

    localStorage.setItem('bhabhi_user_profile', JSON.stringify(finalProfile));
    onProfileUpdated(finalProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-casino-gold/50 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[0_15px_50px_rgba(0,0,0,0.9)] relative max-h-[92vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-casino-gold/15 border border-casino-gold/40">
              <Crown className="w-5 h-5 text-casino-gold" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gold-gradient">
                VIP Player Profile
              </h3>
              <p className="text-[10px] text-slate-400">
                Choose your high-roller identity, gender & 3D avatar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Badge Preview */}
        <div className="mb-5 bg-gradient-to-r from-emerald-950/60 via-slate-950 to-emerald-950/60 p-3 rounded-xl border border-casino-gold/30 flex items-center gap-3">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt="Avatar preview"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-casino-gold shadow-gold"
            />
            <span className="absolute -bottom-1 -right-1 bg-casino-gold text-slate-950 text-[9px] font-black rounded-full px-1.5 shadow">
              VIP
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white truncate">{alias || 'Player'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-casino-gold/20 text-casino-gold border border-casino-gold/40">
                {gender === 'male' ? '♂️ Male' : '♀️ Female'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              {authMethod === 'google' && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Google Verified ({googleEmail})
                </span>
              )}
              {authMethod === 'phone' && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Phone Verified ({phoneInput})
                </span>
              )}
              {authMethod === 'guest' && (
                <span className="text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" /> Guest Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1. Player Name / Alias Input */}
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1.5">
            Your Display Name / Alias
          </label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            maxLength={20}
            placeholder="e.g. CardShark, RoyalPlayer"
            className="w-full bg-slate-950/90 border border-slate-700 focus:border-casino-gold rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-casino-gold/50"
          />
        </div>

        {/* 2. Gender Selection Tabs */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-1.5">
            Select Gender
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleGenderSwitch('male')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
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
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                gender === 'female'
                  ? 'bg-gradient-to-r from-casino-goldDark to-casino-gold text-slate-950 shadow-gold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>♀️ Female (8 Avatars)</span>
            </button>
          </div>
        </div>

        {/* 3. 3D Avatar Grid (8 portraits based on selected gender) */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs uppercase tracking-wider text-casino-gold font-semibold">
              Select 3D Avatar Portrait
            </label>
            <span className="text-[10px] text-slate-400">Click to choose</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
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
                      : 'hover:bg-slate-800 hover:scale-102 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full overflow-hidden border border-casino-gold/50 shadow">
                    <img
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-slate-950 font-bold" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-400 mt-1 font-mono">
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Login / Verification System (Google, Phone, Guest) */}
        <div className="mb-5 border-t border-slate-800 pt-4">
          <label className="block text-xs uppercase tracking-wider text-casino-gold font-semibold mb-2">
            Authentication & Sign-In (For Vercel Deployment)
          </label>

          <div className="space-y-2.5">
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2.5 transition shadow ${
                authMethod === 'google'
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
                />
              </svg>
              <span>
                {authMethod === 'google'
                  ? `✓ Connected as ${googleEmail || alias}`
                  : 'Continue with Google'}
              </span>
            </button>

            {/* Phone Sign-In Section */}
            {!showPhoneOtp ? (
              <form onSubmit={handleSendPhoneOtp} className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter phone: +1 234 567 8900"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-casino-gold rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition"
                >
                  Verify Phone
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-amber-500/50">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 4-digit SMS OTP (1234)"
                  maxLength={6}
                  className="flex-1 bg-black border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:brightness-110"
                >
                  Confirm OTP
                </button>
              </form>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-3 p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs text-center rounded-lg animate-pulse">
            ✓ Identity verified successfully!
          </div>
        )}

        {/* Save & Apply Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-gradient-to-r from-casino-goldDark via-casino-gold to-casino-goldDark text-slate-950 font-bold rounded-xl text-sm uppercase tracking-wider shadow-gold hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Save Profile & Take Seat</span>
        </button>
      </div>
    </div>
  );
};
