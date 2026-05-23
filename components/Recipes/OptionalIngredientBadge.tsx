'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface OptionalIngredientBadgeProps {
  /** 본문에서 매칭된 재료명 (조사 제외, 원형 또는 동의어) */
  name: string;
  /** 작성자가 명시한 대체재 — 있으면 tooltip 에 "또는: X, Y" 줄 추가 */
  substitutes?: string[];
}

/**
 * 조리 단계 본문의 *재료명 자체*를 inline 강조하는 컴포넌트.
 *
 * 디자인 결정 (2026-05-24):
 *  - 별도 `(선택)` 배지는 *시각적으로 무거워 문장 흐름을 끊음* + "어떤 재료가 선택?"
 *    한 번 멈춰서 앞 단어 찾아야 함 (사용자 피드백 — 이질감 + 정보 모호)
 *  - **재료명 자체에 dashed underline** + 작은 ⓘ 아이콘 → 본문 흐름 자연 유지,
 *    재료명 자체가 강조 대상임이 즉시 인지됨
 *  - hover/tap → tooltip "없어도 만들 수 있어요" + substitutes (기존 동작 유지)
 *
 * 컴포넌트 이름 "Badge" 는 레거시 — 실제는 inline mention. 호출처가 한 곳뿐이라
 * 동작·API 만 갱신, rename 은 후속 가능.
 */
export default function OptionalIngredientBadge({ name, substitutes }: OptionalIngredientBadgeProps) {
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

  const hasSubs = Array.isArray(substitutes) && substitutes.length > 0;

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-text-secondary underline decoration-dashed decoration-warning/60 underline-offset-[3px] cursor-help hover:decoration-warning transition-colors"
        aria-label={t.recipe.optionalBadgeAria}
        aria-expanded={open}
      >
        {name}
        <span aria-hidden className="ml-0.5 text-[9px] text-warning/70 align-super">ⓘ</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 bottom-full left-0 mb-1 px-2.5 py-1.5 rounded-md bg-background-primary border border-warning/40 text-xs text-text-secondary whitespace-nowrap shadow-xl"
        >
          <span className="block">{t.recipe.optionalBadgeTooltip}</span>
          {hasSubs && (
            <span className="block mt-1 text-warning">
              <span className="opacity-70">{t.recipe.optionalBadgeOr}</span>{' '}
              <span className="font-medium">{substitutes!.join(', ')}</span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}
