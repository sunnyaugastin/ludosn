import React, { useState } from 'react';
import { socket } from '../services/socket';
import ChatBox from '../components/Chat/ChatBox';
import PawnToken from '../components/Board/PawnToken';

const PLAYER_COLORS = ['red', 'green', 'blue', 'yellow'];
const COLOR_LABELS = { red: 'Red', green: 'Green', blue: 'Blue', yellow: 'Yellow' };
const COLOR_CLASSES = {
  red:    { ring: 'ring-[#FF2E2E]', bg: 'bg-red-50',    text: 'text-[#FF2E2E]', border: 'border-red-200' },
  green:  { ring: 'ring-[#00C853]', bg: 'bg-green-50',  text: 'text-[#00C853]', border: 'border-green-200' },
  blue:   { ring: 'ring-[#2196F3]', bg: 'bg-blue-50',   text: 'text-[#2196F3]', border: 'border-blue-200' },
  yellow: { ring: 'ring-[#FFE013]', bg: 'bg-yellow-50', text: 'text-[#ca8a04]', border: 'border-yellow-200' },
};

export default function Lobby({ roomData, playerName, onLeave }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [tokenStyle, setTokenStyle] = useState(() => localStorage.getItem('ludo_token_style') || 'pawn');

  const handleSelectTokenStyle = (style) => {
    setTokenStyle(style);
    localStorage.setItem('ludo_token_style', style);
  };

  if (!roomData) return null;

  const localPlayer = roomData.players.find((p) => p.id === socket.id);
  const isHost = localPlayer?.isHost;
  const isReady = localPlayer?.isReady;
  const myColor = localPlayer?.color || 'red';

  const guestPlayers = roomData.players.filter((p) => !p.isHost);
  const allGuestsReady = guestPlayers.length > 0 && guestPlayers.every((p) => p.isReady);
  const canStartGame = roomData.players.length >= 2 && allGuestsReady;

  const takenColors = roomData.players
    .filter(p => p.id !== socket.id)
    .map(p => p.color);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomData.code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleToggleReady = () => socket.emit('toggleReady');

  const handleColorSelect = (color) => {
    if (takenColors.includes(color)) return;
    socket.emit('selectColor', { color });
  };

  const handleStartGame = () => {
    if (!canStartGame) return;
    setStartError('');
    setIsStarting(true);
    socket.emit('startGame', (response) => {
      setIsStarting(false);
      if (response && !response.success) setStartError(response.message || 'Failed to start.');
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-12 md:p-8 overflow-hidden">
      {/* Background blobs matching Ludo colors */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#FF2E2E]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#00C853]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#2196F3]/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#FFE013]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-70 pointer-events-none" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full relative z-10">

        {/* ── Left: Lobby Panel ── */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col justify-between">
          
          {/* Ludo Color Stripe Accent */}
          <div className="w-full h-1.5 flex flex-shrink-0">
            <div className="flex-1 bg-[#FF2E2E]" />
            <div className="flex-1 bg-[#00C853]" />
            <div className="flex-1 bg-[#2196F3]" />
            <div className="flex-1 bg-[#FFE013]" />
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-1.5">
                  <img src="/logo.png" alt="Ludo22" className="w-6 h-6 object-contain" />
                  Ludo<span className="text-violet-600">22</span>
                  <span className="ml-1 text-sm font-semibold text-gray-400">Lobby</span>
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Host: <span className="font-semibold text-gray-600">{roomData.players.find(p => p.isHost)?.name}</span>
                </p>
              </div>
              <button
                onClick={onLeave}
                className="px-4 py-2 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-[#FF2E2E] text-xs font-bold rounded-xl transition"
              >
                Leave
              </button>
            </div>

            {/* Room Code */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room Code</p>
                <p className="text-2xl font-mono font-black text-violet-600 tracking-widest">{roomData.code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  isCopied
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-500'
                }`}
              >
                {isCopied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Token Style Selector */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choose Token Style</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTokenStyle('pawn')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border-2 font-bold text-[10px] transition-all ${
                    tokenStyle === 'pawn'
                      ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm ring-2 ring-violet-200'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  <PawnToken color={myColor} size={20} tokenStyle="pawn" />
                  <span>Classic</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTokenStyle('disk')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border-2 font-bold text-[10px] transition-all ${
                    tokenStyle === 'disk'
                      ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm ring-2 ring-violet-200'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  <PawnToken color={myColor} size={20} tokenStyle="disk" />
                  <span>Disk</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTokenStyle('pin')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border-2 font-bold text-[10px] transition-all ${
                    tokenStyle === 'pin'
                      ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm ring-2 ring-violet-200'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-250 hover:bg-gray-50'
                  }`}
                >
                  <PawnToken color={myColor} size={20} tokenStyle="pin" />
                  <span>Map Pin</span>
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choose Your Color</p>
              <div className="grid grid-cols-4 gap-3">
                {PLAYER_COLORS.map((c) => {
                  const taken = takenColors.includes(c);
                  const selected = myColor === c;
                  const cl = COLOR_CLASSES[c];
                  return (
                    <button
                      key={c}
                      onClick={() => handleColorSelect(c)}
                      disabled={taken}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                        selected
                          ? `${cl.bg} ${cl.border} ring-2 ${cl.ring} ring-offset-1`
                          : taken
                            ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                            : 'border-gray-100 bg-white hover:border-gray-250 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <PawnToken color={c} size={28} tokenStyle={tokenStyle} />
                      <span className={`text-[10px] font-bold ${selected ? cl.text : 'text-gray-400'}`}>
                        {taken ? 'Taken' : COLOR_LABELS[c]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                <span>Players</span>
                <span>{roomData.players.length} / 4</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roomData.players.map((player) => {
                  const isCurrent = player.id === socket.id;
                  const cl = COLOR_CLASSES[player.color] || COLOR_CLASSES.red;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition ${
                        isCurrent ? 'border-violet-100 bg-violet-50' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <PawnToken color={player.color || 'red'} size={24} tokenStyle={tokenStyle} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {player.name}
                          {isCurrent && <span className="ml-1 text-xs font-normal text-gray-400">(You)</span>}
                        </p>
                        <p className={`text-[10px] font-semibold ${cl.text}`}>{COLOR_LABELS[player.color] || '—'}</p>
                      </div>
                      {player.isHost ? (
                        <span className="text-[9px] bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Host</span>
                      ) : (
                        <span className={`text-[9px] border px-2 py-0.5 rounded-full font-bold ${
                          player.isReady
                            ? 'bg-emerald-50 text-[#00C853] border-emerald-250'
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}>
                          {player.isReady ? 'Ready' : 'Waiting'}
                        </span>
                      )}
                    </div>
                  );
                })}
                {Array.from({ length: 4 - roomData.players.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-gray-100">
                    <div className="w-6 h-8 rounded bg-gray-100 animate-pulse" />
                    <span className="text-sm text-gray-300 font-medium">Empty slot</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {startError && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-[#FF2E2E] text-xs text-center font-bold">{startError}</div>
            )}

            {/* Action footer */}
            <div className="pt-2 border-t border-gray-100">
              {isHost ? (
                <div className="space-y-2">
                  <button
                    onClick={handleStartGame}
                    disabled={!canStartGame || isStarting}
                    className={`w-full py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
                      canStartGame
                        ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-200 hover:scale-[1.01] active:scale-[0.99]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isStarting
                      ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Starting...</span></>
                      : <span>Start Game</span>
                    }
                  </button>
                  {!canStartGame && (
                    <p className="text-center text-xs text-gray-400">
                      {roomData.players.length < 2 ? 'Need at least 2 players.' : 'Waiting for all players to ready up.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleToggleReady}
                    className={`w-full py-3.5 rounded-2xl font-bold transition hover:scale-[1.01] active:scale-[0.99] ${
                      isReady
                        ? 'bg-[#00C853] hover:bg-[#00b047] text-white shadow-md shadow-emerald-100'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isReady ? '✓ I\'m Ready!' : 'Ready Up'}
                  </button>
                  <p className={`text-center text-xs font-semibold ${isReady ? 'text-[#00C853]' : 'text-gray-400'}`}>
                    {isReady ? 'Waiting for host to start the game...' : 'Click Ready when you\'re set!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Chat ── */}
        <div className="md:col-span-1 h-[400px] md:h-auto flex">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}
