'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface ConfirmDialogProps {
  isOpen: boolean;
  /** 모달 헤더 — 짧은 질문체 권장 (예: "이 팁을 삭제하시겠습니까?") */
  title: string;
  /** 추가 설명 (선택) — 행동의 결과·되돌릴 수 있는지 등 */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 위험한 동작이면 confirm 버튼을 빨강(error) 톤으로 — 삭제·취소불가 등 */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** confirm 실행 중 disable + label "처리 중..." — 외부에서 await 진행 표시. */
  loading?: boolean;
  loadingLabel?: string;
}

/**
 * 디자인 시스템 confirm 모달 — native `confirm()` 대체.
 *
 * 왜 native 안 쓰나:
 *  - 디자인 일관성: 다크 테마·낼름 톤(amber/회색)과 시각 어긋남
 *  - 접근성·테스트: claude-in-chrome·Playwright 자동화가 native dialog 차단/race
 *  - 위험 동작(destructive=true) 시각 강조 불가
 *
 * 사용 패턴:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmDialog isOpen={open} title="..." onConfirm={...} onCancel={() => setOpen(false)} />
 *
 * 키보드: Esc → cancel, Enter → confirm (input focus 시 native form 동작 우선).
 * 바깥 클릭(backdrop) → cancel.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
  loadingLabel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  // 열릴 때 confirm 버튼에 focus (Enter 즉시 확정 가능).
  useEffect(() => {
    if (!isOpen) return;
    confirmBtnRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label={cancelLabel ?? t.common.cancel}
        onClick={() => { if (!loading) onCancel(); }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      {/* dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-background-secondary border border-white/10 shadow-2xl p-6 space-y-4">
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-text-primary">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        )}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-secondary text-sm font-medium hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {cancelLabel ?? t.common.cancel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              destructive
                ? 'bg-error/20 border border-error/30 text-error hover:bg-error/30'
                : 'bg-accent-warm text-background-primary hover:bg-accent-hover'
            }`}
          >
            {loading ? (loadingLabel ?? t.common.loading) : (confirmLabel ?? t.common.confirm)}
          </button>
        </div>
      </div>
    </div>
  );
}
