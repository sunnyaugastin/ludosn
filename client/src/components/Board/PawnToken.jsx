import React from 'react';

const COLOR_MAP = {
  red:    { fill: '#FF2E2E', dark: '#c91818', light: '#ff8585', stroke: '#990f0f' },
  green:  { fill: '#00C853', dark: '#009624', light: '#69f0ae', stroke: '#006618' },
  blue:   { fill: '#2196F3', dark: '#1565C0', light: '#90CAF9', stroke: '#0D47A1' },
  yellow: { fill: '#FFD600', dark: '#F57F17', light: '#FFF59D', stroke: '#E65100' },
};

/**
 * PawnToken — Clean Apple 2D / Material style classic Ludo Pawn piece.
 * Thicker base, recognizable pawn silhouette, flat 2D style with crisp vector highlights.
 */
export default function PawnToken({ color = 'red', size = 28, isClickable = false, isSmall = false }) {
  const { fill, dark, light, stroke } = COLOR_MAP[color] || COLOR_MAP.red;
  const s = isSmall ? size * 0.75 : size;

  return (
    <svg
      width={s}
      height={s * 1.3}
      viewBox="0 0 36 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-200 ${isClickable ? 'animate-bounce cursor-pointer' : ''}`}
      style={{
        filter: isClickable
          ? `drop-shadow(0 0 7px ${fill}cc) drop-shadow(0 4px 6px rgba(0,0,0,0.25))`
          : 'drop-shadow(0 3px 5px rgba(0,0,0,0.18))',
      }}
    >
      {/* ── Base Pedestal (Thick Rounded Base) ── */}
      <ellipse cx="18" cy="39" rx="14" ry="5" fill={dark} />
      <ellipse cx="18" cy="37.5" rx="14" ry="5" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <ellipse cx="18" cy="36.5" rx="10" ry="3.2" fill={light} opacity="0.35" />

      {/* ── Main Flared Body ── */}
      <path
        d="M 6 37.5 C 7.5 27 12.5 22 13.5 16 L 22.5 16 C 23.5 22 28.5 27 30 37.5 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* 2D Vector Shade on right side of body */}
      <path
        d="M 18 16 C 19 22 24 27 30 37.5 C 28.5 27 23.5 22 22.5 16 Z"
        fill={dark}
        opacity="0.22"
      />

      {/* ── Collar Ring ── */}
      <ellipse cx="18" cy="16" rx="5.5" ry="2" fill={dark} />
      <ellipse cx="18" cy="15" rx="5.5" ry="2" fill={fill} stroke={stroke} strokeWidth="1.2" />

      {/* ── Head Knob (Sphere) ── */}
      <circle cx="18" cy="9.5" r="7.5" fill={fill} stroke={stroke} strokeWidth="1.2" />

      {/* 2D Apple/Material Vector Highlights */}
      {/* Top-left head arc highlight */}
      <path
        d="M 13.5 7.5 A 5 5 0 0 1 20.5 4.5"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* Head right shade */}
      <path
        d="M 18 2 A 7.5 7.5 0 0 1 25.5 9.5 A 7.5 7.5 0 0 0 18 2 Z"
        fill={dark}
        opacity="0.2"
      />
      {/* Body left highlight stroke */}
      <path
        d="M 9 34 C 10 27 13.5 22 14.5 17"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
