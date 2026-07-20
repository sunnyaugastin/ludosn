import React, { useState } from 'react';
import { socket } from '../services/socket';

// LUDOSN logo SVG
function LudosnLogo({ size = 48 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="30" rx="9" ry="3.2" fill="#1a1a2e" opacity="0.2" />
      <path d="M9 22 C8 18, 6 14, 8 10 C9 7, 11 5.5, 14 5.5 C17 5.5, 19 7, 20 10 C22 14, 20 18, 19 22 Z" fill="#7c3aed" />
      <circle cx="14" cy="7" r="6" fill="#7c3aed" />
      <ellipse cx="11.5" cy="4.5" rx="2.5" ry="2" fill="#ddd6fe" opacity="0.6" />
      <path d="M11 14 C10.5 11.5, 11.5 9, 13 8.5" stroke="#ddd6fe" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M6 27.5 Q14 30.5 22 27.5 L20 22 Q14 24.5 8 22 Z" fill="#5b21b6" opacity="0.7" />
    </svg>
  );
}

export default function Home({ onRoomJoined }) {
  const [name, setName] = useState(localStorage.getItem('playerName') || '');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const connectAndExecute = (action) => {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Please enter your name to play.'); return; }
    if (trimmedName.length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (trimmedName.length > 15) { setError('Name must be 15 characters or less.'); return; }

    setIsLoading(true);

    const executeAction = () => {
      if (action === 'create') {
        socket.emit('createRoom', { playerName: trimmedName }, (response) => {
          setIsLoading(false);
          if (response.success) { onRoomJoined(response.room, trimmedName); }
          else { setError(response.message || 'Failed to create room.'); socket.disconnect(); }
        });
      } else {
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) { setError('Please enter a room code.'); setIsLoading(false); return; }
        if (trimmedCode.length !== 6) { setError('Room code must be 6 characters.'); setIsLoading(false); return; }
        socket.emit('joinRoom', { code: trimmedCode, playerName: trimmedName }, (response) => {
          setIsLoading(false);
          if (response.success) { onRoomJoined(response.room, trimmedName); }
          else { setError(response.message || 'Failed to join room.'); socket.disconnect(); }
        });
      }
    };

    if (!socket.connected) {
      socket.connect();
      const onConnect = () => { socket.off('connect', onConnect); socket.off('connect_error', onErr); executeAction(); };
      const onErr = () => { socket.off('connect', onConnect); socket.off('connect_error', onErr); setIsLoading(false); setError('Cannot connect to server. Check your internet.'); };
      socket.on('connect', onConnect);
      socket.on('connect_error', onErr);
    } else { executeAction(); }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic colorful blobs in corners matching Ludo colors */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#FF2E2E]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#00C853]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#2196F3]/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#FFE013]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />

      {/* Main card - decorated with a four-colored border on top */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden relative z-10 flex flex-col">
        
        {/* Ludo Color Stripe accent on top of card */}
        <div className="w-full h-1.5 flex">
          <div className="flex-1 bg-[#FF2E2E]" />
          <div className="flex-1 bg-[#00C853]" />
          <div className="flex-1 bg-[#2196F3]" />
          <div className="flex-1 bg-[#FFE013]" />
        </div>

        <div className="p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center">
              <img src="/logo.png" alt="Ludo22 Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              Ludo<span className="text-violet-600">22</span>
            </h1>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Ludo with friends</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-[#FF2E2E] text-xs text-center font-bold">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="name-input" className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Your Name
              </label>
              <input
                id="name-input"
                type="text"
                placeholder="e.g. Augustine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition text-gray-900 placeholder-gray-300 outline-none font-semibold"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-300 font-extrabold uppercase tracking-widest">Room</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Create Room Button - Red Accent shadow */}
            <button
              id="create-room-btn"
              onClick={() => connectAndExecute('create')}
              disabled={isLoading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-750 disabled:bg-gray-150 disabled:text-gray-400 text-white rounded-2xl font-bold transition transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Create New Room</span>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-300 font-extrabold uppercase tracking-widest">or join</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Join Room Form Container (arranged inline inside the div) */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-1.5 flex items-center gap-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <input
                id="code-input"
                type="text"
                placeholder="ROOM CODE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-2 text-gray-900 placeholder-gray-300 outline-none border-0 font-mono font-bold text-center tracking-widest text-base"
              />
              <button
                id="join-room-btn"
                onClick={() => connectAndExecute('join')}
                disabled={isLoading || code.trim().length !== 6}
                className="px-5 py-2.5 bg-[#00C853] hover:bg-[#00b047] active:bg-[#00963c] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-100/50 flex items-center justify-center flex-shrink-0"
              >
                Join
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-wider">Up to 4 players · Ludo rules</p>
        </div>
      </div>
    </div>
  );
}
