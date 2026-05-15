import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from './utils';

/**
 * Toast system Zodiak — remplacement progressif de react-hot-toast.
 * API compatible : toast.success('msg'), toast.error('msg'), etc.
 *
 * Usage :
 *   import { ToastProvider } from '@/lib/toast';
 *   // dans App.tsx : <ToastProvider><App /></ToastProvider>
 *   // n'importe où : toast.success('Profil sauvegardé');
 */

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  duration: number;
}

interface ToastContextValue {
  add: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const add = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);
      if (toast.duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), toast.duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const iconMap = {
    success: <CheckCircle className="w-4 h-4 text-aurora-400" />,
    error: <AlertCircle className="w-4 h-4 text-magenta-400" />,
    info: (
      <svg className="w-4 h-4 text-ivory-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    loading: <Loader2 className="w-4 h-4 text-aurora-300 animate-spin" />,
  };

  const bgMap = {
    success: 'border-aurora-400/30 bg-aurora-500/[0.08]',
    error: 'border-magenta-500/30 bg-magenta-500/[0.08]',
    info: 'border-white/10 bg-white/[0.06]',
    loading: 'border-aurora-400/25 bg-aurora-500/[0.06]',
  };

  return (
    <ToastContext.Provider value={{ add, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]',
                'min-w-[280px] max-w-[400px]',
                bgMap[t.type]
              )}
            >
              {iconMap[t.type]}
              <span className="flex-1 text-body text-ivory-100 leading-snug">{t.message}</span>
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-ivory-400 hover:text-ivory-100 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export const toast = {
  success: (message: string, duration = 3500) => {
    const ctx = getToastContext();
    return ctx?.add({ message, type: 'success', duration });
  },
  error: (message: string, duration = 4500) => {
    const ctx = getToastContext();
    return ctx?.add({ message, type: 'error', duration });
  },
  info: (message: string, duration = 3500) => {
    const ctx = getToastContext();
    return ctx?.add({ message, type: 'info', duration });
  },
  loading: (message: string) => {
    const ctx = getToastContext();
    return ctx?.add({ message, type: 'loading', duration: 0 });
  },
  dismiss: (id?: string) => {
    const ctx = getToastContext();
    if (id) ctx?.dismiss(id);
  },
};

// Hack léger pour permettre toast.* sans hook
let _globalCtx: ToastContextValue | null = null;
function getToastContext() {
  return _globalCtx;
}

// Exposer via un setter interne (utilisé par ToastProvider)
export function __setGlobalToast(ctx: ToastContextValue) {
  _globalCtx = ctx;
}
