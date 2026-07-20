import React from 'react';

const COLOR_MAP = {
  red:    { fill: '#FF2E2E', dark: '#b91c1c', shadow: '#7f1d1d', highlight: '#fecaca', ring: '#dc2626' },
  green:  { fill: '#00C853', dark: '#15803d', shadow: '#14532d', highlight: '#bbf7d0', ring: '#16a34a' },
  blue:   { fill: '#2196F3', dark: '#1d4ed8', shadow: '#1e3a8a', highlight: '#bfdbfe', ring: '#2563eb' },
  yellow: { fill: '#FFE013', dark: '#a16207', shadow: '#713f12', highlight: '#fef08a', ring: '#ca8a04' },
};

/**
 * PawnToken — Traditional Ludo pawn with colored ring base and teardrop pin.
 * Matches the reference image style: wide colored ring, white pin body, glossy colored sphere.
 */
export default function PawnToken({ color = 'red', size = 28, isClickable = false, isSmall = false }) {
  const { fill, dark, shadow, highlight, ring } = COLOR_MAP[color] || COLOR_MAP.red;
  const s = isSmall ? size * 0.72 : size;

  // Stable gradient IDs per color
  const id = `pawn-${color}`;

  return (
    <svg
      width={s}
      height={s * 1.35}
      viewBox="0 0 36 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-200 ${isClickable ? 'animate-bounce cursor-pointer' : ''}`}
      style={{
        filter: isClickable
          ? `drop-shadow(0 0 6px ${fill}aa) drop-shadow(0 3px 5px rgba(0,0,0,0.2))`
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
      }}
    >
      <defs>
        {/* Pin body gradient (white → light gray) */}
        <linearGradient id={`${id}-pin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        {/* Ring gradient (color → darker) */}
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>

        {/* Glossy center sphere */}
        <radialGradient id={`${id}-sphere`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="30%" stopColor={fill} />
          <stop offset="80%" stopColor={ring} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
      </defs>

      {/* ── Colored Ring Base ── */}
      {/* Outer ring (colored) */}
      <ellipse
        cx="18"
        cy="40"
        rx="14"
        ry="5.5"
        fill={`url(#${id}-ring)`}
        stroke={shadow}
        strokeWidth="0.8"
      />
      {/* Inner ring hole (white) */}
      <ellipse
        cx="18"
        cy="39.5"
        rx="8"
        ry="3.2"
        fill="#ffffff"
        stroke={shadow}
        strokeWidth="0.5"
      />

      {/* ── White Teardrop Pin Body ── */}
      <path
        d="M18 36C17 33.5 10 24 10 18C10 13.58 13.58 10 18 10C22.42 10 26 13.58 26 18C26 24 19 33.5 18 36Z"
        fill={`url(#${id}-pin)`}
        stroke="#64748b"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* ── Glossy Colored Center Sphere ── */}
      <circle
        cx="18"
        cy="18"
        r="5.8"
        fill={`url(#${id}-sphere)`}
        stroke="#475569"
        strokeWidth="0.6"
      />

      {/* Gloss highlight on sphere */}
      <ellipse
        cx="16.5"
        cy="16"
        rx="2.5"
        ry="2"
        fill="white"
        opacity="0.35"
      />
    </svg>
  );
}
