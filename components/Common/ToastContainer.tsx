'use client';

import { useToast, ToastType } from '@/lib/toast/context';

/** SVG 아이콘 — 이모지 대신 고정된 크기/컬러 */
const Icon = ({ type }: { type: ToastType }) => {
  const base = "w-5 h-5 flex-shrink-0";
  const color = {
    success: "text-emerald-400",
    error: "text-red-400",
    warning: "text-amber-400",
    info: "text-sky-400",
  }[type];
  switch (type) {
    case 'success':
      return (
        <svg className={`${base} ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${base} ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${base} ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.3 3.9l-8.2 14.2A2 2 0 003.8 21h16.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className={`${base} ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
        </svg>
      );
  }
};

/** 테두리/배경 — 상단 좁은 스트라이프로 강조 */
const STYLES: Record<ToastType, { stripe: string; iconBg: string }> = {
  success: { stripe: 'bg-emerald-400', iconBg: 'bg-emerald-500/10' },
  error:   { stripe: 'bg-red-400',      iconBg: 'bg-red-500/10' },
  warning: { stripe: 'bg-amber-400',   iconBg: 'bg-amber-500/10' },
  info:    { stripe: 'bg-sky-400',      iconBg: 'bg-sky-500/10' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[9999] flex flex-col gap-2.5 w-[92vw] max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const style = STYLES[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            className="pointer-events-auto relative overflow-hidden rounded-2xl bg-background-secondary border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-[slideIn_0.28s_cubic-bezier(.2,.7,.2,1)]"
          >
            {/* 좌측 컬러 스트라이프 (타입 구분) */}
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${style.stripe}`} />

            <div className="flex items-start gap-3 pl-4 pr-3 py-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${style.iconBg} flex-shrink-0 mt-0.5`}>
                <Icon type={t.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] leading-5 font-medium text-text-primary break-words">{t.message}</p>
                {t.action && (
                  <button
                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-warm text-background-primary text-xs font-bold hover:bg-accent-hover active:scale-95 transition-all"
                  >
                    {t.action.label}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="닫기"
                className="flex-shrink-0 w-6 h-6 -mr-1 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 자동 닫힘 진행 바 (은은하게) */}
            <div
              className={`absolute bottom-0 left-0 h-[2px] ${style.stripe} opacity-50`}
              style={{ animation: `toastProgress ${t.duration}ms linear forwards` }}
            />
          </div>
        );
      })}
    </div>
  );
}
