'use client';

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
}

interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success', options?: ToastOptions) => {
    const id = `toast-${++toastCounter}`;
    const duration = options?.duration ?? (options?.action ? 6000 : 3500);
    setToasts(prev => [...prev, { id, message, type, action: options?.action, duration }]);

    const timer = setTimeout(() => {
      timersRef.current.delete(id);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    timersRef.current.set(id, timer);
  }, []);

  const success = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'success', opts), [addToast]);
  const error = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'error', opts), [addToast]);
  const warning = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'warning', opts), [addToast]);
  const info = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'info', opts), [addToast]);

  const value = useMemo<ToastContextValue>(() => ({
    toasts, toast: addToast, success, error, warning, info, dismiss,
  }), [toasts, addToast, success, error, warning, info, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
