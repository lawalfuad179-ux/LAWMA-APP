'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast } from '@/components/ui/Toast';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastFn = (message: string, variant?: ToastVariant, duration?: number) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const addToast = useCallback<ToastFn>((message, variant = 'info', duration) => {
    const id = counter.current++;
    setToasts((prev) => [...prev, { id, message, variant, duration }].slice(-3));
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 68,
          right: 16,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            variant={t.variant}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
