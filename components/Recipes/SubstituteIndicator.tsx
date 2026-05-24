'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface SubstituteIndicatorProps {
  /** 사용자가 substitute 중 하나를 *보유* 하고 있는지. tooltip 메시지 분기:
   *   true → "{name}로 대체할 수 있어요" (사용자 보유 재료명)
   *   false → "{names}로 대체 가능해요" (작성자 명시 재료명들)
   *  default false — 보유 단언은 호출자가 명시해야 함 (거짓 정보 방지). */
  owned?: boolean;
  /** tooltip 에 보여줄 재료명들 (인터폴레이션 용).
   *  - owned=true: subVia 한 개 (사용자 보유한 대체재)
   *  - owned=false: 작성자 명시 author list (note 는 stripped)
   *  비어 있으면 generic fallback. */
  names?: string[];
}

/** 한국어 로/으로 조사 자동 선택.
 *  - 끝글자 받침 없음(모음) 또는 ㄹ → 로
 *  - 그 외 받침 → 으로
 *  - 한글 아닌 글자 → 기본 로 (대부분 영문/숫자 끝나는 외래 재료명 자연스러움) */
function withRoParticle(name: string): string {
  const last = name.trim().slice(-1);
  if (!last) return name;
  const code = last.charCodeAt(0);
  // 한글 음절 범위 (가~힣)
  if (code < 0xac00 || code > 0xd7a3) return `${name}로`;
  const batchim = (code - 0xac00) % 28;
  // batchim === 0: 받침 없음(모음 끝), batchim === 8: ㄹ
  if (batchim === 0 || batchim === 8) return `${name}로`;
  return `${name}으로`;
}

/**
 * 재료 카드의 🔄 "대체 가능" 인라인 인디케이터 — hover/tap 시 tooltip.
 *
 * 시각 디자인:
 *  - 🔄 이모지 단독 (회전 화살표 = "다른 것으로 바꾸기" 직관 강함 → 탭 유도 충분).
 *    이전 ⓘ subscript 는 시각 노이즈만 더해 제거 (2026-05-25).
 *  - 데스크톱은 `cursor-help` 가 hover 가능 시그널.
 *  - hover/tap → tooltip — owned + names 로 *구체* 메시지 인터폴레이션
 *    (예: "쌀로 대체할 수 있어요" / "두유, 콩물로 대체 가능해요")
 *
 * 동작은 [[OptionalIngredientBadge]] 와 동일 (일관성):
 *  - 데스크톱 mouseenter/leave → 자동 표시
 *  - 모바일 click → toggle
 *  - 바깥 mousedown → close
 *  - aria-expanded·aria-label 접근성
 */
export default function SubstituteIndicator({ owned = false, names }: SubstituteIndicatorProps = {}) {
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

  // tooltip 메시지 — names 있으면 인터폴레이션, 없으면 fallback.
  // ko 는 마지막 이름 batchim 검사로 로/으로 자동 처리, 그 외 locale 은 {name} 단순 치환.
  const template = owned ? t.recipe.substituteBadgeTooltip : t.recipe.substituteAvailableTooltip;
  const tooltipText = (() => {
    if (!names || names.length === 0) {
      // names 미전달 fallback — placeholder 가 남아있을 수 있어 빈 문자열로 치환.
      return template.replace('{name}', '').replace('{names}', '').replace(/\s+/g, ' ').trim();
    }
    // ko 케이스 — 마지막 이름에만 조사 붙임 ("쌀, 닭으로" 처럼 두 번째에 조사가 자연스러움)
    if (template.includes('{nameWithRo}')) {
      const joined = names.slice(0, -1).join(', ');
      const last = names[names.length - 1];
      const lastWithRo = withRoParticle(last);
      const full = joined ? `${joined}, ${lastWithRo}` : lastWithRo;
      return template.replace('{nameWithRo}', full);
    }
    // 기타 locale — 단순 join 치환
    const joined = names.join(', ');
    return template.replace('{name}', joined).replace('{names}', joined);
  })();

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
        className="inline-flex items-center rounded-full text-xs cursor-help hover:opacity-80 transition-opacity"
        aria-label={t.recipe.substituteBadgeAria}
        aria-expanded={open}
      >
        <span aria-hidden>🔄</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 bottom-full left-0 mb-1 px-2.5 py-1.5 rounded-md bg-background-primary border border-warning/40 text-xs text-text-secondary whitespace-nowrap shadow-xl"
        >
          {tooltipText}
        </span>
      )}
    </span>
  );
}
