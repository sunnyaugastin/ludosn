import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRoomCode } from './utils/roomCode.js';
import { 
  initializeGame, 
  handleRollDice, 
  handleMoveToken, 
  advanceTurn, 
  getValidMoves,
  getAbsoluteCoordinates
} from './game/ludoEngine.js';

// In-memory session store for reconnection: socketId -> { roomCode, playerName }
// We store the most-recent socket ID per player name + room combo
const playerSessions = new Map(); // key: `${roomCode}:${playerName}` -> socketId

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Enable CORS middleware for HTTP routes
app.use(cors({
  origin: clientUrl,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Ludo Friends Server is healthy' });
});

// Create HTTP server wrapping Express app
const httpServer = createServer(app);

// Initialize Socket.IO with CORS settings matching frontend client
const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Server-side rooms memory store
const rooms = new Map();

// Map of active turn timeouts for each roomCode -> timeoutObj
const turnTimers = new Map();

// Helper to find a room by a socket's ID
function findRoomByPlayerSocketId(socketId) {
  for (const [code, room] of rooms.entries()) {
    const player = room.players.find(p => p.id === socketId);
    if (player) {
      return { roomCode: code, room, player };
    }
  }
  return null;
}

// Function to handle game turn timeout (AFK safeguard)
function resetTurnTimer(roomCode, room) {
  // Clear any existing timer
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode));
  }

  // If game is over or not playing, clean up and return
  if (room.state !== 'playing' || !room.gameState || room.gameState.gameOver) {
    turnTimers.delete(roomCode);
    return;
  }

  // Set 20-second AFK timer
  const timeout = setTimeout(() => {
    console.log(`[Timer] Room ${roomCode} turn timeout. Auto-playing.`);
    const gameState = room.gameState;
    const activePlayer = gameState.players[gameState.turn];

    if (!gameState.hasRolled) {
      // Auto-roll dice
      const rollRes = handleRollDice(gameState, activePlayer.id);
      io.to(roomCode).emit('roomUpdated', room);

      if (rollRes.success) {
        if (rollRes.hasNoMoves || rollRes.turnPassed) {
          // If roll has no valid moves or passed, auto pass after a short delay
          setTimeout(() => {
            advanceTurn(gameState);
            io.to(roomCode).emit('roomUpdated', room);
            resetTurnTimer(roomCode, room);
          }, 1500);
        } else {
          // Auto-move first valid token
          setTimeout(() => {
            const validTokens = rollRes.validTokens || [];
            if (validTokens.length > 0) {
              handleMoveToken(gameState, activePlayer.id, validTokens[0]);
            } else {
              advanceTurn(gameState);
            }
            io.to(roomCode).emit('roomUpdated', room);
            resetTurnTimer(roomCode, room);
          }, 1500);
        }
      }
    } else {
      // Already rolled, auto-move first valid token
      const activeColor = activePlayer.color;
      const validTokens = getValidMoves(gameState, activeColor, gameState.diceValue);
      
      if (validTokens.length > 0) {
        handleMoveToken(gameState, activePlayer.id, validTokens[0]);
      } else {
        advanceTurn(gameState);
      }
      io.to(roomCode).emit('roomUpdated', room);
      resetTurnTimer(roomCode, room);
    }
  }, 20000); // 20 seconds AFK timeout

  turnTimers.set(roomCode, timeout);
}

// Clean up timer for a room
function clearRoomTimer(roomCode) {
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode));
    turnTimers.delete(roomCode);
  }
}

