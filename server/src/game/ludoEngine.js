// 52 common track cells in clockwise order starting from Red start cell (6, 1)
export const TRACK_COORDINATES = [
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // Left arm top row
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }, // Top arm left col
  { r: 0, c: 7 }, // Top arm middle top cell
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // Top arm right col
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // Right arm top row
  { r: 7, c: 14 }, // Right arm middle right cell
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // Right arm bottom row
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // Bottom arm right col
  { r: 14, c: 7 }, // Bottom arm middle bottom cell
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // Bottom arm left col
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 }, // Left arm bottom row
  { r: 7, c: 0 }, // Left arm middle left cell
  { r: 6, c: 0 }  // Left arm top-left cell
];

// Color offsets mapping starting index on the 52-cell outer track loop
export const START_OFFSETS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Safe spots by coordinate values (includes start cells and star cells)
export const SAFE_COORDINATES = [
  { r: 6, c: 1 }, { r: 8, c: 2 },   // Red safe zones
  { r: 1, c: 8 }, { r: 2, c: 6 },   // Green safe zones
  { r: 8, c: 13 }, { r: 6, c: 12 }, // Yellow safe zones
  { r: 13, c: 6 }, { r: 12, c: 8 }  // Blue safe zones
];

// Check if a specific global coordinate is a safe cell
export function isSafeCell(r, c) {
  return SAFE_COORDINATES.some(cell => cell.r === r && cell.c === c);
}

// Convert relative position to absolute grid row/col coordinates
export function getAbsoluteCoordinates(color, tokenId, pos) {
  // Base Positions (pos === -1)
  if (pos === -1) {
    const bases = {
      red:    [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
      green:  [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
      blue:   [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],
      yellow: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }]
    };
    return bases[color][tokenId];
  }

  // Home Yard (pos === 56) - center triangle quadrants
  if (pos === 56) {
    const homeCenters = {
      red: { r: 7, c: 6 },
      green: { r: 6, c: 7 },
      yellow: { r: 7, c: 8 },
      blue: { r: 8, c: 7 }
    };
    return homeCenters[color];
  }

  // Home Path (pos 51-55)
  if (pos >= 51 && pos <= 55) {
    const offset = pos - 50; // 1 to 5
    switch (color) {
      case 'red':    return { r: 7, c: offset };          // row 7, cols 1-5
      case 'green':  return { r: offset, c: 7 };          // col 7, rows 1-5
      case 'yellow': return { r: 7, c: 14 - offset };     // row 7, cols 13-9
      case 'blue':   return { r: 14 - offset, c: 7 };     // col 7, rows 13-9
    }
  }

  // Outer Common Track (pos 0-50)
  if (pos >= 0 && pos <= 50) {
    const startIndex = START_OFFSETS[color];
    const globalIndex = (startIndex + pos) % 52;
    return TRACK_COORDINATES[globalIndex];
  }

  return { r: 0, c: 0 };
}

// Core Ludo State Initializer
export function initializeGame(playersList) {
  let players;

  if (playersList.length === 2) {
    const p1 = playersList[0];
    const p2 = playersList[1];
    let c1 = p1.color;
    let c2 = p2.color;

    const opposites = { red: 'yellow', yellow: 'red', green: 'blue', blue: 'green' };

    if (c1 && !c2) {
      c2 = opposites[c1];
    } else if (c2 && !c1) {
      c1 = opposites[c2];
    } else if (c1 && c2) {
      if (c1 === c2 || opposites[c1] !== c2) {
        c2 = opposites[c1];
      }
    } else {
      c1 = 'red';
      c2 = 'yellow';
    }

    players = [
      { id: p1.id, name: p1.name, color: c1, colorIndex: 0 },
      { id: p2.id, name: p2.name, color: c2, colorIndex: 1 }
    ];
  } else {
    const defaultColors = ['red', 'green', 'blue', 'yellow'];
    const usedColors = playersList.map(p => p.color).filter(Boolean);
    let fallbackIdx = 0;
    const getFallback = () => {
      while (usedColors.includes(defaultColors[fallbackIdx])) fallbackIdx++;
      const c = defaultColors[fallbackIdx];
      fallbackIdx++;
      return c;
    };

    players = playersList.map((p, idx) => ({
      id: p.id,
      name: p.name,
      color: p.color || getFallback(),
      colorIndex: idx,
    }));
  }

  const tokens = {};
  players.forEach(p => {
    tokens[p.color] = [-1, -1, -1, -1];
  });

  return {
    players,
    tokens,
    turn: 0,
    diceValue: null,
    hasRolled: false,
    consecutiveSixes: 0,
    winner: null,
    gameOver: false,
  };
}

// Compute valid tokens that can move given the current rolled value
export function getValidMoves(gameState, color, rollValue) {
  if (!rollValue || !gameState.tokens[color]) return [];

  const validTokens = [];
  const playerTokens = gameState.tokens[color];

  playerTokens.forEach((pos, tokenId) => {
    // 1. If in base: requires exactly a 6 to exit to start cell (0)
    if (pos === -1) {
      if (rollValue === 6) {
        validTokens.push(tokenId);
      }
    }
    // 2. If on the board: valid if it doesn't overshoot home yard (56)
    else if (pos >= 0 && pos < 56) {
      if (pos + rollValue <= 56) {
        validTokens.push(tokenId);
      }
    }
  });

  return validTokens;
}

