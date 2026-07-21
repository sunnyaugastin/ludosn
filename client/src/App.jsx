import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import ToastContainer, { showToast } from './components/Toast';

// Session keys for reconnection
const SESSION_KEYS = {
  roomCode: 'ludo_room_code',
  playerName: 'ludo_player_name',
  view: 'ludo_view',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('auth_ludo22') === 'true');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState('home');
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [roomData, setRoomData] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // ── Attempt reconnect on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const savedCode = sessionStorage.getItem(SESSION_KEYS.roomCode);
    const savedName = sessionStorage.getItem(SESSION_KEYS.playerName);
    const savedView = sessionStorage.getItem(SESSION_KEYS.view);

    if (savedCode && savedName && (savedView === 'lobby' || savedView === 'game')) {
      setIsReconnecting(true);
      socket.connect();

      const attemptReconnect = () => {
        socket.emit('reconnectPlayer', { roomCode: savedCode, playerName: savedName }, (response) => {
          setIsReconnecting(false);
          if (response.success) {
            setRoomData(response.room);
            setPlayerName(savedName);
            const targetView = response.room.state === 'playing' ? 'game' : 'lobby';
            setView(targetView);
            showToast('Reconnected to room!', 'info', 2500);
          } else {
            // Room is gone — clear session and stay on home
            clearSession();
          }
        });
      };

      if (socket.connected) {
        attemptReconnect();
      } else {
        socket.once('connect', attemptReconnect);
      }
    }
  }, [isAuthenticated]);

  // ── Core socket event listeners ───────────────────────────────────────────
  useEffect(() => {
    function onConnect() {
      console.log('[Socket] Connected, Socket ID:', socket.id);
    }

    function onDisconnect(reason) {
      console.log('[Socket] Disconnected from server. Reason:', reason);
      // Only drop to home on explicit user action (intentional disconnect),
      // not on temporary network drops (transport errors auto-reconnect)
      if (reason === 'io client disconnect') {
        setView('home');
        setRoomData(null);
        clearSession();
      }
    }

    // Sync room changes sent by the server
    function onRoomUpdated(updatedRoom) {
      setRoomData(updatedRoom);

      if (updatedRoom.state === 'playing') {
        setView('game');
        sessionStorage.setItem(SESSION_KEYS.view, 'game');
      } else if (updatedRoom.state === 'lobby') {
        setView('lobby');
        sessionStorage.setItem(SESSION_KEYS.view, 'lobby');
      }
    }

    // Game event broadcasts
    function onPlayerDisconnected({ playerName: pName }) {
      showToast(`${pName} disconnected from the game`, 'disconnect', 4000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roomUpdated', onRoomUpdated);
    socket.on('playerDisconnected', onPlayerDisconnected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('roomUpdated', onRoomUpdated);
      socket.off('playerDisconnected', onPlayerDisconnected);
    };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function saveSession(roomCode, name, currentView) {
    sessionStorage.setItem(SESSION_KEYS.roomCode, roomCode);
    sessionStorage.setItem(SESSION_KEYS.playerName, name);
    sessionStorage.setItem(SESSION_KEYS.view, currentView);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEYS.roomCode);
    sessionStorage.removeItem(SESSION_KEYS.playerName);
    sessionStorage.removeItem(SESSION_KEYS.view);
  }

  const handleRoomJoined = (room, name) => {
    setRoomData(room);
    setPlayerName(name);
    localStorage.setItem('playerName', name);
    saveSession(room.code, name, 'lobby');
    setView('lobby');
  };

  const handleLeaveRoom = () => {
    socket.disconnect();
    setRoomData(null);
    clearSession();
    setView('home');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'Ludosn26') {
      setAuthError('');
      setIsVerifying(true);
      setTimeout(() => {
        localStorage.setItem('auth_ludo22', 'true');
        setIsVerifying(false);
        setIsAuthenticated(true);
      }, 1200);
    } else {
      setAuthError('Incorrect password! Try again.');
    }
  };

  // ── Reconnecting spinner ──────────────────────────────────────────────────
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Reconnecting to your game...</p>
      </div>
    );
  }

  // White Loading Transition Screen
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
        <img src="/logo.png" alt="Ludo22 Logo" className="w-20 h-20 object-contain animate-pulse" />
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-extrabold text-xs uppercase tracking-widest">Loading Ludo22...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-gray-150 p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Ludo22 Logo" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Ludo22 Lock</h2>
            <p className="text-gray-400 text-xs mt-1">This is a private space. Enter password to access.</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-center focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-gray-800 font-bold outline-none"
            />
            {authError && <p className="text-xs text-red-500 font-bold">{authError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition shadow-md shadow-violet-100"
            >
              Verify & Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-violet-500 selection:text-white">
      {/* Global toast overlay — sits above all views */}
      <ToastContainer />

      {view === 'home' && (
        <Home onRoomJoined={handleRoomJoined} />
      )}
      {view === 'lobby' && (
        <Lobby roomData={roomData} playerName={playerName} onLeave={handleLeaveRoom} />
      )}
      {view === 'game' && (
        <Game roomData={roomData} playerName={playerName} />
      )}
    </div>
  );
}
