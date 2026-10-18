'use client';

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
  // primary: orange solid (기본), secondary: outline. 다중 액션에서 시각 위계 분리용.
  variant?: 'primary' | 'secondary';
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  actions?: ToastAction[];
  duration: number;
}

interface ToastOptions {
  action?: ToastAction;
  // 다중 액션 (예: 삭제 직후 [실행 취소][장보기에 추가]). actions가 있으면 action은 무시.
  actions?: ToastAction[];
  duration?: number;
}

// 액션 컨텍스트 — 모든 useToast() 소비처(~35곳)가 받는 값. 전부 useCallback 이라 identity 가 고정돼
// 토스트가 뜨고 사라질 때 소비처가 재렌더되지 않는다. toasts 배열은 별도 컨텍스트로 분리해
// ToastContainer 만 구독 (perf 2026-09-27). 소비처 API(toast/success/error/warning/info/dismiss)는 동일.
interface ToastContextValue {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const ToastListContext = createContext<Toast[] | null>(null);

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
    const hasAction = !!(options?.actions?.length || options?.action);
    const duration = options?.duration ?? (hasAction ? 6000 : 3500);
    setToasts(prev => [...prev, { id, message, type, action: options?.action, actions: options?.actions, duration }]);

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
    toast: addToast, success, error, warning, info, dismiss,
  }), [addToast, success, error, warning, info, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastListContext.Provider value={toasts}>
        {children}
      </ToastListContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** 현재 표시 중인 토스트 목록 — ToastContainer 전용 구독. */
export function useToastList(): Toast[] {
  const list = useContext(ToastListContext);
  if (!list) throw new Error('useToastList must be used within ToastProvider');
  return list;
}
