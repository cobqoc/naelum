'use client';

import FridgeIcon from '@/components/icons/FridgeIcon';
import SubstituteIndicator from '@/components/Recipes/SubstituteIndicator';
import { isSameIngredient } from '@/lib/recommendations/match';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 재료 탭 — RecipeBrowseView 분해 ([[project-god-file-phase2]]) 의 표현 컴포넌트.
 *
 * 순수 표현: 상태·hook 호출 0. 부모(RBV) 가 match·unitConv·인분 조절 state 를 props 로 주입.
 * JSX byte-identical — 행위 변경 0.
 *
 * **불변식**:
 *  - `activeTab === 'ingredients'` 시 모바일 표시, md+ 는 항상 표시 (PC 2컬럼).
 *  - 보유 판정 priority: `isFundamental` → FK → `isSameIngredient` (match hook 위임).
 *  - is_optional 재료는 빨강(부족) 아님 — 회색 중성. 매칭 카운트에서도 제외.
 *  - chip 안 ✓ 마커는 *subVia 가 author list 의 이름과 매칭* 될 때만 — 거짓 신호 차단
 *    (예: author=돼지고기, user=삼겹살 (전역 매핑) → "또는 돼지고기 ✓" 잘못).
 */

interface IngredientLite {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes?: string;
  is_optional?: boolean;
  substitutes?: (string | { name?: string; note?: string })[] | null;
}

interface IngredientsTabProps {
  activeTab: 'ingredients' | 'steps';
  ingredients: IngredientLite[];
  /** 매칭 hook 결과 */
  isIngredientOwned: (name: string) => boolean;
  findSubstitute: (name: string, recipeSpecific?: (string | { name?: string; note?: string })[] | null) => string | null;
  ownedCount: number;
  totalIngredients: number;
  ingredientStatus: 'none' | 'partial' | 'all';
  /** 인분 조절 — baseServings: recipe 원본, currentServings: 사용자 선택 */
  baseServings: number;
  currentServings: number;
  setCurrentServings: React.Dispatch<React.SetStateAction<number>>;
  /** 수량 배율 계산 (currentServings/baseServings) */
  scaleQty: (qty: string) => string;
  /** 단위 변환 — useUnitConversion hook 결과 */
  unitConv: {
    isImperial: boolean;
    toggleSystem: () => void;
    convertIngredient: (qty: string, unit: string) => { quantity: string; unit: string; isConverted: boolean };
  };
  /** 냉장고 모달 열기 */
  onShowFridgeModal: () => void;
  t: TranslationKeys;
}

