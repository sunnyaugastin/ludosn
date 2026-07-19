import React from 'react';

const COLOR_MAP = {
  red:    { fill: '#FF2E2E', shadow: '#b91c1c', highlight: '#ffe4e6', outline: '#4c0519' },
  green:  { fill: '#00C853', shadow: '#15803d', highlight: '#dcfce7', outline: '#052e16' },
  blue:   { fill: '#2196F3', shadow: '#1d4ed8', highlight: '#dbeafe', outline: '#172554' },
  yellow: { fill: '#FFE013', shadow: '#a16207', highlight: '#fef9c3', outline: '#422006' },
};

/**
 * PawnToken — classic cone-shaped Ludo pawn SVG
 * @param {string} color - 'red' | 'green' | 'blue' | 'yellow'
 * @param {number} size - px size (default 28)
 * @param {boolean} isClickable - Adds glow ring + bounce
 * @param {boolean} isSmall - Smaller size for stacked tokens
 */
export default function PawnToken({ color = 'red', size = 28, isClickable = false, isSmall = false }) {
  const { fill, shadow, highlight, outline } = COLOR_MAP[color] || COLOR_MAP.red;
  const s = isSmall ? size * 0.72 : size;

  return (
    <svg
      width={s}
      height={s * 1.2}
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md transition-transform duration-200 ${isClickable ? 'animate-bounce drop-shadow-lg' : ''}`}
      style={{
        filter: isClickable
          ? `drop-shadow(0 0 6px ${fill})`
          : `drop-shadow(0 2px 3px ${shadow}66)`,
      }}
    >
      {/* Base oval */}
      <ellipse cx="14" cy="30" rx="9" ry="3.2" fill={shadow} stroke={outline} strokeWidth="1" />

      {/* Body stem */}
      <path
        d="M9 22 C8 18, 6 14, 8 10 C9 7, 11 5.5, 14 5.5 C17 5.5, 19 7, 20 10 C22 14, 20 18, 19 22 Z"
        fill={fill}
        stroke={outline}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Head dome */}
      <circle cx="14" cy="7" r="6" fill={fill} stroke={outline} strokeWidth="1" />

      {/* Head highlight */}
      <ellipse cx="11.5" cy="4.5" rx="2.5" ry="2" fill={highlight} opacity="0.65" />

      {/* Body highlight */}
      <path
        d="M11 14 C10.5 11.5, 11.5 9, 13 8.5"
        stroke={highlight}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* White ring / collar */}
      <ellipse cx="14" cy="13.5" rx="5" ry="1.8" fill="white" stroke={outline} strokeWidth="0.8" opacity="0.4" />

      {/* Base flat */}
      <path
        d="M6 27.5 Q14 30.5 22 27.5 L20 22 Q14 24.5 8 22 Z"
        fill={shadow}
        stroke={outline}
        strokeWidth="0.8"
      />
    </svg>
  );
}
