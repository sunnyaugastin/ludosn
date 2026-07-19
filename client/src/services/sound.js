/**
 * sound.js — Web Audio API sound engine for LUDOSN
 * No external libraries. Pure browser AudioContext.
 */

let ctx = null;

export function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(frequency, type = 'sine', duration = 0.12, volume = 0.18, startTime = 0) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime + startTime);
    gain.gain.setValueAtTime(volume, ac.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration);
    osc.start(ac.currentTime + startTime);
    osc.stop(ac.currentTime + startTime + duration + 0.01);
  } catch (e) { /* ignore */ }
}

function playNoise(duration = 0.15, volume = 0.06, startTime = 0) {
  try {
    const ac = getCtx();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const gain = ac.createGain();
    source.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(volume, ac.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration);
    source.start(ac.currentTime + startTime);
    source.stop(ac.currentTime + startTime + duration);
  } catch (e) { /* ignore */ }
}

// ── Public sound functions ───────────────────────────────────────────────────

export function soundDiceRoll() {
  // Simple crisp double-click sound for the dice roll
  playTone(580, 'sine', 0.05, 0.14, 0);
  playTone(720, 'sine', 0.04, 0.10, 0.05);
}

export function soundTokenMove() {
  playTone(520, 'sine', 0.05, 0.08);
}

export function soundCapture() {
  playTone(600, 'sawtooth', 0.08, 0.12, 0.0);
  playTone(400, 'sawtooth', 0.1, 0.10, 0.09);
  playTone(220, 'sawtooth', 0.12, 0.08, 0.2);
}

export function soundBonusTurn() {
  playTone(523, 'sine', 0.1, 0.15, 0.0);
  playTone(659, 'sine', 0.1, 0.15, 0.1);
  playTone(784, 'sine', 0.12, 0.15, 0.2);
}

export function soundYourTurn() {
  playTone(880, 'sine', 0.15, 0.12, 0.0);
  playTone(1100, 'sine', 0.12, 0.10, 0.18);
}

export function soundWin() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => {
    playTone(freq, 'triangle', 0.22, 0.18, i * 0.18);
  });
  playTone(1046, 'sine', 0.4, 0.20, notes.length * 0.18);
}

// Automatically wake up the AudioContext on first page gesture
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    try {
      getCtx();
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    } catch (e) { /* ignore */ }
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);
}
