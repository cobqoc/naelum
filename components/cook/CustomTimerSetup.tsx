'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface CheckpointRow {
  /** React key 전용 (입력값 아님) */
  id: number;
  minutes: string;
  label: string;
}

interface CustomTimerSetupProps {
  onClose: () => void;
  /** 시작 — 총 분 + 중간 알림(경과 분·라벨) 목록 */
  onStart: (totalMinutes: number, checkpoints: { atMinutes: number; label: string }[]) => void;
  /** 단계 본문에서 파싱한 값으로 미리 채우기 (사용자가 확인·수정 후 시작) */
  prefill?: { totalMinutes: number; checkpointMinutes: number[] };
}

let rowSeq = 0;
const newRow = (minutes = '', label = ''): CheckpointRow => ({ id: ++rowSeq, minutes, label });

/**
 * 직접 타이머 설정 모달 — 총 시간 + 중간 알림(체크포인트).
 *
 * "총 4분, 2분쯤 뒤집기"처럼 한 조리 단계 안에 시간 점이 여러 개인 경우를
 * 타이머 하나로 모델링한다. 시작하면 useMultiTimer 가 총 시간 카운트다운 중
 * 각 체크포인트 시점에 알림을 발화. prefill 은 *제안*일 뿐 — 자동 실행하지
 * 않고 사용자가 확인·수정한다(잘못된 파싱이 조리 지시가 되는 것 방지).
 */
export default function CustomTimerSetup({ onClose, onStart, prefill }: CustomTimerSetupProps) {
  const { t } = useI18n();
  const [total, setTotal] = useState(prefill ? String(prefill.totalMinutes) : '');
  const [rows, setRows] = useState<CheckpointRow[]>(
    prefill ? prefill.checkpointMinutes.map(m => newRow(String(m))) : [],
  );
  const panelRef = useRef<HTMLDivElement>(null);
  // a11y: 호출처 조건부 마운트 — isOpen=true 고정.
  useEscapeKey(onClose, true);
  useFocusTrap(true, panelRef);

  const totalNum = Number(total);
  const totalValid = Number.isFinite(totalNum) && totalNum >= 1 && totalNum <= 120;

  const handleStart = () => {
    if (!totalValid) return;
    const checkpoints = rows
      .map(r => ({ atMinutes: Number(r.minutes), label: r.label.trim() }))
      .filter(c => Number.isFinite(c.atMinutes) && c.atMinutes > 0 && c.atMinutes < totalNum)
      .map(c => ({ atMinutes: c.atMinutes, label: c.label || t.cookMode.timerCheckpointsLabel }));
    onStart(totalNum, checkpoints);
  };

  const numberInputCls =
    'px-2 py-2 rounded-lg bg-background-tertiary border border-white/10 text-text-primary text-sm ' +
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className="relative mx-4 w-full max-w-sm bg-background-secondary rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-bold text-text-primary">⏱️ {t.cookMode.customTimerTitle}</span>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 총 시간 */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              {t.cookMode.timerTotalLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0"
                className={`w-20 ${numberInputCls}`}
              />
              <span className="text-sm text-text-muted">{t.recipe.minuteSuffix}</span>
            </div>
          </div>

          {/* 중간 알림 */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              {t.cookMode.timerCheckpointsLabel}
            </label>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={row.minutes}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, minutes: e.target.value } : r)))
                    }
                    placeholder="0"
                    className={`w-14 ${numberInputCls}`}
                  />
                  <span className="text-xs text-text-muted flex-shrink-0">{t.recipe.minuteSuffix}</span>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)))
                    }
                    placeholder={t.cookMode.timerCheckpointPlaceholder}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background-tertiary border border-white/10 text-text-primary text-sm"
                  />
                  <button
                    onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                    aria-label={t.common.close}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:bg-white/10 hover:text-error transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => setRows((rs) => [...rs, newRow()])}
                className="text-sm text-info font-medium hover:text-info/70 transition-colors"
              >
                {t.cookMode.timerCheckpointAdd}
              </button>
            </div>
          </div>
        </div>

        {/* 시작 */}
        <div className="px-5 py-4 border-t border-white/10">
          <button
            onClick={handleStart}
            disabled={!totalValid}
            className="w-full py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.cookMode.timerStartButton}
          </button>
        </div>
      </div>
    </div>
  );
}
