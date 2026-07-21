import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import LudoBoard from '../components/Board/LudoBoard';
import Dice from '../components/Dice/Dice';
import ChatBox from '../components/Chat/ChatBox';
import TurnTimerRing from '../components/TurnTimerRing';
import PlayerAvatar from '../components/PlayerAvatar';
import ConfettiOverlay from '../components/ConfettiOverlay';
import PawnToken from '../components/Board/PawnToken';
import {
  soundDiceRoll,
  soundCapture,
  soundBonusTurn,
  soundYourTurn,
  soundWin,
} from '../services/sound';

const SESSION_KEYS = {
  roomCode: 'ludo_room_code',
  playerName: 'ludo_player_name',
  view: 'ludo_view',
};

const COLOR_LABELS = { red: 'Red', green: 'Green', blue: 'Blue', yellow: 'Yellow' };
const PANEL_COLORS = {
  red:    { border: 'border-red-100',    activeBorder: 'border-[#FF2E2E]', activeShadow: 'shadow-[#FF2E2E]/25', bg: 'bg-red-50',    text: 'text-[#FF2E2E]'    },
  green:  { border: 'border-green-100',  activeBorder: 'border-[#00C853]', activeShadow: 'shadow-[#00C853]/25', bg: 'bg-green-50',  text: 'text-[#00C853]'    },
  blue:   { border: 'border-blue-100',   activeBorder: 'border-[#2196F3]', activeShadow: 'shadow-[#2196F3]/25', bg: 'bg-blue-50',   text: 'text-[#2196F3]'    },
  yellow: { border: 'border-yellow-100', activeBorder: 'border-[#FFE013]', activeShadow: 'shadow-[#FFE013]/25', bg: 'bg-yellow-50', text: 'text-[#ca8a04]'    },
};

