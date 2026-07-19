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
  const [view, setView] = useState('home');
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [roomData, setRoomData] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // ── Attempt reconnect on mount ────────────────────────────────────────────
  useEffect(() => {
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
  }, []);

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
    function onCaptureEvent({ attackerName, attackerColor, victimName, victimColor }) {
      showToast(`⚔️ ${attackerName} captured ${victimName}'s token!`, 'capture', 3500);
    }

    function onBonusTurnEvent({ playerName: pName, reason }) {
      showToast(`🎲 ${pName} got a bonus roll! (${reason})`, 'bonus', 2500);
    }

    function onPlayerDisconnected({ playerName: pName }) {
      showToast(`${pName} disconnected from the game`, 'disconnect', 4000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roomUpdated', onRoomUpdated);
    socket.on('captureEvent', onCaptureEvent);
    socket.on('bonusTurnEvent', onBonusTurnEvent);
    socket.on('playerDisconnected', onPlayerDisconnected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('roomUpdated', onRoomUpdated);
      socket.off('captureEvent', onCaptureEvent);
      socket.off('bonusTurnEvent', onBonusTurnEvent);
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

  // ── Reconnecting spinner ──────────────────────────────────────────────────
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Reconnecting to your game...</p>
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
