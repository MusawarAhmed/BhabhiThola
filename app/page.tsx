'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lobby } from '@/components/Lobby';
import { GameTable } from '@/components/GameTable';

function BhabhiGame() {
  const searchParams = useSearchParams();
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    // Check if returning from Google OAuth redirect
    const authSuccess = searchParams.get('auth_success');
    if (authSuccess === 'google') {
      const gEmail = searchParams.get('email');
      const gName = searchParams.get('name');
      const gAvatar = searchParams.get('avatar');
      const gUserId = searchParams.get('user_id');

      if (gEmail) {
        const profile = {
          id: gUserId || ('google_' + gEmail.replace(/[^a-zA-Z0-9]/g, '_')),
          alias: gName || gEmail.split('@')[0],
          avatarUrl: gAvatar || '/avatars/male_m1.jpg',
          gender: 'male',
          authProvider: 'google',
          email: gEmail,
          identifier: gEmail,
          guestGamesPlayed: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          bhabhiCount: 0,
          isVerified: true,
        };
        localStorage.setItem('bhabhi_user_profile', JSON.stringify(profile));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // Generate or restore persistent player ID from session
    let existingId = sessionStorage.getItem('bhabhi_player_id');
    if (!existingId) {
      existingId = 'player_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('bhabhi_player_id', existingId);
    }
    setPlayerId(existingId);

    const roomParam = searchParams.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
    }
  }, [searchParams]);

  const handleJoinRoom = (rId: string, name: string, code: string, avatar?: string) => {
    setRoomId(rId);
    setPlayerName(name);
    setRoomCode(code);
    if (avatar) setAvatarUrl(avatar);
    setInRoom(true);
  };

  const handleLeaveRoom = () => {
    setInRoom(false);
    setRoomId('');
  };

  if (!inRoom) {
    return <Lobby playerId={playerId} onJoinRoom={handleJoinRoom} />;
  }

  return (
    <GameTable
      roomId={roomId}
      roomCode={roomCode}
      playerId={playerId}
      playerName={playerName}
      playerAvatar={avatarUrl}
      onLeave={handleLeaveRoom}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-casino-gold">Loading Royal Table...</div>}>
      <BhabhiGame />
    </Suspense>
  );
}
