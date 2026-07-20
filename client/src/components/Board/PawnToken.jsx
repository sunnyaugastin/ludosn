import React from 'react';

const COLOR_MAP = {
  red:    { fill: '#FF2E2E', shadow: '#9f1239', highlight: '#fecaca', border: '#e11d48' },
  green:  { fill: '#00C853', shadow: '#14532d', highlight: '#bbf7d0', border: '#16a34a' },
  blue:   { fill: '#2196F3', shadow: '#1e3a8a', highlight: '#bfdbfe', border: '#2563eb' },
  yellow: { fill: '#FFE013', shadow: '#713f12', highlight: '#fef08a', border: '#ca8a04' },
};

/**
 * PawnToken — Map-pin style pawn based on design image.
 * Consists of a flat colored base ring and a standing 3D white pin with a glossy colored center.
 */
export default function PawnToken({ color = 'red', size = 28, isClickable = false, isSmall = false }) {
  const { fill, shadow, highlight, border } = COLOR_MAP[color] || COLOR_MAP.red;
  const s = isSmall ? size * 0.72 : size;

  // Unique gradient IDs to prevent conflicts
  const pinGradId = `pin-grad-${color}`;
  const ringGradId = `ring-grad-${color}`;
  const centerGradId = `center-grad-${color}`;

  return (
    <svg
      width={s}
      height={s * 1.3}
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-200 ${isClickable ? 'animate-bounce cursor-pointer' : ''}`}
      style={{
        filter: isClickable
          ? `drop-shadow(0 0 5px ${fill}cc) drop-shadow(0 4px 6px rgba(0,0,0,0.15))`
          : 'drop-shadow(0 3px 5px rgba(0,0,0,0.12))',
      }}
    >
      <defs>
        {/* White pin body shading */}
        <linearGradient id={pinGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Flat ring 3D shading */}
        <linearGradient id={ringGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>

        {/* 3D Glassy Sphere Center */}
        <radialGradient id={centerGradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="35%" stopColor={fill} />
          <stop offset="85%" stopColor={border} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
      </defs>

      {/* 3D Flat Base Ring */}
      <ellipse
        cx="16"
        cy="33"
        rx="11"
        ry="4.5"
        fill={`url(#${ringGradId})`}
        stroke="#475569"
        strokeWidth="0.8"
      />
      <ellipse
        cx="16"
        cy="32.5"
        rx="7"
        ry="2.8"
        fill="#ffffff"
        stroke="#475569"
        strokeWidth="0.5"
      />

      {/* White Teardrop Pin Shape */}
      <path
        d="M16 30C15 28 8 20 8 15C8 10.58 11.58 7 16 7C20.42 7 24 10.58 24 15C24 20 17 28 16 30Z"
        fill={`url(#${pinGradId})`}
        stroke="#475569"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Glossy Colored Center Sphere */}
      <circle
        cx="16"
        cy="15"
        r="5.5"
        fill={`url(#${centerGradId})`}
        stroke="#475569"
        strokeWidth="0.6"
      />
    </svg>
  );
}