// Listen for Socket.IO connection events
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // 1. Create Room event
  socket.on('createRoom', ({ playerName }, callback) => {
    if (!playerName || playerName.trim() === '') {
      return callback({ success: false, message: 'Player name is required.' });
    }

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const room = {
      code,
      players: [
        {
          id: socket.id,
          name: playerName.trim(),
          isHost: true,
          isReady: false
        }
      ],
      state: 'lobby',
      messages: []
    };

    rooms.set(code, room);
    socket.join(code);

    console.log(`[Room Created] Code: ${code} by Host: ${playerName} (${socket.id})`);
    callback({ success: true, room });
  });

  // 2. Join Room event
  socket.on('joinRoom', ({ code, playerName }, callback) => {
    if (!code || code.trim() === '') {
      return callback({ success: false, message: 'Room code is required.' });
    }
    if (!playerName || playerName.trim() === '') {
      return callback({ success: false, message: 'Player name is required.' });
    }

    const roomCode = code.trim().toUpperCase();
    const room = rooms.get(roomCode);

    if (!room) {
      return callback({ success: false, message: 'Room code not found.' });
    }

    if (room.state !== 'lobby') {
      return callback({ success: false, message: 'The game has already started in this room.' });
    }

    if (room.players.length >= 4) {
      return callback({ success: false, message: 'Room is full (max 4 players).' });
    }

    const newPlayer = {
      id: socket.id,
      name: playerName.trim(),
      isHost: false,
      isReady: false
    };

    room.players.push(newPlayer);
    socket.join(roomCode);

    console.log(`[Room Joined] Code: ${roomCode}, Player: ${playerName} (${socket.id})`);
    callback({ success: true, room });
    socket.to(roomCode).emit('roomUpdated', room);
  });

  // 3. Ready Toggle event
  socket.on('toggleReady', () => {
    const lookup = findRoomByPlayerSocketId(socket.id);
    if (lookup) {
      const { roomCode, room, player } = lookup;
      player.isReady = !player.isReady;
      console.log(`[Ready Toggle] Player ${player.name} (${socket.id}) is now ${player.isReady ? 'READY' : 'NOT READY'}`);
      io.to(roomCode).emit('roomUpdated', room);
    }
  });

  // 3b. Select Color event (lobby only)
  socket.on('selectColor', ({ color }, callback) => {
    const validColors = ['red', 'green', 'blue', 'yellow'];
    if (!validColors.includes(color)) return;

    const lookup = findRoomByPlayerSocketId(socket.id);
    if (!lookup) return;

    const { roomCode, room, player } = lookup;
    if (room.state !== 'lobby') return;

    // Check if another player already has this color
    const colorTaken = room.players.some(p => p.id !== socket.id && p.color === color);
    if (colorTaken) {
      if (callback) callback({ success: false, message: 'Color already taken.' });
      return;
    }

    player.color = color;
    console.log(`[Color] ${player.name} selected ${color}`);
    io.to(roomCode).emit('roomUpdated', room);
    if (callback) callback({ success: true });
  });

  // 4. Start Game event
  socket.on('startGame', (callback) => {
    const lookup = findRoomByPlayerSocketId(socket.id);
    if (!lookup) {
      return callback({ success: false, message: 'Room not found.' });
    }

    const { roomCode, room, player } = lookup;

    if (!player.isHost) {
      return callback({ success: false, message: 'Only the host can start the game.' });
    }

    if (room.players.length < 2) {
      return callback({ success: false, message: 'Need at least 2 players to start.' });
    }

    const allGuestsReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
    if (!allGuestsReady) {
      return callback({ success: false, message: 'All guest players must be ready to start.' });
    }

    // Initialize stateful game engine
    room.state = 'playing';
    room.gameState = initializeGame(room.players);
    console.log(`[Game Started] Room ${roomCode} matches initialized.`);

    // Broadcast update to transition views
    io.to(roomCode).emit('roomUpdated', room);
    
    // Start AFK timer for the first player
    resetTurnTimer(roomCode, room);

    if (callback) callback({ success: true });
  });

  // 5. Reconnect Player event
  socket.on('reconnectPlayer', ({ roomCode, playerName }, callback) => {
    const code = roomCode?.trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return callback({ success: false, message: 'Room no longer exists.' });
    }

    // Find a disconnected slot with matching name
    const existingPlayer = room.players.find(
      p => p.name.toLowerCase() === playerName?.trim().toLowerCase()
    );

    if (!existingPlayer) {
      return callback({ success: false, message: 'Player not found in room.' });
    }

    // Swap the old socket ID with the new one
    const oldId = existingPlayer.id;
    existingPlayer.id = socket.id;

    // If there is an active game state, update player ID there too
    if (room.gameState) {
      const gsPlayer = room.gameState.players.find(p => p.id === oldId);
      if (gsPlayer) gsPlayer.id = socket.id;
    }

    socket.join(code);
    console.log(`[Reconnect] ${playerName} reconnected to room ${code} (old: ${oldId}, new: ${socket.id})`);

    // Sync full state back to the reconnected client
    callback({ success: true, room });
    socket.to(code).emit('roomUpdated', room);
  });

  // 6. Game Roll Dice event
  socket.on('rollDice', (callback) => {
    const lookup = findRoomByPlayerSocketId(socket.id);
    if (!lookup) {
      return callback({ success: false, message: 'Room or player not active in game.' });
    }

    const { roomCode, room } = lookup;
    const result = handleRollDice(room.gameState, socket.id);

    if (!result.success) {
      return callback(result);
    }

    // Broadcast the rolled value so clients can animate
    const activePlayer = room.gameState.players[room.gameState.turn];
    io.to(roomCode).emit('diceRolledResult', {
      value: result.rolled,
      color: activePlayer.color,
      playerName: activePlayer.name
    });

    // If rolled value has no possible valid moves, auto pass turn after short visual delay
    if (result.hasNoMoves || result.turnPassed) {
      setTimeout(() => {
        advanceTurn(room.gameState);
        io.to(roomCode).emit('roomUpdated', room);
        resetTurnTimer(roomCode, room);
      }, 1500);
    } else {
      // Refresh AFK timer
      resetTurnTimer(roomCode, room);
    }

    // Emit full updated game data to synchronize state
    io.to(roomCode).emit('roomUpdated', room);
    if (callback) callback({ success: true, rolled: result.rolled });
  });

  // 7. Game Move Token event
  socket.on('moveToken', ({ tokenId }, callback) => {
    const lookup = findRoomByPlayerSocketId(socket.id);
    if (!lookup) {
      return callback({ success: false, message: 'Room not found.' });
    }

    const { roomCode, room } = lookup;
    const gameState = room.gameState;
    const activePlayer = gameState.players[gameState.turn];
    const activeColor = activePlayer?.color;
    const oldPos = gameState.tokens[activeColor]?.[tokenId];

    const result = handleMoveToken(gameState, socket.id, tokenId);

    if (!result.success) {
      return callback(result);
    }

    const newPos = gameState.tokens[activeColor]?.[tokenId];
    const rolledValue = gameState.diceValue; // captured before engine clears it
    const wasRoll6 = (room.gameState.diceValue === null && rolledValue === null) ? false : true;

    // Detect if a capture happened: check if any opponent token was reset to -1
    // We compare old positions vs new. If opponent token is now -1 and was > 0, it was captured.
    // The engine already handles this in handleMoveToken — emit the event separately
    // We do a simple flag check via the engine's return data if we extend it, 
    // or we emit based on position delta logic:
    // (For simplicity we check if any opponent token at same board cell was reset)
    // The engine already logged CAPTURE. Emit event based on new vs old token state snapshot.
    // Simple approach: emit capture event if new position of active token is track and any
    // opponent's token that was previously on same global cell is now -1.
    
    // Detect captures: compare tokens before/after
    // We already handle capture in engine — emit notification
    if (result.capturedPlayer) {
      io.to(roomCode).emit('captureEvent', {
        attackerName: activePlayer.name,
        attackerColor: activeColor,
        victimName: result.capturedPlayer.name,
        victimColor: result.capturedPlayer.color,
      });
    }

    // Bonus turn notification
    if (result.bonusTurn) {
      io.to(roomCode).emit('bonusTurnEvent', {
        playerName: activePlayer.name,
        reason: result.bonusReason || 'rolled a 6',
      });
    }

    // Broadcast updated game state
    io.to(roomCode).emit('roomUpdated', room);
    
    // Clear and start a new turn AFK timer
    resetTurnTimer(roomCode, room);

    if (callback) callback({ success: true });
  });

  // 7. Chat message event
  socket.on('sendChatMessage', ({ text }, callback) => {
    const lookup = findRoomByPlayerSocketId(socket.id);
    if (!lookup) return;

    const { roomCode, player } = lookup;
    const trimmedText = text ? text.trim() : '';
    if (trimmedText === '') return;

    const message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: socket.id,
      senderName: player.name,
      text: trimmedText,
      timestamp: Date.now()
    };

    console.log(`[Chat] Room ${roomCode} - ${player.name}: "${trimmedText}"`);
    io.to(roomCode).emit('chatMessage', message);

    if (callback) callback({ success: true });
  });

  // 8. Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    
    const lookup = findRoomByPlayerSocketId(socket.id);
    if (lookup) {
      const { roomCode, room, player } = lookup;
      const disconnectedName = player.name;
      
      // Filter out the disconnected player
      room.players = room.players.filter(p => p.id !== socket.id);
      
      console.log(`[Leave] Player (${socket.id}) left room ${roomCode}. Remaining: ${room.players.length}`);

      // Clean up game state if active
      if (room.gameState) {
        room.gameState.players = room.gameState.players.filter(p => p.id !== socket.id);
        
        if (room.gameState.players.length === 0) {
          room.gameState.gameOver = true;
        } else {
          room.gameState.turn = room.gameState.turn % room.gameState.players.length;
        }
      }

      if (room.players.length === 0) {
        clearRoomTimer(roomCode);
        rooms.delete(roomCode);
        console.log(`[Cleanup] Empty room ${roomCode} deleted.`);
      } else {
        // Migrate host if needed
        const hasHost = room.players.some(p => p.isHost);
        if (!hasHost) {
          room.players[0].isHost = true;
          console.log(`[Host Migration] New host assigned: ${room.players[0].name} in room ${roomCode}`);
        }
        
        // Notify remaining players of the disconnect
        io.to(roomCode).emit('playerDisconnected', { playerName: disconnectedName });
        io.to(roomCode).emit('roomUpdated', room);
        resetTurnTimer(roomCode, room);
      }
    }
  });
});

// Start the server
httpServer.listen(port, () => {
  console.log(`[Server] Ludo server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});