// Advances the turn to the next eligible player
export function advanceTurn(gameState) {
  gameState.diceValue = null;
  gameState.hasRolled = false;
  gameState.consecutiveSixes = 0;

  if (gameState.gameOver) return;

  const totalPlayers = gameState.players.length;
  let nextTurn = (gameState.turn + 1) % totalPlayers;

  // Ensure next turn is updated
  gameState.turn = nextTurn;
}

// Server Roll Dice Trigger
export function handleRollDice(gameState, playerId) {
  if (!gameState || gameState.gameOver) return { success: false, message: 'Game is over.' };
  
  const activePlayer = gameState.players?.[gameState.turn];
  if (!activePlayer || activePlayer.id !== playerId) {
    return { success: false, message: 'Not your turn.' };
  }
  if (gameState.hasRolled) {
    return { success: false, message: 'Already rolled this turn.' };
  }

  // Roll standard 1-6
  const roll = Math.floor(Math.random() * 6) + 1;
  gameState.diceValue = roll;
  gameState.hasRolled = true;

  console.log(`[Engine] ${activePlayer.name} rolled a ${roll}`);

  // Rule: 3 consecutive sixes forfeits the turn immediately
  if (roll === 6) {
    gameState.consecutiveSixes += 1;
    if (gameState.consecutiveSixes === 3) {
      console.log(`[Engine] ${activePlayer.name} rolled three 6s in a row. Turn forfeited.`);
      advanceTurn(gameState);
      return { success: true, rolled: roll, turnPassed: true, message: 'Three consecutive 6s! Turn passed.' };
    }
  } else {
    gameState.consecutiveSixes = 0;
  }

  // Check if player has any valid moves
  const validTokens = getValidMoves(gameState, activePlayer.color, roll);
  if (validTokens.length === 0) {
    // Return flag indicating auto-pass is required
    return { success: true, rolled: roll, hasNoMoves: true };
  }

  return { success: true, rolled: roll, hasNoMoves: false, validTokens };
}

// Server Move Token Trigger
export function handleMoveToken(gameState, playerId, tokenId) {
  if (!gameState || gameState.gameOver) return { success: false, message: 'Game is over.' };
  
  const activePlayer = gameState.players?.[gameState.turn];
  if (!activePlayer || activePlayer.id !== playerId) {
    return { success: false, message: 'Not your turn.' };
  }
  if (!gameState.hasRolled) {
    return { success: false, message: 'Must roll dice first.' };
  }

  const color = activePlayer.color;
  const validTokens = getValidMoves(gameState, color, gameState.diceValue);
  
  if (!validTokens.includes(tokenId)) {
    return { success: false, message: 'Invalid token selection.' };
  }

  const oldPos = gameState.tokens[color][tokenId];
  let newPos = oldPos === -1 ? 0 : oldPos + gameState.diceValue;

  // Move token
  gameState.tokens[color][tokenId] = newPos;
  console.log(`[Engine] Moved ${color} token ${tokenId} from ${oldPos} to ${newPos}`);

  let isCapture = false;
  let reachedHome = (newPos === 56);
  let capturedPlayer = null;

  // Check capture condition if token is on common outer tracks (0 to 50)
  if (newPos >= 0 && newPos <= 50) {
    const myCoords = getAbsoluteCoordinates(color, tokenId, newPos);
    const safe = isSafeCell(myCoords.r, myCoords.c);

    if (!safe) {
      // Loop over other players
      gameState.players.forEach(otherPlayer => {
        if (otherPlayer.color !== color) {
          const otherTokens = gameState.tokens[otherPlayer.color];
          otherTokens.forEach((otherPos, otherTokenId) => {
            if (otherPos >= 0 && otherPos <= 50) {
              const otherCoords = getAbsoluteCoordinates(otherPlayer.color, otherTokenId, otherPos);
              if (myCoords.r === otherCoords.r && myCoords.c === otherCoords.c) {
                // Landed on opponent! Reset opponent token to base (-1)
                gameState.tokens[otherPlayer.color][otherTokenId] = -1;
                isCapture = true;
                capturedPlayer = otherPlayer;
                console.log(`[Engine] CAPTURE! ${color} captured ${otherPlayer.color} token ${otherTokenId}`);
              }
            }
          });
        }
      });
    }
  }

  // Check victory: color wins if all 4 of their tokens are at position 56
  const hasWon = gameState.tokens[color].every(pos => pos === 56);
  if (hasWon) {
    gameState.winner = activePlayer.id;
    gameState.gameOver = true;
    console.log(`[Engine] Victory! ${activePlayer.name} has won the game!`);
    return { success: true };
  }

  // Rule: Rolling a 6, capturing a token, or getting a token home grants a bonus turn
  const getsBonusTurn = (gameState.diceValue === 6 || isCapture || reachedHome);
  let bonusReason = null;
  if (getsBonusTurn) {
    if (gameState.diceValue === 6) bonusReason = 'rolled a 6';
    else if (isCapture) bonusReason = 'captured a token';
    else if (reachedHome) bonusReason = 'reached home';
  }

  if (getsBonusTurn) {
    console.log(`[Engine] Bonus turn granted to ${activePlayer.name} (${bonusReason})`);
    const rolledSix = (gameState.diceValue === 6);
    gameState.diceValue = null;
    gameState.hasRolled = false;
    if (!rolledSix) {
      gameState.consecutiveSixes = 0;
    }
  } else {
    advanceTurn(gameState);
  }

  return { 
    success: true,
    capturedPlayer: capturedPlayer,
    bonusTurn: getsBonusTurn,
    bonusReason
  };
}
