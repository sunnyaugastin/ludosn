import React, { useEffect, useRef, useState } from 'react';

const TOTAL_SECONDS = 20;
const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * TurnTimerRing — animated circular SVG countdown ring
 * @param {boolean} active - Whether this player is currently active
 * @param {string} color - Ring accent color class ('red'|'green'|'blue'|'yellow')
 * @param {number} resetKey - Change this value to restart the timer
 */
export default function TurnTimerRing({ active, color = 'violet', resetKey = 0, children }) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const intervalRef = useRef(null);

  const colorMap = {
    red: '#FF2E2E',
    green: '#00C853',
    blue: '#2196F3',
    yellow: '#FFE013',
    violet: '#7c3aed',
  };

  const ringColor = colorMap[color] || colorMap.violet;
  const progress = timeLeft / TOTAL_SECONDS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Restart timer whenever resetKey changes and active is true
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!active) {
      setTimeLeft(TOTAL_SECONDS);
      return;
    }

    setTimeLeft(TOTAL_SECONDS);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active, resetKey]);

  const urgentColor = timeLeft <= 5 ? '#ef4444' : ringColor;

  return (
    <div className="relative w-[52px] h-[52px] flex items-center justify-center flex-shrink-0">
      {/* SVG ring */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 52 52"
        className={`absolute -rotate-90 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Background track */}
        <circle
          cx="26" cy="26" r={RADIUS}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="3"
        />
        {/* Progress arc */}
        <circle
          cx="26" cy="26" r={RADIUS}
          fill="none"
          stroke={urgentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>

      {/* Children (avatar content) */}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>

      {/* Seconds badge — only show last 10s */}
      {active && timeLeft <= 10 && (
        <span
          className={`absolute -bottom-1 -right-1 text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center border border-slate-900 shadow z-20 ${
            timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-slate-900'
          }`}
        >
          {timeLeft}
        </span>
      )}
    </div>
  );
}
