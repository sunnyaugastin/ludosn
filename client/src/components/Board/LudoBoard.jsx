import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../../services/socket';
import PawnToken from './PawnToken';
import { soundTokenMove } from '../../services/sound';

/* ─── Coordinate Tables ────────────────────────────────────────────────────── */

// 52-cell clockwise outer track [row, col]
const TRACK = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
];

const START_OFFSETS = { red: 0, green: 13, yellow: 26, blue: 39 };

// Home paths (5 cells each, row/col)
const HOME_PATHS = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

// Base slot positions
const BASES = {
  red:    [[2,2],[2,3],[3,2],[3,3]],
  green:  [[2,11],[2,12],[3,11],[3,12]],
  yellow: [[11,11],[11,12],[12,11],[12,12]],
  blue:   [[11,2],[11,3],[12,2],[12,3]],
};

// Safe cells (track positions that are star spots or start squares)
const SAFE_TRACK_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

function getCoords(color, tokenId, pos) {
  if (pos === -1) return BASES[color][tokenId];
  if (pos === 56) {
    // Center of the board - arrange by token id
    const centers = { red:[7,6], green:[6,7], yellow:[7,8], blue:[8,7] };
    return centers[color];
  }
  if (pos >= 51 && pos <= 55) {
    return HOME_PATHS[color][pos - 51];
  }
  if (pos >= 0 && pos <= 50) {
    const idx = (START_OFFSETS[color] + pos) % 52;
    return TRACK[idx];
  }
  return [0, 0];
}

function isStarSpot(trackPos) {
  return SAFE_TRACK_POSITIONS.includes(trackPos);
}

/* ─── Cell colors ──────────────────────────────────────────────────────────── */
const QUADRANT_COLORS = {
  red:    '#FF2E2E',
  green:  '#00C853',
  blue:   '#2196F3',
  yellow: '#FFE013',
};

const HOME_PATH_BG = {
  red:    '#FF2E2E',
  green:  '#00C853',
  yellow: '#FFE013',
  blue:   '#2196F3',
};

/* ─── LudoBoard ─────────────────────────────────────────────────────────────── */