export default function Game({ roomData, playerName }) {
  const [localDiceValue, setLocalDiceValue] = useState(1);
  const [localIsRolling, setLocalIsRolling] = useState(false);
  const [rollError, setRollError] = useState('');
  const [showYourTurnFlash, setShowYourTurnFlash] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [tokenStyle, setTokenStyle] = useState(() => localStorage.getItem('ludo_token_style') || 'pawn');

  const toggleTokenStyle = (style) => {
    setTokenStyle(style);
    localStorage.setItem('ludo_token_style', style);
  };

  // Persist session for reconnect
  useEffect(() => {
    if (roomData?.code && playerName) {
      sessionStorage.setItem(SESSION_KEYS.roomCode, roomData.code);
      sessionStorage.setItem(SESSION_KEYS.playerName, playerName);
      sessionStorage.setItem(SESSION_KEYS.view, 'game');
    }
  }, [roomData?.code, playerName]);

  // Dice roll animation (fires for ALL clients)
  useEffect(() => {
    function onDiceRolledResult({ value }) {
      setLocalIsRolling(true);
      setRollError('');
      soundDiceRoll();
      setTimeout(() => {
        setLocalDiceValue(value);
        setLocalIsRolling(false);
      }, 1200);
    }
    socket.on('diceRolledResult', onDiceRolledResult);
    return () => socket.off('diceRolledResult', onDiceRolledResult);
  }, []);

  // Capture & bonus sounds
  useEffect(() => {
    function onCapture() { soundCapture(); }
    function onBonus() { soundBonusTurn(); }
    socket.on('captureEvent', onCapture);
    socket.on('bonusTurnEvent', onBonus);
    return () => { socket.off('captureEvent', onCapture); socket.off('bonusTurnEvent', onBonus); };
  }, []);

  // Turn change → reset timer, your-turn flash, sound
  useEffect(() => {
    if (!gameState) return;
    const currentTurn = gameState.turn;
    if (prevTurnRef.current !== currentTurn) {
      prevTurnRef.current = currentTurn;
      setTimerResetKey(k => k + 1);
      const activePlayer = gameState.players[currentTurn];
      if (activePlayer?.id === socket.id) {
        setShowYourTurnFlash(true);
        soundYourTurn();
        setTimeout(() => setShowYourTurnFlash(false), 1400);
      }
    }
  }, [gameState?.turn]);

  // Winner → confetti + sound
  useEffect(() => {
    if (gameState?.gameOver && gameState?.winner) {
      setConfetti(true);
      soundWin();
      setTimeout(() => setConfetti(false), 5000);
    }
  }, [gameState?.gameOver]);

  // Listen for chat messages → show latest as a preview banner for 4 seconds
  useEffect(() => {
    function onChatPreview(msg) {
      // Only show messages from others
      if (msg.senderId === socket.id || msg.isSystem) return;
      if (latestChatTimerRef.current) clearTimeout(latestChatTimerRef.current);
      setLatestChatMsg(msg);
      latestChatTimerRef.current = setTimeout(() => {
        setLatestChatMsg(null);
        latestChatTimerRef.current = null;
      }, 4000);
    }
    socket.on('chatMessage', onChatPreview);
    return () => {
      socket.off('chatMessage', onChatPreview);
      if (latestChatTimerRef.current) clearTimeout(latestChatTimerRef.current);
    };
  }, []);

  // Sync dice value from server when not animating
  const [activeReactions, setActiveReactions] = useState({});

  useEffect(() => {
    if (gameState?.diceValue && !localIsRolling) {
      setLocalDiceValue(gameState.diceValue);
    }
  }, [gameState?.diceValue, localIsRolling]);

  // Listen for real-time emoji reactions — auto-clear after 2 seconds
  const reactionTimersRef = useRef({});
  useEffect(() => {
    function onEmojiReceived({ senderId, emoji }) {
      // Clear any existing timer for this sender
      if (reactionTimersRef.current[senderId]) {
        clearTimeout(reactionTimersRef.current[senderId]);
      }
      setActiveReactions(prev => ({
        ...prev,
        [senderId]: { emoji, key: Date.now() }
      }));
      // Auto-clear after 2 seconds
      reactionTimersRef.current[senderId] = setTimeout(() => {
        setActiveReactions(prev => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
        delete reactionTimersRef.current[senderId];
      }, 2000);
    }
    socket.on('emojiReceived', onEmojiReceived);
    return () => {
      socket.off('emojiReceived', onEmojiReceived);
      // Clean up all timers
      Object.values(reactionTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  if (!roomData || !gameState) return null;

  const activePlayer = gameState.players[gameState.turn];
  const isMyTurn = activePlayer?.id === socket.id;
  const localPlayerInfo = gameState.players.find(p => p.id === socket.id);
  const myColor = localPlayerInfo?.color || '';

  // Valid moves for my tokens
  const getValidMoves = (color, rollValue) => {
    if (!rollValue || !gameState.tokens[color]) return [];
    return gameState.tokens[color].reduce((acc, pos, tokenId) => {
      if ((pos === -1 && rollValue === 6) || (pos >= 0 && pos < 56 && pos + rollValue <= 56)) {
        acc.push(tokenId);
      }
      return acc;
    }, []);
  };
  const validTokens = isMyTurn && gameState.hasRolled && !localIsRolling
    ? getValidMoves(myColor, gameState.diceValue)
    : [];

  const handleRollClick = () => {
    if (!isMyTurn || gameState.hasRolled || localIsRolling) return;
    setRollError('');
    socket.emit('rollDice', (res) => {
      if (res && !res.success) setRollError(res.message || 'Failed to roll.');
    });
  };

  const handleTokenClick = (tokenId) => {
    if (!isMyTurn || !gameState.hasRolled) return;
    socket.emit('moveToken', { tokenId }, (res) => {
      if (res && !res.success) console.error('Move failed:', res.message);
    });
  };

  const handleSendEmoji = (emoji) => {
    socket.emit('sendEmoji', { emoji });
  };

  const handleQuit = () => {
    if (window.confirm('Quit the match and return to home?')) {
      sessionStorage.removeItem(SESSION_KEYS.roomCode);
      sessionStorage.removeItem(SESSION_KEYS.playerName);
      sessionStorage.removeItem(SESSION_KEYS.view);
      socket.disconnect();
      window.location.reload();
    }
  };

  const winnerPlayer = gameState.players.find(p => p.id === gameState.winner);
  const is2Player = gameState.players.length === 2;

  // Render a player panel (avatar + dice card) for standard 4-player mode
  function PlayerPanel({ color }) {
    const player = gameState.players.find(p => p.color === color);
    const activePlayer = gameState.players[gameState.turn];
    const isActive = activePlayer && activePlayer.color === color;
    const cl = PANEL_COLORS[color] || PANEL_COLORS.red;
    const isMe = player?.id === socket.id;
    const showDice = isActive;

    return (
      <div className={`flex items-center gap-2 px-2.5 py-2 rounded-2xl border-2 transition-all duration-300 bg-white relative ${
        isActive ? `${cl.activeBorder} shadow-md ${cl.activeShadow}` : `${cl.border}`
      }`}>
        {/* Floating reaction above profile */}
        {player && activeReactions[player.id] && (
          <div
            key={activeReactions[player.id].key}
            className="absolute -top-8 left-6 z-30 text-2xl animate-float-emoji pointer-events-none select-none"
          >
            {activeReactions[player.id].emoji}
          </div>
        )}

        {/* Avatar + timer ring */}
        <TurnTimerRing active={isActive} color={color} resetKey={timerResetKey}>
          <PlayerAvatar name={player?.name || '?'} color={color} isActive={isActive} size={40} />
        </TurnTimerRing>

        {/* Name */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${cl.text}`}>{COLOR_LABELS[color]}</span>
          <span className="text-xs font-bold text-gray-800 truncate max-w-[70px]">
            {player ? player.name : <span className="text-gray-300 font-normal">Empty</span>}
          </span>
          {isMe && <span className="text-[8px] text-gray-400">(You)</span>}
        </div>

        {/* Dice card */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${
          isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50'
        }`}>
          {showDice ? (
            <Dice
              value={localDiceValue}
              isRolling={localIsRolling}
              onClick={handleRollClick}
              disabled={!isMyTurn || gameState.hasRolled}
            />
          ) : (
            <div className="flex flex-wrap gap-1 items-center justify-center p-2 opacity-20">
              {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Floating Emoji Picker Button Component
  function EmojiPicker({ onSelect }) {
    const [open, setOpen] = useState(false);
    const emojis = ['😀', '😂', '😍', '😭', '😎', '👍', '👏', '❤️', '🔥', '🎉', '😡', '😮'];

    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
        >
          <span>😊</span>
          <span className="text-[9px] uppercase tracking-wider">React</span>
        </button>
        {open && (
          <div className="absolute bottom-8 left-0 z-40 bg-white border border-gray-150 rounded-2xl p-2.5 shadow-xl grid grid-cols-4 gap-1.5 w-44">
            {emojis.map(e => (
              <button
                key={e}
                onClick={() => {
                  onSelect(e);
                  setOpen(false);
                }}
                className="hover:scale-125 transition text-lg"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2-Player Profile Component
  function TwoPlayerProfile({ player, alignRight = false }) {
    if (!player) return null;
    const color = player.color;
    const isActive = activePlayer && activePlayer.id === player.id;
    const cl = PANEL_COLORS[color] || PANEL_COLORS.red;
    const isMe = player.id === socket.id;

    return (
      <div className={`flex items-center gap-1.5 sm:gap-3 bg-white p-1.5 sm:p-2.5 rounded-2xl border-2 transition-all duration-300 relative ${
        isActive ? `${cl.activeBorder} shadow-sm ${cl.activeShadow}` : 'border-gray-100'
      }`}>
        {/* Floating reaction above profile */}
        {activeReactions[player.id] && (
          <div
            key={activeReactions[player.id].key}
            className="absolute -top-12 left-8 z-30 text-3xl animate-float-emoji pointer-events-none select-none"
          >
            {activeReactions[player.id].emoji}
          </div>
        )}

        <TurnTimerRing active={isActive} color={color} resetKey={timerResetKey}>
          <PlayerAvatar name={player.name} color={color} isActive={isActive} size={36} />
        </TurnTimerRing>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-gray-800 truncate max-w-[60px] sm:max-w-[90px]">{player.name}</span>
            {isMe && <span className="text-[8px] bg-violet-100 text-violet-600 px-1 py-0.5 rounded-full font-bold">You</span>}
          </div>
          <span className={`text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider ${cl.text}`}>
            {COLOR_LABELS[color]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden select-none">
      <style>{`
        @keyframes emoji-float {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          15% { transform: translateY(-15px) scale(1.2); opacity: 1; }
          85% { transform: translateY(-40px) scale(1); opacity: 1; }
          100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
        }
        .animate-float-emoji {
          animation: emoji-float 3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* Confetti */}
      <ConfettiOverlay active={confetti} />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto mt-4 mb-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Ludo22 Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-gray-900">Ludo<span className="text-violet-600">22</span></h1>
          <p className="text-[10px] text-gray-400 font-mono">Room: {roomData.code}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Token Style Selector */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            <button
              onClick={() => toggleTokenStyle('pawn')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                tokenStyle === 'pawn' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>♟️</span> <span>Pawn</span>
            </button>
            <button
              onClick={() => toggleTokenStyle('disk')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                tokenStyle === 'disk' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>🔘</span> <span>Disk</span>
            </button>
          </div>

          <button
            onClick={handleQuit}
            className="px-4 py-2 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs font-bold rounded-xl transition"
          >
            Quit
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="w-full max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 items-start pb-6">

        {/* Board area */}
        <div className="lg:col-span-2 space-y-5">

          {/* Standard 4-Player Layout (Red/Green top) */}
          {!is2Player && (
            <div className="grid grid-cols-2 gap-3">
              <PlayerPanel color="red" />
              <PlayerPanel color="green" />
            </div>
          )}

          {/* Board */}
          <div className="flex justify-center">
            <LudoBoard
              gameState={gameState}
              validTokens={validTokens}
              onTokenClick={handleTokenClick}
              tokenStyle={tokenStyle}
            />
          </div>

          {/* Fixed-height Mid Section (Fixed 44px spacing between board and bottom controls) */}
          <div className="h-11 flex items-center gap-2 px-1 my-1 select-none">
            {/* React button (always fixed on the left) */}
            <EmojiPicker onSelect={handleSendEmoji} />

            {/* Dynamic Content Slot (Your Turn alert OR Chat preview — zero layout shifting) */}
            <div className="flex-1 h-full flex items-center justify-center min-w-0">
              {showYourTurnFlash ? (
                <div className="bg-violet-600/90 backdrop-blur-sm text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-md animate-bounce uppercase tracking-widest">
                  ⭐ Your Turn!
                </div>
              ) : latestChatMsg ? (
                <div 
                  className="w-full h-full bg-white/80 border border-gray-150 rounded-xl px-3 flex flex-col justify-center shadow-sm cursor-pointer overflow-hidden"
                  onClick={() => setLatestChatMsg(null)}
                >
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                    {latestChatMsg.senderName}
                  </span>
                  <p className={`font-semibold text-gray-700 truncate leading-tight mt-0.5 ${
                    latestChatMsg.text.length > 40 ? 'text-[10px]' 
                    : latestChatMsg.text.length > 20 ? 'text-xs' 
                    : 'text-xs'
                  }`}>
                    {latestChatMsg.text}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Standard 4-Player Layout (Blue/Yellow bottom) */}
          {!is2Player && (
            <div className="grid grid-cols-2 gap-3">
              <PlayerPanel color="blue" />
              <PlayerPanel color="yellow" />
            </div>
          )}

          {/* Dedicated 2-Player Controls Layout */}
          {is2Player && (
            <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-4 bg-white/50 border border-gray-150 p-2 sm:p-4 rounded-3xl shadow-sm overflow-visible">
              {/* Local Player Profile (Left) */}
              <div className="flex-1 min-w-0">
                <TwoPlayerProfile player={localPlayerInfo} />
              </div>

              {/* Shared Central Dice */}
              <div className="flex flex-col items-center justify-center px-1.5 sm:px-4 border-x border-gray-150 gap-0.5 sm:gap-1 flex-shrink-0">
                <span className="text-[7px] sm:text-[9px] font-extrabold text-gray-400 uppercase tracking-widest text-center">
                  {isMyTurn ? 'Your Turn' : `${activePlayer?.name}'s Turn`}
                </span>
                <Dice
                  value={localDiceValue}
                  isRolling={localIsRolling}
                  onClick={handleRollClick}
                  disabled={!isMyTurn || gameState.hasRolled}
                  isGray={!isMyTurn}
                />
              </div>

              {/* Opponent Profile (Right) */}
              <div className="flex-1 min-w-0">
                <TwoPlayerProfile player={gameState.players.find(p => p.id !== socket.id)} alignRight />
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="text-center py-1 min-h-[22px]">
            {rollError && <p className="text-xs text-red-500 font-bold">{rollError}</p>}
            {!rollError && activePlayer && (
              <p className="text-xs text-gray-500">
                {isMyTurn ? (
                  <span className="text-violet-600 font-bold">
                    {gameState.hasRolled ? '👆 Select a token to move' : '🎲 Click your dice to roll!'}
                  </span>
                ) : (
                  <>Waiting for <span className="font-bold text-gray-700">{activePlayer.name}</span> to {gameState.hasRolled ? 'move' : 'roll'}...</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-1 h-[460px] lg:h-full flex">
          <ChatBox />
        </div>
      </main>

      {/* Winner Modal */}
      {gameState.gameOver && winnerPlayer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center space-y-5 border border-gray-100">
            <div className="flex justify-center">
              <PawnToken color={winnerPlayer.color} size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">🏆 Victory!</h2>
              <p className="text-gray-500 text-sm mt-1">
                <span className="font-bold text-gray-800">{winnerPlayer.name}</span> wins the match!
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
