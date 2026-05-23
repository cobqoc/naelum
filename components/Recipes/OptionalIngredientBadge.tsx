'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface OptionalIngredientBadgeProps {
  /** 작성자가 명시한 대체재 (선택) — 있으면 tooltip 에 "또는: X, Y" 줄 추가 */
  substitutes?: string[];
}

/**
 * 조리 단계 본문의 `(선택)` 인라인 배지 — hover/tap 시 안내 tooltip.
 *
 * UX 문제:
 *  - 사용자가 `(선택)` 만 봐선 "선택할 수 있다는 건지/빼도 된다는 건지" 모호
 *  - 자연스러운 첫 행동은 hover(데스크톱) 또는 tap(모바일) → 안내 없으면 답답
 *
 * 설계:
 *  - `<button>` 으로 만들어 키보드 접근성 + 모바일 tap 모두 지원
 *  - 데스크톱 hover (mouseenter/leave) → 자동 표시
 *  - 모바일 tap (click) → toggle. 바깥 클릭 시 닫힘
 *  - 작은 ⓘ 아이콘으로 "탭 가능" 시각 힌트
 *  - tooltip 본문: 메인 메시지 + substitutes(있으면) — *재료 카드의 substitutes 와 정보 공유*
 */
export default function OptionalIngredientBadge({ substitutes }: OptionalIngredientBadgeProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  // 바깥 클릭 시 닫기 (모바일 tap 토글 후 다른 곳 누르면 닫힘)
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
    <span ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-0.5 inline-flex items-center gap-0.5 rounded bg-warning/15 px-1 py-0 text-[10px] font-bold text-warning hover:bg-warning/25 transition-colors cursor-help"
        aria-label={t.recipe.optionalBadgeAria}
        aria-expanded={open}
      >
        ({t.recipe.ingredientOptional})
        <span aria-hidden className="text-[9px] opacity-70">ⓘ</span>
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
