'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface SubstituteIndicatorProps {
  /** 사용자가 substitute 중 하나를 *보유* 하고 있는지. tooltip 메시지 분기:
   *   true → "가진 재료로 대체 가능해요" (보유 강조)
   *   false → "이 재료들로도 만들 수 있어요" (작성자 명시 안내, 보유 가정 X)
   *  default false — 보유 단언은 호출자가 명시해야 함 (거짓 정보 방지). */
  owned?: boolean;
}

/**
 * 재료 카드의 🔄 "대체 가능" 인라인 인디케이터 — hover/tap 시 tooltip.
 *
 * 시각 디자인:
 *  - 🔄 이모지 + ⓘ 작은 아이콘 (탭 가능 힌트)
 *  - hover/tap → tooltip — owned 여부에 따라 메시지 분기 (거짓 정보 방지)
 *
 * 동작은 [[OptionalIngredientBadge]] 와 동일 (일관성):
 *  - 데스크톱 mouseenter/leave → 자동 표시
 *  - 모바일 click → toggle
 *  - 바깥 mousedown → close
 *  - aria-expanded·aria-label 접근성
 */
export default function SubstituteIndicator({ owned = false }: SubstituteIndicatorProps = {}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center gap-0.5 rounded-full text-xs cursor-help hover:opacity-80 transition-opacity"
        aria-label={t.recipe.substituteBadgeAria}
        aria-expanded={open}
      >
        <span aria-hidden>🔄</span>
        <span aria-hidden className="text-[9px] text-warning/70">ⓘ</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 bottom-full left-0 mb-1 px-2.5 py-1.5 rounded-md bg-background-primary border border-warning/40 text-xs text-text-secondary whitespace-nowrap shadow-xl"
        >
          {owned ? t.recipe.substituteBadgeTooltip : t.recipe.substituteAvailableTooltip}
        </span>
      )}
    </span>
  );
}