export default function LudoBoard({ gameState, validTokens = [], onTokenClick }) {
  // Animated display positions: color -> [pos0, pos1, pos2, pos3]
  const [displayPositions, setDisplayPositions] = useState(null);
  const animatingRef = useRef(false);
  const prevPositionsRef = useRef(null);

  /* Step-by-step token movement */
  useEffect(() => {
    if (!gameState) return;
    const newPositions = gameState.tokens;

    if (!prevPositionsRef.current) {
      prevPositionsRef.current = newPositions;
      setDisplayPositions(newPositions);
      return;
    }

    // Detect which tokens moved
    let movedColor = null, movedTokenId = null, oldPos = -1, newPos = -1;
    let tokensChangedCount = 0;

    for (const color of Object.keys(newPositions)) {
      newPositions[color].forEach((pos, id) => {
        const prev = prevPositionsRef.current[color]?.[id];
        if (prev !== pos) {
          tokensChangedCount++;
          // Only animate forward moves (ignore captures sending tokens to -1)
          if (pos > prev) {
            movedColor = color;
            movedTokenId = id;
            oldPos = prev;
            newPos = pos;
          }
        }
      });
    }

    // If multiple tokens changed (e.g., a capture) or no valid forward move found,
    // snap everything immediately to avoid animation glitches.
    if (!movedColor || animatingRef.current || tokensChangedCount > 1) {
      prevPositionsRef.current = newPositions;
      setDisplayPositions(newPositions);
      return;
    }

    // Build list of intermediate track positions
    const steps = [];
    if (oldPos === -1 && newPos === 0) {
      steps.push(0);
    } else if (newPos > oldPos && newPos <= 50) {
      for (let s = oldPos + 1; s <= newPos; s++) steps.push(s);
    } else {
      // Home path or complex move — just snap
      steps.push(newPos);
    }

    if (steps.length <= 1) {
      prevPositionsRef.current = newPositions;
      setDisplayPositions(newPositions);
      return;
    }

    // Animate step-by-step
    animatingRef.current = true;
    let stepIdx = 0;

    const animStep = () => {
      if (stepIdx >= steps.length) {
        animatingRef.current = false;
        prevPositionsRef.current = newPositions;
        setDisplayPositions(newPositions);
        return;
      }

      const currentStep = steps[stepIdx];
      stepIdx++;
      soundTokenMove();

      setDisplayPositions(prev => {
        if (!prev) return newPositions;
        return {
          ...prev,
          [movedColor]: prev[movedColor].map((p, i) =>
            i === movedTokenId ? currentStep : p
          )
        };
      });

      setTimeout(animStep, 160);
    };

    animStep();
  }, [gameState?.tokens]);

  if (!gameState) return null;

  const positions = displayPositions || gameState.tokens;
  const activePlayer = gameState.players[gameState.turn];
  const isMyTurn = activePlayer?.id === socket.id;
  const myColor = gameState.players.find(p => p.id === socket.id)?.color || '';

  // Calculate board rotation so local player's home base is always at bottom-left
  const ROTATION_MAP = {
    blue: 0,
    red: 270,
    green: 180,
    yellow: 90,
  };
  const boardRotation = ROTATION_MAP[myColor] || 0;

  // Track active player colors (useful for hiding/showing specific slots if needed, but not board colors)
  const activeColors = gameState.players.map(p => p.color);
  const isColorActive = (color) => activeColors.includes(color);

  /* Build cell → tokens map */
  const cellMap = {};
  Object.keys(positions).forEach(color => {
    positions[color].forEach((pos, tokenId) => {
      const [r, c] = getCoords(color, tokenId, pos);
      const key = `${r},${c}`;
      if (!cellMap[key]) cellMap[key] = [];
      cellMap[key].push({ color, tokenId, pos, r, c });
    });
  });

  /* ── Cell rendering ── */
  const renderCell = (r, c) => {
    const key = `${r},${c}`;
    const tokensHere = cellMap[key] || [];

    // Determine cell background
    let cellBg = '#ffffff';
    let cellContent = null;

    // Home path cells
    if (r === 7 && c >= 1 && c <= 5) cellBg = HOME_PATH_BG.red;
    else if (c === 7 && r >= 1 && r <= 5) cellBg = HOME_PATH_BG.green;
    else if (r === 7 && c >= 9 && c <= 13) cellBg = HOME_PATH_BG.yellow;
    else if (c === 7 && r >= 9 && r <= 13) cellBg = HOME_PATH_BG.blue;

    // Start entry cells — colored to match the player
    if (r === 6 && c === 1) cellBg = '#ff9999';      // red entry — light red
    else if (r === 1 && c === 8) cellBg = '#80e6a8';  // green entry — light green
    else if (r === 8 && c === 13) cellBg = '#fff176';  // yellow entry — light yellow
    else if (r === 13 && c === 6) cellBg = '#90caf9';  // blue entry — light blue

    // Star safe spots — mark with ☆
    const isStartCell = (r === 6 && c === 1) || (r === 1 && c === 8) || (r === 8 && c === 13) || (r === 13 && c === 6);
    const isStarCell = (r === 2 && c === 6) || (r === 6 && c === 12) || (r === 8 && c === 2) || (r === 12 && c === 8);

    if ((isStarCell || isStartCell) && tokensHere.length === 0) {
      cellContent = (
        <span 
          className="text-gray-400 text-base leading-none select-none inline-block font-black"
          style={{ transform: `rotate(-${boardRotation}deg)` }}
        >
          ☆
        </span>
      );
    }

    // Entry arrows at start squares
    const arrows = { '6,1': '→', '1,8': '↓', '8,13': '←', '13,6': '↑' };
    if (arrows[`${r},${c}`] && tokensHere.length === 0) {
      const arrowColors = { '6,1':'text-red-500', '1,8':'text-green-600', '8,13':'text-yellow-600', '13,6':'text-blue-600' };
      cellContent = (
        <span className={`font-black text-base leading-none select-none ${arrowColors[`${r},${c}`]}`}>
          {arrows[`${r},${c}`]}
        </span>
      );
    }

    // Render tokens in this cell
    if (tokensHere.length > 0) {
      cellContent = (
        <div className="relative w-full h-full flex items-center justify-center">
          {tokensHere.map((t, idx) => {
            const isClickable = isMyTurn && t.color === myColor && validTokens.includes(t.tokenId) && !animatingRef.current;
            const stacked = tokensHere.length > 1;
            const offsets = [
              { x: stacked ? -4 : 0, y: stacked ? -4 : 0 },
              { x: stacked ? 4  : 0, y: stacked ? 4  : 0 },
              { x: stacked ? -4 : 0, y: stacked ? 4  : 0 },
              { x: stacked ? 4  : 0, y: stacked ? -4 : 0 },
            ];
            const off = offsets[idx] || { x: 0, y: 0 };

            return (
              <div
                key={`${t.color}-${t.tokenId}`}
                onClick={() => isClickable && onTokenClick(t.tokenId)}
                className={`absolute transition-all duration-500 ease-out flex items-center justify-center ${isClickable ? 'cursor-pointer z-20' : 'z-10'}`}
                style={{ 
                  transform: `translate(${off.x}px, ${off.y}px) rotate(-${boardRotation}deg)`,
                  width: '28px',
                  height: '36px',
                }}
              >
                <PawnToken
                  color={t.color}
                  size={stacked ? 20 : 26}
                  isClickable={isClickable}
                  isSmall={stacked}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div
        key={`${r}-${c}`}
        className="border border-gray-200 flex items-center justify-center relative overflow-visible"
        style={{
          gridRowStart: r + 1,
          gridColumnStart: c + 1,
          backgroundColor: cellBg,
        }}
      >
        {cellContent}
      </div>
    );
  };

  /* ── Track + home path cells (all non-quadrant cells) ── */
  const trackCells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Skip quadrant areas (those are big colored blocks)
      const inRedQ    = r < 6 && c < 6;
      const inGreenQ  = r < 6 && c > 8;
      const inBlueQ   = r > 8 && c < 6;
      const inYellowQ = r > 8 && c > 8;
      const inCenter  = r >= 6 && r <= 8 && c >= 6 && c <= 8;
      if (inRedQ || inGreenQ || inBlueQ || inYellowQ || inCenter) continue;
      trackCells.push({ r, c });
    }
  }

  /* Render base token slots in each quadrant (solid colored circles when empty) */
  const renderBaseSlots = (color) => {
    const tokenPositions = positions[color] || [];
    return BASES[color].map(([br, bc], slotIdx) => {
      const tokenHere = tokenPositions[slotIdx] === -1 ? slotIdx : null;
      return (
        <div
          key={`base-${color}-${slotIdx}`}
          className="rounded-full border border-gray-300 flex items-center justify-center shadow-inner transition-all"
          style={{ 
            width: '36%', 
            height: '36%',
            backgroundColor: QUADRANT_COLORS[color],
          }}
        >
          {tokenHere !== null && (() => {
            const isClickable = isMyTurn && color === myColor && validTokens.includes(tokenHere);
            return (
              <div
                onClick={() => isClickable && onTokenClick(tokenHere)}
                className={`flex items-center justify-center ${isClickable ? 'cursor-pointer' : ''}`}
                style={{ transform: `rotate(-${boardRotation}deg)` }}
              >
                <PawnToken color={color} size={22} isClickable={isClickable} />
              </div>
            );
          })()}
        </div>
      );
    });
  };

  const quadrantLabel = (color, label) => (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="w-[62%] h-[62%] rounded-xl bg-white flex flex-wrap gap-[6%] items-center justify-center p-[6%] shadow-inner"
        style={{ 
          zIndex: 1, 
          pointerEvents: 'auto',
          border: `3px solid ${QUADRANT_COLORS[color]}`,
        }}
      >
        {renderBaseSlots(color)}
      </div>
    </div>
  );

  return (
    <div
      className="w-full max-w-[520px] aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-300 relative select-none"
      style={{ 
        boxShadow: '0 8px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        transform: `rotate(${boardRotation}deg)`,
        transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
    >
      {/* 15×15 CSS Grid */}
      <div
        className="w-full h-full relative"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          gridTemplateRows: 'repeat(15, 1fr)',
        }}
      >
        {/* ── RED quadrant (top-left, rows 1-6, cols 1-6) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500"
          style={{
            gridRow: '1 / 7', gridColumn: '1 / 7',
            backgroundColor: QUADRANT_COLORS.red,
          }}
        >
          {quadrantLabel('red', 'RED')}
        </div>

        {/* ── GREEN quadrant (top-right, rows 1-6, cols 10-15) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500"
          style={{
            gridRow: '1 / 7', gridColumn: '10 / 16',
            backgroundColor: QUADRANT_COLORS.green,
          }}
        >
          {quadrantLabel('green', 'GREEN')}
        </div>

        {/* ── BLUE quadrant (bottom-left, rows 10-15, cols 1-6) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500"
          style={{
            gridRow: '10 / 16', gridColumn: '1 / 7',
            backgroundColor: QUADRANT_COLORS.blue,
          }}
        >
          {quadrantLabel('blue', 'BLUE')}
        </div>

        {/* ── YELLOW quadrant (bottom-right, rows 10-15, cols 10-15) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500"
          style={{
            gridRow: '10 / 16', gridColumn: '10 / 16',
            backgroundColor: QUADRANT_COLORS.yellow,
          }}
        >
          {quadrantLabel('yellow', 'YELLOW')}
        </div>

        {/* ── CENTER star (rows 7-9, cols 7-9) ── */}
        <div
          style={{ gridRow: '7 / 10', gridColumn: '7 / 10', position: 'relative' }}
        >
          <svg viewBox="0 0 90 90" className="w-full h-full absolute inset-0">
            <polygon points="0,0 45,45 0,90"   fill={QUADRANT_COLORS.red}    />
            <polygon points="0,0 90,0 45,45"   fill={QUADRANT_COLORS.green}  />
            <polygon points="90,0 90,90 45,45" fill={QUADRANT_COLORS.yellow} />
            <polygon points="0,90 45,45 90,90" fill={QUADRANT_COLORS.blue}   />
            <text 
              x="45" 
              y="54" 
              textAnchor="middle" 
              fontSize="26" 
              fill="#94a3b8" 
              fontWeight="bold" 
              opacity="0.85"
              style={{ transform: `rotate(-${boardRotation}deg)`, transformOrigin: '45px 45px' }}
            >
              ☆
            </text>
          </svg>
        </div>

        {/* ── TRACK CELLS ── */}
        {trackCells.map(({ r, c }) => renderCell(r, c))}
      </div>
    </div>
  );
}
