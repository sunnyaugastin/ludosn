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
  [7,0],[6,0]
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
  if (!color || !BASES[color] || !HOME_PATHS[color] || START_OFFSETS[color] === undefined) {
    return [0, 0];
  }
  if (pos === -1) return BASES[color][tokenId] || [0, 0];
  if (pos === 56) {
    const centers = { red:[7,6], green:[6,7], yellow:[7,8], blue:[8,7] };
    return centers[color] || [7, 7];
  }
  if (pos >= 51 && pos <= 55) {
    return HOME_PATHS[color][pos - 51] || [0, 0];
  }
  if (pos >= 0 && pos <= 50) {
    const idx = (START_OFFSETS[color] + pos) % 52;
    return TRACK[idx] || [0, 0];
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

export default function LudoBoard({ gameState, validTokens = [], onTokenClick, tokenStyle = 'pawn' }) {
  // Animated display positions: color -> [pos0, pos1, pos2, pos3]
  const [displayPositions, setDisplayPositions] = useState(null);
  const [trailCellKey, setTrailCellKey] = useState(null);
  const animatingRef = useRef(false);
  const prevPositionsRef = useRef(null);

  /* Step-by-step token movement & capture animation */
  useEffect(() => {
    const newPositions = gameState?.tokens;
    if (!newPositions) return;

    if (!prevPositionsRef.current) {
      prevPositionsRef.current = newPositions;
      setDisplayPositions(newPositions);
      return;
    }

    // Detect forward moved token and captured token
    let movedColor = null, movedTokenId = null, oldPos = -1, newPos = -1;
    let capturedColor = null, capturedTokenId = null, capturedOldPos = -1;

    for (const color of Object.keys(newPositions)) {
      newPositions[color].forEach((pos, id) => {
        const prev = prevPositionsRef.current[color]?.[id];
        if (prev !== undefined && prev !== pos) {
          if (pos > prev) {
            movedColor = color;
            movedTokenId = id;
            oldPos = prev;
            newPos = pos;
          } else if (pos === -1 && prev >= 0) {
            capturedColor = color;
            capturedTokenId = id;
            capturedOldPos = prev;
          }
        }
      });
    }

    if (!movedColor || animatingRef.current) {
      prevPositionsRef.current = newPositions;
      setDisplayPositions(newPositions);
      return;
    }

    // Forward steps
    const forwardSteps = [];
    if (oldPos === -1 && newPos === 0) {
      forwardSteps.push(0);
    } else if (newPos > oldPos && newPos <= 56) {
      for (let s = oldPos + 1; s <= newPos; s++) forwardSteps.push(s);
    } else {
      forwardSteps.push(newPos);
    }

    // Captured reverse steps
    const backwardSteps = [];
    if (capturedColor && capturedOldPos >= 0) {
      for (let s = capturedOldPos - 1; s >= -1; s--) backwardSteps.push(s);
    }

    animatingRef.current = true;
    let stepIdx = 0;

    const runForwardAnimation = () => {
      if (stepIdx >= forwardSteps.length) {
        setTrailCellKey(null);
        if (backwardSteps.length > 0) {
          runBackwardAnimation();
        } else {
          animatingRef.current = false;
          prevPositionsRef.current = newPositions;
          setDisplayPositions(newPositions);
        }
        return;
      }

      const currentStep = forwardSteps[stepIdx];
      const prevStep = stepIdx === 0 ? oldPos : forwardSteps[stepIdx - 1];
      stepIdx++;

      if (prevStep >= 0 && prevStep <= 55) {
        const [tr, tc] = getCoords(movedColor, movedTokenId, prevStep);
        setTrailCellKey(`${tr},${tc}`);
      } else {
        setTrailCellKey(null);
      }

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

      setTimeout(runForwardAnimation, 230);
    };

    let backIdx = 0;
    const runBackwardAnimation = () => {
      if (backIdx >= backwardSteps.length) {
        setTrailCellKey(null);
        animatingRef.current = false;
        prevPositionsRef.current = newPositions;
        setDisplayPositions(newPositions);
        return;
      }

      const currentBackStep = backwardSteps[backIdx];
      backIdx++;
      soundTokenMove();

      setDisplayPositions(prev => {
        if (!prev) return newPositions;
        return {
          ...prev,
          [capturedColor]: prev[capturedColor].map((p, i) =>
            i === capturedTokenId ? currentBackStep : p
          )
        };
      });

      setTimeout(runBackwardAnimation, 90);
    };

    runForwardAnimation();
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
  if (positions) {
    Object.keys(positions).forEach(color => {
      const tokenList = positions[color];
      if (Array.isArray(tokenList)) {
        tokenList.forEach((pos, tokenId) => {
          const coords = getCoords(color, tokenId, pos);
          if (Array.isArray(coords)) {
            const [r, c] = coords;
            const key = `${r},${c}`;
            if (!cellMap[key]) cellMap[key] = [];
            cellMap[key].push({ color, tokenId, pos, r, c });
          }
        });
      }
    });
  }

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
            
            // Dynamic clustering logic based on how many tokens share this cell
            const count = tokensHere.length;
            let scaleSize = 20;
            let off = { x: 0, y: 0 };
            
            if (count === 2) {
              scaleSize = 15;
              off = idx === 0 ? { x: -5, y: 0 } : { x: 5, y: 0 };
            } else if (count === 3) {
              scaleSize = 13;
              if (idx === 0) off = { x: 0, y: -4 };
              else if (idx === 1) off = { x: -5, y: 4 };
              else off = { x: 5, y: 4 };
            } else if (count >= 4) {
              scaleSize = 12;
              const gridOffsets = [
                { x: -5, y: -5 },
                { x: 5, y: -5 },
                { x: -5, y: 5 },
                { x: 5, y: 5 },
              ];
              off = gridOffsets[idx % 4];
            }

            return (
              <div
                key={`${t.color}-${t.tokenId}`}
                onClick={() => isClickable && onTokenClick(t.tokenId)}
                className={`absolute inset-0 transition-all duration-500 ease-out flex items-center justify-center ${isClickable ? 'cursor-pointer z-20' : 'z-10'}`}
                style={{ 
                  transform: `translate(${off.x}px, ${off.y}px) rotate(-${boardRotation}deg)`,
                }}
              >
                {/* Tightly fit spinning dashed selection ring for clickable token */}
                {isClickable && (
                  <div className="absolute pointer-events-none flex items-center justify-center z-25" style={{ width: scaleSize*1.5, height: scaleSize*1.5 }}>
                    <svg className="w-full h-full animate-spin" viewBox="0 0 32 32" style={{ animationDuration: '3.5s' }}>
                      <circle
                        cx="16" cy="16" r="14.5"
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                        opacity="0.95"
                      />
                    </svg>
                  </div>
                )}
                <PawnToken
                  color={t.color}
                  size={scaleSize}
                  isClickable={isClickable}
                  tokenStyle={tokenStyle}
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
        {/* Footprint trail shadow on cell where token just stepped from */}
        {key === trailCellKey && (
          <div className="absolute inset-1 bg-black/20 rounded-full animate-ping border border-dashed border-gray-500/70 pointer-events-none z-5" />
        )}
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
                className={`relative flex items-center justify-center ${isClickable ? 'cursor-pointer' : ''}`}
                style={{ transform: `rotate(-${boardRotation}deg)` }}
              >
                {/* Tightly fit spinning dashed selection ring for clickable base token */}
                {isClickable && (
                  <div className="absolute inset-[-3px] pointer-events-none flex items-center justify-center z-25">
                    <svg className="w-full h-full animate-spin" viewBox="0 0 32 32" style={{ animationDuration: '3.5s' }}>
                      <circle
                        cx="16" cy="16" r="14"
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        opacity="0.95"
                      />
                    </svg>
                  </div>
                )}
                <PawnToken color={color} size={15} isClickable={isClickable} tokenStyle={tokenStyle} />
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
      className="w-full max-w-[520px] aspect-square bg-white rounded-2xl shadow-2xl border-2 border-gray-300 relative select-none"
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
          className="relative border border-gray-250 transition-colors duration-500 rounded-tl-2xl"
          style={{
            gridRow: '1 / 7', gridColumn: '1 / 7',
            backgroundColor: QUADRANT_COLORS.red,
          }}
        >
          {quadrantLabel('red', 'RED')}
        </div>

        {/* ── GREEN quadrant (top-right, rows 1-6, cols 10-15) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500 rounded-tr-2xl"
          style={{
            gridRow: '1 / 7', gridColumn: '10 / 16',
            backgroundColor: QUADRANT_COLORS.green,
          }}
        >
          {quadrantLabel('green', 'GREEN')}
        </div>

        {/* ── BLUE quadrant (bottom-left, rows 10-15, cols 1-6) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500 rounded-bl-2xl"
          style={{
            gridRow: '10 / 16', gridColumn: '1 / 7',
            backgroundColor: QUADRANT_COLORS.blue,
          }}
        >
          {quadrantLabel('blue', 'BLUE')}
        </div>

        {/* ── YELLOW quadrant (bottom-right, rows 10-15, cols 10-15) ── */}
        <div
          className="relative border border-gray-250 transition-colors duration-500 rounded-br-2xl"
          style={{
            gridRow: '10 / 16', gridColumn: '10 / 16',
            backgroundColor: QUADRANT_COLORS.yellow,
          }}
        >
          {quadrantLabel('yellow', 'YELLOW')}
        </div>

        {/* ── CENTER star + Home Tokens (rows 7-9, cols 7-9) ── */}
        <div
          style={{ gridRow: '7 / 10', gridColumn: '7 / 10', position: 'relative' }}
          className="overflow-visible"
        >
          <svg viewBox="0 0 90 90" className="w-full h-full absolute inset-0">
            <polygon points="0,0 45,45 0,90"   fill={QUADRANT_COLORS.red}    />
            <polygon points="0,0 90,0 45,45"   fill={QUADRANT_COLORS.green}  />
            <polygon points="90,0 90,90 45,45" fill={QUADRANT_COLORS.yellow} />
            <polygon points="0,90 45,45 90,90" fill={QUADRANT_COLORS.blue}   />
            {/* Minimalist 2D Center Emblem */}
            <g style={{ transform: `rotate(-${boardRotation}deg)`, transformOrigin: '45px 45px' }}>
              <circle cx="45" cy="45" r="13.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.8" />
              <polygon
                points="45,36.5 47.4,41.4 52.8,42.2 48.9,46 49.8,51.4 45,48.8 40.2,51.4 41.1,46 37.2,42.2 42.6,41.4"
                fill="#f8fafc"
                stroke="#64748b"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>
          </svg>

          {/* Render tokens that reached home center (pos === 56) */}
          {['red', 'green', 'yellow', 'blue'].map(color => {
            const tokenList = positions[color] || [];
            const homeTokens = tokenList
              .map((pos, tokenId) => ({ pos, tokenId }))
              .filter(t => t.pos === 56);

            if (homeTokens.length === 0) return null;

            const tipPositions = {
              red:    { top: '33.3%', left: '8%' },
              green:  { top: '8%', left: '33.3%' },
              yellow: { top: '33.3%', left: '58%' },
              blue:   { top: '58%', left: '33.3%' },
            };

            const posStyle = tipPositions[color];

            return (
              <div
                key={`home-tokens-${color}`}
                className="absolute flex items-center justify-center pointer-events-none z-30"
                style={{
                  top: posStyle.top,
                  left: posStyle.left,
                  width: '33.3%',
                  height: '33.3%',
                  transform: `rotate(-${boardRotation}deg)`,
                }}
              >
                {homeTokens.map((t) => (
                  <div key={`home-${color}-${t.tokenId}`} className="absolute">
                    <PawnToken color={color} size={15} isSmall={true} tokenStyle={tokenStyle} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* ── TRACK CELLS ── */}
        {trackCells.map(({ r, c }) => renderCell(r, c))}
      </div>
    </div>
  );
}
