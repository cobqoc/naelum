import type { TranslationKeys } from '@/lib/i18n/translations';
import { DIETARY_DESCRIPTIONS } from '@/lib/constants/recipe';

/**
 * 레시피 작성·수정 폼 공용 — 식단옵션(채식/비건/글루텐프리) 토글 (presentational).
 *
 * 2026-10-04 [PHR-D1 (b)-4] new 의 DietaryOptionsField 와 edit/page.tsx 인라인 블록을 한 벌로. 공통(라벨·3옵션·
 * 토글 버튼 className)은 동일했고, new 전용 hover/tap 툴팁은 선택 prop `tooltip` 으로 보존:
 *  - tooltip 지정(new): 버튼을 `div.relative`(mouse/touch 핸들러)로 감싸고 툴팁 렌더 — 옛 new 마크업
 *  - 생략(edit): 버튼만 — 옛 edit 인라인 마크업
 * ⚠️ 최고 위험 블록(옛 주석 유지): 토글(자식) → setter(부모) → 부모 useEffect(autoTags) → setTags → TagsField 칩.
 *    setter 는 부모 useState setter 를 그대로 받는다. 회귀 가드: e2e/recipe-creation.spec.ts "UI 회귀(식단옵션)".
 */

interface DietaryOptionsFieldProps {
  tf: TranslationKeys['recipeForm'];
  isVegetarian: boolean;
  setIsVegetarian: (v: boolean) => void;
  isVegan: boolean;
  setIsVegan: (v: boolean) => void;
  isGlutenFree: boolean;
  setIsGlutenFree: (v: boolean) => void;
  /** new 전용 hover/tap 설명 툴팁 상태 — 생략(edit) 시 툴팁 없이 버튼만 */
  tooltip?: { hovered: string | null; setHovered: (key: string | null) => void };
}

export default function DietaryOptionsField({
  tf,
  isVegetarian, setIsVegetarian,
  isVegan, setIsVegan,
  isGlutenFree, setIsGlutenFree,
  tooltip,
}: DietaryOptionsFieldProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-text-secondary">{tf.dietaryLabel}</label>
      <div className="flex flex-wrap gap-3">
        {[
          { value: isVegetarian, setter: setIsVegetarian, label: tf.dietaryVegetarian, key: 'vegetarian' },
          { value: isVegan, setter: setIsVegan, label: tf.dietaryVegan, key: 'vegan' },
          { value: isGlutenFree, setter: setIsGlutenFree, label: tf.dietaryGlutenFree, key: 'glutenFree' },
        ].map(opt => {
          const button = (
            <button
              key={tooltip ? undefined : opt.label}
              type="button"
              onClick={() => opt.setter(!opt.value)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                opt.value
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-muted hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          );
          if (!tooltip) return button;
          return (
            <div
              key={opt.label}
              className="relative"
              onMouseEnter={() => tooltip.setHovered(opt.key)}
              onMouseLeave={() => tooltip.setHovered(null)}
              onTouchStart={() => tooltip.setHovered(opt.key)}
              onTouchEnd={() => setTimeout(() => tooltip.setHovered(null), 2000)}
            >
              {button}

              {/* 툴팁 */}
              {tooltip.hovered === opt.key && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background-tertiary text-text-primary text-xs rounded-lg shadow-lg whitespace-nowrap z-10 animate-fadeIn">
                  {DIETARY_DESCRIPTIONS[opt.key as keyof typeof DIETARY_DESCRIPTIONS]}
                  {/* 툴팁 화살표 */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-background-tertiary"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
