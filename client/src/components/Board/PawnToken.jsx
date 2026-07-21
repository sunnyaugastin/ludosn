import React from 'react';

const COLOR_MAP = {
  red:    { fill: '#FF2E2E', dark: '#c91818', light: '#ff8585', stroke: '#990f0f' },
  green:  { fill: '#00C853', dark: '#009624', light: '#69f0ae', stroke: '#006618' },
  blue:   { fill: '#2196F3', dark: '#1565C0', light: '#90CAF9', stroke: '#0D47A1' },
  yellow: { fill: '#FFD600', dark: '#F57F17', light: '#FFF59D', stroke: '#E65100' },
};

/**
 * PawnToken — Sleek Apple 2D / Material style classic Ludo Pawn piece.
 * Proportioned to fit perfectly inside Ludo board cells on mobile and desktop without cell border overlap.
 */
export default function PawnToken({ color = 'red', size = 20, isClickable = false, isSmall = false }) {
  const { fill, dark, light, stroke } = COLOR_MAP[color] || COLOR_MAP.red;
  const s = isSmall ? size * 0.75 : size;

  return (
    <svg
      width={s}
      height={s * 1.286}
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-200 ${isClickable ? 'animate-bounce cursor-pointer' : ''}`}
      style={{
        filter: isClickable
          ? `drop-shadow(0 0 6px ${fill}cc) drop-shadow(0 3px 5px rgba(0,0,0,0.22))`
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
      }}
    >
      {/* ── Base Pedestal (Thick Rounded Base) ── */}
      <ellipse cx="14" cy="31.5" rx="9" ry="3.2" fill={dark} />
      <ellipse cx="14" cy="30" rx="9" ry="3.2" fill={fill} stroke={stroke} strokeWidth="1" />
      <ellipse cx="14" cy="29.2" rx="6.5" ry="2" fill={light} opacity="0.35" />

      {/* ── Main Flared Body ── */}
      <path
        d="M 5 30 C 6 22 9.5 18 10.5 13.5 L 17.5 13.5 C 18.5 18 22 22 23 30 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* 2D Vector Shade on right side of body */}
      <path
        d="M 14 13.5 C 15 18 19 22 23 30 C 22 22 18.5 18 17.5 13.5 Z"
        fill={dark}
        opacity="0.22"
      />

      {/* ── Collar Ring ── */}
      <ellipse cx="14" cy="13.5" rx="4.2" ry="1.5" fill={dark} />
      <ellipse cx="14" cy="12.7" rx="4.2" ry="1.5" fill={fill} stroke={stroke} strokeWidth="1" />

      {/* ── Head Knob (Sphere) ── */}
      <circle cx="14" cy="7.8" r="5.8" fill={fill} stroke={stroke} strokeWidth="1" />
      {/* Crisp White Top Circular Dot for High Contrast */}
      <circle cx="14" cy="4.2" r="2.2" fill="#ffffff" stroke={dark} strokeWidth="0.5" />

      {/* 2D Apple/Material Vector Highlights */}
      {/* Top-left head arc highlight */}
      <path
        d="M 10.5 6 A 4 4 0 0 1 16 3.6"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Head right shade */}
      <path
        d="M 14 2 A 5.8 5.8 0 0 1 19.8 7.8 A 5.8 5.8 0 0 0 14 2 Z"
        fill={dark}
        opacity="0.2"
      />
      {/* Body left highlight stroke */}
      <path
        d="M 7.5 27 C 8.2 21.5 10.5 18 11.2 14.5"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
