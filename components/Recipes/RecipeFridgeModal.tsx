'use client';

import { useI18n } from '@/lib/i18n/context';

interface RecipeFridgeModalProps {
  onClose: () => void;
  /** 내 냉장고에 보유 중인 이 레시피 재료명 (동의어 매칭) */
  ownedNames: string[];
  /** 대체 가능 — 보유는 아니지만 가진 재료(via)로 바꿔 쓸 수 있는 레시피 재료 */
  substituteItems: { ingredient: string; via: string }[];
  /** 없는 재료명 (대체도 불가 — 사야 함) */
  missingNames: string[];
  /** 냉장고가 비어있음(미로그인·재료 0개) — 안내문 표시 */
  fridgeEmpty?: boolean;
}

type Tone = 'success' | 'warning' | 'error';

const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

/** 상단 요약 — 아이콘 범례 + 개수 겸용. 0개면 흐리게 (범례 역할 유지). */
function SummaryBadge({ tone, icon, label, count }: {
  tone: Tone; icon: string; label: string; count: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        count === 0 ? 'text-text-muted/40' : TONE_TEXT[tone]
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
      <span>{count}</span>
    </span>
  );
}

/**
 * 레시피 ↔ 내 냉장고 재료 대조 모달.
 *
 * 레시피 상세 페이지 재료 탭과 같은 시각 언어 — 섹션 헤더 없이 재료마다
 * 상태(있음 ✓ / 대체 🔄 / 없음 ✗)를 색·아이콘으로 표시한 통합 목록.
 * 상단 요약 줄이 개수를 대신해 "섹션이 곧 분류"라는 오해를 없앤다.
 * 대체 줄은 레시피 재료(amber) → 내가 가진 재료(green ✓)를 한 줄에 붙여
 * "어느 게 내 거고 어느 게 레시피 거"가 색으로 바로 읽히게 한다.
 *
 * 레시피 상세(RecipeBrowseView)·레시피 카드(RecipeCard) 공용.
 * 순수 표현 — 분류된 목록을 props 로 받아 그리기만 한다.
 * "보유"는 같은 재료만(동의어). 까나리액젓을 가졌다고 멸치액젓을 "보유"라
 * 하지 않고 "대체 가능"으로 정직하게 보여준다. 호출처가 조건부 마운트.
 */
export default function RecipeFridgeModal({
  onClose,
  ownedNames,
  substituteItems,
  missingNames,
  fridgeEmpty,
}: RecipeFridgeModalProps) {
  const { t } = useI18n();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="relative mx-4 w-full max-w-sm bg-background-secondary rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-bold text-text-primary">{t.recipe.fridgeModalTitle}</span>
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

        {/* 요약 — 섹션 헤더 대신 한 줄. 아이콘 범례 + 개수 겸용 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 border-b border-white/10">
          <SummaryBadge tone="success" icon="✓" label={t.recipe.fridgeModalOwned} count={ownedNames.length} />
          <SummaryBadge tone="warning" icon="🔄" label={t.recipe.fridgeModalSubstitute} count={substituteItems.length} />
          <SummaryBadge tone="error" icon="✗" label={t.recipe.fridgeModalMissing} count={missingNames.length} />
        </div>

        <div className="px-5 py-4 max-h-[55vh] overflow-y-auto space-y-1.5">
          {fridgeEmpty && (
            <p className="text-xs text-text-muted text-center pb-2">{t.recipe.fridgeModalEmpty}</p>
          )}

          {/* 있는 재료 */}
          {ownedNames.map((name, i) => (
            <div
              key={`o${i}`}
              className="flex items-center gap-2 rounded-xl border border-text-muted/25 bg-background-tertiary px-3 py-2.5"
            >
              <span className="text-success text-sm" aria-hidden>✓</span>
              <span className="text-sm font-medium text-text-primary">{name}</span>
            </div>
          ))}

          {/* 대체 가능 — 레시피 재료(amber) → 내가 가진 재료(green ✓) */}
          {substituteItems.map((it, i) => (
            <div
              key={`s${i}`}
              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl border border-warning/40 bg-background-tertiary px-3 py-2.5"
            >
              <span className="text-warning text-sm" aria-hidden>🔄</span>
              <span className="text-sm font-medium text-text-primary">{it.ingredient}</span>
              <span className="inline-flex items-center rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                {t.recipe.fridgeModalSubstitute}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                <span aria-hidden>✓</span>{it.via}
              </span>
            </div>
          ))}

          {/* 없는 재료 */}
          {missingNames.map((name, i) => (
            <div
              key={`m${i}`}
              className="flex items-center gap-2 rounded-xl border border-error/30 bg-background-tertiary px-3 py-2.5"
            >
              <span className="text-error text-sm" aria-hidden>✗</span>
              <span className="text-sm font-medium text-text-secondary">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