export default function IngredientsTab({
  activeTab,
  ingredients,
  isIngredientOwned,
  findSubstitute,
  ownedCount,
  totalIngredients,
  ingredientStatus,
  baseServings,
  currentServings,
  setCurrentServings,
  scaleQty,
  unitConv,
  onShowFridgeModal,
  t,
}: IngredientsTabProps) {
  const isScaling = currentServings !== baseServings;

  return (
    <div className={`${activeTab === 'ingredients' ? 'block' : 'hidden'} md:block`}>
      {/* 헤더 */}
      <div className="pt-4 md:pt-0 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="hidden md:block text-lg font-bold">
            {t.recipe.ingredientsLabel}
            <span className="text-sm font-normal text-text-muted ml-2">{ingredients.length}</span>
          </h2>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={unitConv.toggleSystem}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                unitConv.isImperial
                  ? 'bg-info/20 text-info border border-info/30'
                  : 'bg-background-tertiary text-text-muted hover:bg-white/10'
              }`}
              title={`${t.recipe.metricLabel} ↔ ${t.recipe.imperialLabel}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {unitConv.isImperial ? t.recipe.imperialLabel : t.recipe.metricLabel}
            </button>
            <button onClick={onShowFridgeModal} className="flex flex-col items-center gap-1">
              {/* pulse 는 *행동 유도* 신호 (마트 가기·재료 모으기) — 'all' = 준비 완료 상태에선
                  깜빡거림이 시각 노이즈가 됨. none/partial 만 pulse 유지. */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                ingredientStatus !== 'all' ? 'animate-pulse ' : ''
              }${
                ingredientStatus === 'none'
                  ? 'bg-error text-white shadow-[0_0_12px_rgba(244,67,54,0.5)]'
                  : ingredientStatus === 'all'
                  ? 'bg-success text-white shadow-[0_0_12px_rgba(76,175,80,0.5)]'
                  : 'bg-warning text-white shadow-[0_0_12px_rgba(255,152,0,0.5)]'
              }`}>
                <FridgeIcon size={22} />
              </div>
              <span className={`text-[10px] font-medium ${
                ingredientStatus === 'none' ? 'text-error'
                  : ingredientStatus === 'all' ? 'text-success'
                  : 'text-warning'
              }`}>
                {ownedCount}/{totalIngredients} {t.recipe.ownedSuffix}
              </span>
            </button>
          </div>
        </div>

        {/* 인분 조절 */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-text-muted">{t.recipe.servingsLabel}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentServings(s => Math.max(1, s - 1))}
              className="w-7 h-7 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted hover:bg-white/15 transition-all text-base font-bold leading-none"
            >
              −
            </button>
            <span className={`text-sm font-bold w-14 text-center ${isScaling ? 'text-accent-warm' : 'text-text-primary'}`}>
              {currentServings}{t.recipe.servingsSuffix}
            </span>
            <button
              onClick={() => setCurrentServings(s => Math.min(20, s + 1))}
              className="w-7 h-7 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted hover:bg-white/15 transition-all text-base font-bold leading-none"
            >
              +
            </button>
          </div>
          {isScaling && (
            <button
              onClick={() => setCurrentServings(baseServings)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              ({t.common.reset})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pb-4">
        {ingredients.map((ing, idx) => {
          const owned = isIngredientOwned(ing.ingredient_name);
          const subVia = owned ? null : findSubstitute(ing.ingredient_name, ing.substitutes);
          const scaledQty = scaleQty(ing.quantity);
          // unit '선택' sentinel 방어 — 옛 DB 행이 누수해도 화면에 노출 X
          const displayUnit = (ing.unit && ing.unit !== '선택') ? ing.unit : '';
          const converted = unitConv.convertIngredient(scaledQty, displayUnit);
          const scaled = isScaling && scaledQty !== ing.quantity;
          const isOptional = !!ing.is_optional;
          // optional 재료는 부족 빨강이 아니라 회색 중성 (있어도 없어도 OK).
          const borderClass = isOptional
            ? 'border-text-muted/20'
            : owned ? 'border-text-muted/30' : subVia ? 'border-warning/40' : 'border-error/30';
          const nameColor = isOptional
            ? 'text-text-secondary'
            : owned ? 'text-text-primary' : subVia ? 'text-warning' : 'text-error';
          // legacy string[] / 신규 {name,note}[] 어느 형식이든 display 문자열 배열로:
          // note 있으면 "멸치 다시다 · 1큰술", 없으면 "멸치 다시다".
          const recipeSubsList = (ing.substitutes ?? [])
            .map(s => {
              if (typeof s === 'string') return s.trim();
              const name = (s?.name ?? '').trim();
              if (!name) return '';
              const note = (s?.note ?? '').trim();
              return note ? `${name} · ${note}` : name;
            })
            .filter(Boolean);
          const hasSubs = recipeSubsList.length > 0;
          // ✓ 마커 정확성 — subVia 가 author list 의 *이름과 매칭* 될 때만 ✓ 부착.
          // 그렇지 않으면 사용자는 author 명시한 *다른 재료* 가 아닌 전역 매핑상 substitute 를
          // 보유한 것 — chip 의 author 이름 옆 ✓ 는 거짓 신호가 됨 (예: author=돼지고기,
          // user=삼겹살 (베이컨↔삼겹살 전역 매핑) → "또는 돼지고기 ✓" 잘못).
          // tooltip 인터폴레이션 용 — 원본 케이스 + note 제외 한 author 이름들.
          const authorSubNamesClean = recipeSubsList.map(s => s.split(' · ')[0].trim()).filter(Boolean);
          const authorSubNames = authorSubNamesClean.map(n => n.toLowerCase());
          const subViaInAuthorList = !!(subVia && authorSubNames.some(n =>
            n === subVia.toLowerCase().trim() || isSameIngredient(n, subVia.toLowerCase().trim())
          ));
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border-2 bg-background-tertiary ${borderClass}`}
            >
              {/* 재료명 + 정책 부속어("빼도 돼요") + substitute chip.
                  - "빼도 돼요" 는 정책 신호 — 항상 재료명 옆 (수량 줄에 붙으면 의미상 어색).
                  - chip 표시: ① 작성자 명시(hasSubs) ② 전역 규칙 매칭(subVia 단독).
                  - chip 내부 whitespace-nowrap — 긴 substitute(예: "멸치 다시다 · 1/2큰술")는
                    chip 자체가 부모 flex-wrap 으로 다음 줄로 떨어짐 (chip 내부는 한 줄 유지). */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-sm font-medium ${nameColor}`}>
                  {ing.ingredient_name}
                </span>
                {isOptional && (
                  <span className="text-xs text-text-secondary font-medium">
                    · {t.recipe.ingredientOptional}
                  </span>
                )}
                {hasSubs && (
                  <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-xs whitespace-nowrap">
                    <SubstituteIndicator
                      owned={subViaInAuthorList}
                      names={subViaInAuthorList && subVia ? [subVia] : authorSubNamesClean}
                    />
                    <span className="text-text-muted/80">{t.recipe.ingredientSubstituteOr}</span>
                    <span className="font-medium text-warning">{recipeSubsList.join(', ')}</span>
                    {subViaInAuthorList && <span aria-hidden className="text-success font-bold ml-0.5">✓</span>}
                  </span>
                )}
                {/* subVia 가 author list 밖이거나 hasSubs 없는 경우 — 사용자 보유 대체재를 별도 chip 으로 분리.
                    (hasSubs && !subViaInAuthorList) = author 가 명시한 것과 *다른* substitute 를 사용자가 보유. */}
                {subVia && !subViaInAuthorList && (
                  <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-xs whitespace-nowrap">
                    <SubstituteIndicator owned={true} names={[subVia]} />
                    <span aria-hidden className="text-success font-bold">✓</span>
                    <span className="font-medium text-success">{subVia}</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {converted.isConverted ? (
                  <>
                    <span className="text-info font-medium">{converted.quantity} {converted.unit}</span>
                    <span className="text-text-muted/60 ml-1">({ing.quantity} {displayUnit})</span>
                  </>
                ) : scaled ? (
                  <span className="text-accent-warm font-medium">{scaledQty} {displayUnit}</span>
                ) : (
                  <>{ing.quantity} {displayUnit}</>
                )}
              </div>
              {ing.notes && (
                <div className="text-xs text-text-secondary italic mt-1">💡 {ing.notes}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
