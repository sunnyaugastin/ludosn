import React, { useEffect, useRef } from 'react';

const COLORS = ['#ef4444','#22c55e','#3b82f6','#eab308','#a855f7','#f97316','#ec4899','#14b8a6'];
const PARTICLE_COUNT = 120;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function ConfettiOverlay({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Init particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: randomBetween(canvas.width * 0.2, canvas.width * 0.8),
      y: randomBetween(-50, -10),
      w: randomBetween(8, 18),
      h: randomBetween(5, 12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.08, 0.08),
      vx: randomBetween(-2.5, 2.5),
      vy: randomBetween(2, 6),
      gravity: randomBetween(0.05, 0.12),
      opacity: 1,
      fadeDelay: randomBetween(120, 200),
      frame: 0,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      particlesRef.current.forEach((p) => {
        p.frame++;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.frame > p.fadeDelay) {
          p.opacity -= 0.015;
        }
        if (p.opacity > 0) allDone = false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
        ctx.fill();
        ctx.restore();
      });

      if (!allDone) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
