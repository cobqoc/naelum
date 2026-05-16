import type { TranslationKeys } from '@/lib/i18n/translations';
import { type Timer, type useMultiTimer } from '@/lib/hooks/useMultiTimer';
import { formatTime } from '@/lib/utils/formatTime';

/**
 * 쿠킹 모드 멀티 타이머 패널 (미니 + 전체) (순수 표현).
 *
 * god-file(RecipeCookMode) 분해 Phase 2. 타이머 상태·로직은 useMultiTimer
 * 훅(부모 소유) — 값+콜백만. JSX·className 원본과 byte-identical → 행위 변경 0.
 * 빈 타이머면 null 반환 = 기존 `{timers.length > 0 && ...}` 조건부와 동일.
 * 회귀 가드: e2e/cook-mode-and-review.spec.ts (타이머 시작 → 패널 표시).
 */

type MultiTimer = ReturnType<typeof useMultiTimer>;

export default function CookTimerPanel({
  multiTimer,
  showTimerPanel,
  setShowTimerPanel,
  t,
}: {
  multiTimer: MultiTimer;
  showTimerPanel: boolean;
  setShowTimerPanel: (v: boolean) => void;
  t: TranslationKeys;
}) {
  if (multiTimer.timers.length === 0) return null;
  return (
    <>
      {/* 타이머 미니 표시 (접혔을 때) */}
      {!showTimerPanel && (
        <button
          onClick={() => setShowTimerPanel(true)}
          className="fixed top-16 right-4 z-50 bg-accent-warm text-background-primary py-2 px-4 rounded-full shadow-2xl flex items-center gap-2 animate-pulse"
        >
          <span>⏱️</span>
          <span className="font-mono font-bold text-sm">
            {multiTimer.activeTimers.length > 0
              ? formatTime(multiTimer.activeTimers[0].remainingSeconds)
              : t.cookMode.timerCompleted
            }
          </span>
          {multiTimer.activeTimers.length > 1 && (
            <span className="text-xs bg-background-primary/20 px-1.5 py-0.5 rounded-full">
              +{multiTimer.activeTimers.length - 1}
            </span>
          )}
        </button>
      )}

      {/* 타이머 전체 패널 (펼쳤을 때) */}
      {showTimerPanel && (
        <div className="fixed top-14 left-2 right-2 z-50 bg-background-secondary rounded-2xl shadow-2xl border border-white/10 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              ⏱️ 타이머 ({multiTimer.timers.length})
            </h3>
            <div className="flex gap-2">
              {multiTimer.completedTimers.length > 0 && (
                <button
                  onClick={multiTimer.removeCompleted}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  {t.cookMode.removeCompleted}
                </button>
              )}
              <button
                onClick={() => setShowTimerPanel(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1.5">
            {multiTimer.timers.map((timer: Timer) => (
              <div
                key={timer.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  timer.isActive
                    ? timer.isPaused
                      ? 'bg-warning/10 border border-warning/20'
                      : 'bg-accent-warm/10 border border-accent-warm/20'
                    : 'bg-success/10 border border-success/20'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-muted">{timer.label}</div>
                  <div className={`text-lg font-mono font-bold ${
                    !timer.isActive ? 'text-success' :
                    timer.remainingSeconds < 30 ? 'text-error animate-pulse' :
                    'text-text-primary'
                  }`}>
                    {timer.isActive ? formatTime(timer.remainingSeconds) : '00:00 ✓'}
                  </div>
                  {/* Progress bar */}
                  {timer.isActive && (
                    <div className="h-1 bg-background-tertiary rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-accent-warm rounded-full transition-all duration-1000"
                        style={{ width: `${((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {timer.isActive && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => multiTimer.togglePause(timer.id)}
                      className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-xs hover:bg-white/10"
                    >
                      {timer.isPaused ? '▶' : '⏸'}
                    </button>
                    <button
                      onClick={() => multiTimer.stopTimer(timer.id)}
                      className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-xs hover:bg-error/20 text-error"
                    >
                      ■
                    </button>
                  </div>
                )}
                {!timer.isActive && (
                  <button
                    onClick={() => multiTimer.stopTimer(timer.id)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
