import React from 'react';

const DOT_GRIDS = {
  1: [false,false,false,  false,true,false,   false,false,false],
  2: [true,false,false,   false,false,false,  false,false,true],
  3: [true,false,false,   false,true,false,   false,false,true],
  4: [true,false,true,    false,false,false,  true,false,true],
  5: [true,false,true,    false,true,false,   true,false,true],
  6: [true,false,true,    true,false,true,    true,false,true],
};

export default function Dice({ value = 1, isRolling = false, onClick, disabled = false }) {
  const dots = DOT_GRIDS[value] || DOT_GRIDS[1];

  return (
    <div className="flex items-center justify-center">
      <style>{`
        @keyframes dice-circular-spin {
          0% {
            transform: scale(1) rotate(0deg) translate(0, 0);
          }
          20% {
            transform: scale(1.06) rotate(144deg) translate(2px, -2px);
          }
          40% {
            transform: scale(1.08) rotate(288deg) translate(2px, 2px);
          }
          60% {
            transform: scale(1.06) rotate(432deg) translate(-2px, 2px);
          }
          80% {
            transform: scale(0.98) rotate(576deg) translate(-2px, -2px);
          }
          100% {
            transform: scale(1) rotate(720deg) translate(0, 0);
          }
        }
        .dice-rolling {
          animation: dice-circular-spin 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      <button
        id="dice-btn"
        key={`${value}-${isRolling}`}
        onClick={onClick}
        disabled={disabled || isRolling}
        className={`
          w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-2 border-2
          relative flex items-center justify-center overflow-hidden
          select-none outline-none
          transition-all duration-150
          ${isRolling
            ? 'dice-rolling border-violet-450 bg-gradient-to-br from-white via-gray-50 to-gray-150 shadow-md'
            : disabled
              ? 'border-gray-200 bg-gradient-to-br from-gray-100 to-gray-150 opacity-65 cursor-not-allowed'
              : 'border-gray-300 bg-gradient-to-br from-white via-gray-50 to-gray-150 hover:border-violet-500 hover:scale-105 hover:shadow-lg hover:shadow-violet-100 cursor-pointer active:scale-95'
          }
        `}
      >
        {/* Gloss highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl pointer-events-none" />

        {/* 3×3 dot grid */}
        <div className="w-9 h-9 grid grid-cols-3 grid-rows-3 gap-1 z-10 pointer-events-none">
          {dots.map((hasDot, i) => (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <div className="w-2.5 h-2.5 rounded-full bg-gray-800 shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
              )}
            </div>
          ))}
        </div>

        {/* Subtle edge shadow inner */}
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_-2px_4px_rgba(0,0,0,0.06)] pointer-events-none" />
      </button>
    </div>
  );
}
