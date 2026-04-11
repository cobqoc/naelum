'use client';

import { useToast, ToastType } from '@/lib/toast/context';

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-[slideIn_0.3s_ease-out] ${COLORS[toast.type]}`}
          role="alert"
        >
          <span className="text-lg flex-shrink-0">{ICONS[toast.type]}</span>
          <p className="text-sm text-text-primary flex-1">{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
              className="text-xs font-semibold text-accent-warm hover:text-accent-hover transition-colors flex-shrink-0 ml-1 whitespace-nowrap"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
