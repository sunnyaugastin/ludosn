import React from 'react';

const COLOR_MAP = {
  red:    { fill: '#FF2E2E', dark: '#c91818', light: '#ff8585', stroke: '#990f0f' },
  green:  { fill: '#00C853', dark: '#009624', light: '#69f0ae', stroke: '#006618' },
  blue:   { fill: '#2196F3', dark: '#1565C0', light: '#90CAF9', stroke: '#0D47A1' },
  yellow: { fill: '#FFD600', dark: '#F57F17', light: '#FFF59D', stroke: '#E65100' },
};

/**
 * PawnToken — Supports 2 Token Styles:
 * 1. 'pawn': Classic 2D Pawn with white top circular cap.
 * 2. 'disk': Sleek Whitish-Grey circular disk with inner player color fill and white center accent.
 */
export default function PawnToken({ 
  color = 'red', 
  size = 20, 
  isClickable = false, 
  isSmall = false,
  tokenStyle = 'pawn'
}) {
  const { fill, dark, light, stroke } = COLOR_MAP[color] || COLOR_MAP.red;
  const s = isSmall ? size * 0.75 : size;

  if (tokenStyle === 'disk') {
    return (
      <svg
        width={s * 1.1}
        height={s * 1.1}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-200"
      >
        {/* Outer Whitish-Grey Disc Ring */}
        <circle cx="14" cy="14" r="13" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Inner Player Color Fill */}
        <circle cx="14" cy="14" r="9.5" fill={fill} stroke={dark} strokeWidth="1.2" />
        {/* Center White Accent Crown */}
        <circle cx="14" cy="14" r="4.2" fill="#ffffff" stroke={dark} strokeWidth="0.8" />
      </svg>
    );
  }

  // Default 'pawn' style
  return (
    <svg
      width={s}
      height={s * 1.286}
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-200"
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
      
      {/* ── Solid White Top Circular Cap (100% Contrast) ── */}
      <circle cx="14" cy="5" r="3.2" fill="#ffffff" stroke={dark} strokeWidth="0.8" />

      {/* 2D Body left highlight stroke */}
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
