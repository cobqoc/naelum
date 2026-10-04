import type { TranslationKeys } from '@/lib/i18n/translations';
import { CUISINE_TYPES, DISH_TYPES, DIFFICULTY_LEVELS } from '@/lib/constants/recipe';
import InputBoxWrapper, {
  INPUT_INNER_STYLE,
  INPUT_INNER_COMFORTABLE_CLASS,
  INPUT_VARIANT_COMFORTABLE,
  INPUT_VARIANT_COMFORTABLE_TEXTAREA,
} from '@/components/UI/InputBoxWrapper';

/**
 * 레시피 작성·수정 폼 공용 Section 1(기본 정보) 블록 (presentational).
 *
 * 2026-10-04 [PHR-D1 (a)-4·(b)-3] new/edit 두 벌을 한 벌로. 공통 블록(제목·설명·인분/시간/난이도·요리 종류 칩)은
 * 원래 diff -w 동일이었고, 섹션 래퍼(`<section>`+번호 h2)는 edit 처럼 이 컴포넌트가 소유(new 페이지가 갖고 있던
 * 같은 마크업을 이리로). new 전용 블록은 선택 prop 으로 보존 — 생략하면(edit) 렌더 안 함:
 *  - customCuisine: '기타' 선택 시 커스텀 요리 종류 입력
 *  - dish: 요리 유형(2단계) 칩 + '기타' 커스텀 입력
 * 상태·setter 는 page 가 소유, 이 컴포넌트는 값+setter 만(순수 controlled inputs).
 * 검증: 렌더 동등성 하네스(new·edit 각 props) + e2e recipe-creation "UI 회귀(Section1)"·recipe-edit (1).
 */

interface BasicInfoSectionProps {
  t: TranslationKeys;
  tf: TranslationKeys['recipeForm'];
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  servings: number | '';
  setServings: (v: number | '') => void;
  cookTime: number | '';
  setCookTime: (v: number | '') => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  cuisineType: string;
  setCuisineType: (v: string) => void;
  /** new 전용 — '기타' 요리 종류 커스텀 입력. 생략(edit) 시 렌더 안 함 */
  customCuisine?: { value: string; set: (v: string) => void };
  /** new 전용 — 요리 유형(2단계) 칩 + '기타' 커스텀 입력. 생략(edit) 시 렌더 안 함 */
  dish?: { type: string; setType: (v: string) => void; custom: string; setCustom: (v: string) => void };
}

export default function BasicInfoSection({
  t, tf,
  title, setTitle,
  description, setDescription,
  servings, setServings,
  cookTime, setCookTime,
  difficulty, setDifficulty,
  cuisineType, setCuisineType,
  customCuisine,
  dish,
}: BasicInfoSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">1</span>
        {tf.section1Basic}
      </h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{tf.title} *</label>
        <InputBoxWrapper className={INPUT_VARIANT_COMFORTABLE}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
            placeholder={tf.titlePlaceholder}
          />
        </InputBoxWrapper>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{tf.description}</label>
        <InputBoxWrapper className={INPUT_VARIANT_COMFORTABLE_TEXTAREA}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className={`${INPUT_INNER_COMFORTABLE_CLASS} min-h-[80px] resize-none`}
            style={INPUT_INNER_STYLE}
            placeholder={tf.descriptionPlaceholder}
          />
        </InputBoxWrapper>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">{tf.servings} <span className="text-text-muted text-xs">{tf.optional}</span></label>
          <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              placeholder={tf.optionalPlaceholder}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">{tf.cookTime} <span className="text-text-muted text-xs">{tf.optional}</span></label>
          <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
              min="0"
              placeholder={tf.optionalPlaceholder}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">{tf.difficulty} <span className="text-text-muted text-xs">{tf.optional}</span></label>
          <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
            >
              <option value="">{tf.selectNone}</option>
              {DIFFICULTY_LEVELS.map(d => (
                <option key={d.value} value={d.value}>{t.difficulty[d.value]}</option>
              ))}
            </select>
          </InputBoxWrapper>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{tf.cuisine}</label>
        <div className="flex flex-wrap gap-2">
          {CUISINE_TYPES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCuisineType(c.value)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                cuisineType === c.value
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-muted hover:bg-white/10'
              }`}
            >
              {t.cuisineLabels[c.value as keyof typeof t.cuisineLabels] ?? c.label}
            </button>
          ))}
        </div>
        {/* 기타 선택 시 커스텀 입력 (new 전용) */}
        {customCuisine && cuisineType === 'other' && (
          <InputBoxWrapper className="!rounded-xl !px-4 !py-3">
            <input
              type="text"
              value={customCuisine.value}
              onChange={(e) => customCuisine.set(e.target.value)}
              placeholder={tf.cuisinePlaceholder}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
        )}
      </div>

      {/* 요리 유형 (2단계) - 조건부 표시 (new 전용) */}
      {dish && cuisineType && (
        <div className="space-y-2 animate-fadeIn">
          <label className="text-sm font-medium text-text-secondary">
            {tf.dishType} <span className="text-text-muted text-xs">{tf.optionalInputHint}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {DISH_TYPES.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => dish.setType(d.value)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  dish.type === d.value
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-background-secondary text-text-muted hover:bg-white/10'
                }`}
              >
                {t.dishLabels[d.value as keyof typeof t.dishLabels] ?? d.label}
              </button>
            ))}
          </div>
          {/* 기타 선택 시 커스텀 입력 */}
          {dish.type === 'other' && (
            <InputBoxWrapper className="!rounded-xl !px-4 !py-3">
              <input
                type="text"
                value={dish.custom}
                onChange={(e) => dish.setCustom(e.target.value)}
                placeholder={tf.dishTypePlaceholder}
                className={INPUT_INNER_COMFORTABLE_CLASS}
                style={INPUT_INNER_STYLE}
              />
            </InputBoxWrapper>
          )}
        </div>
      )}
    </section>
  );
}
