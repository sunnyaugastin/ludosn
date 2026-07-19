import React from 'react';

const BG_COLORS = {
  red:    { bg: '#FF2E2E', text: '#ffffff' },
  green:  { bg: '#00C853', text: '#ffffff' },
  blue:   { bg: '#2196F3', text: '#ffffff' },
  yellow: { bg: '#FFE013', text: '#1e293b' },
  default:{ bg: '#7c3aed', text: '#ffffff' },
};

/**
 * PlayerAvatar — circular avatar showing player initials
 * @param {string} name - Player display name
 * @param {string} color - Player color ('red'|'green'|'blue'|'yellow')
 * @param {boolean} isActive - Whether this player is the active turn player
 * @param {number} size - Size in px (default 44)
 */
export default function PlayerAvatar({ name = '?', color = 'default', isActive = false, size = 44 }) {
  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  const { bg, text } = BG_COLORS[color] || BG_COLORS.default;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold select-none transition-all duration-300 border-2 ${
        isActive ? 'border-white shadow-md' : 'border-transparent'
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
        backgroundColor: bg,
        color: text,
        boxShadow: isActive ? `0 0 0 3px ${text}40` : undefined,
      }}
    >
      {initials || '?'}
    </div>
  );
}
