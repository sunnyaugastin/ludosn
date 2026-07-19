import React, { useState, useEffect, useCallback } from 'react';

let toastIdCounter = 0;

// Toast types → icon + color mapping
const TOAST_STYLES = {
  capture: {
    bg: 'bg-rose-950/90 border-rose-700/60',
    text: 'text-rose-200',
    icon: '⚔️',
  },
  bonus: {
    bg: 'bg-amber-950/90 border-amber-600/60',
    text: 'text-amber-200',
    icon: '🎲',
  },
  win: {
    bg: 'bg-violet-950/90 border-violet-600/60',
    text: 'text-violet-200',
    icon: '🏆',
  },
  disconnect: {
    bg: 'bg-slate-900/90 border-slate-700/60',
    text: 'text-slate-300',
    icon: '🔌',
  },
  info: {
    bg: 'bg-slate-900/90 border-slate-700/60',
    text: 'text-slate-300',
    icon: 'ℹ️',
  },
};

// Singleton manager — exposes addToast() to be called from anywhere
let _addToast = null;

export function showToast(message, type = 'info', duration = 3000) {
  if (_addToast) {
    _addToast({ message, type, duration });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 350);
    }, duration);
  }, []);

  // Register global addToast on mount
  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2.5 pointer-events-none">
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-16px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(-12px) scale(0.90); }
        }
        .toast-enter { animation: toast-in 0.25s ease-out forwards; }
        .toast-exit  { animation: toast-out 0.3s ease-in  forwards; }
      `}</style>

      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-2xl max-w-xs text-center text-sm font-semibold pointer-events-auto ${style.bg} ${style.text} ${
              toast.exiting ? 'toast-exit' : 'toast-enter'
            }`}
          >
            <span className="text-base leading-none">{style.icon}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
