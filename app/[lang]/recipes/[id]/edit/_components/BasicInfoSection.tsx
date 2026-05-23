import type { TranslationKeys } from '@/lib/i18n/translations'
import { CUISINE_TYPES, DIFFICULTY_LEVELS } from '@/lib/constants/recipe'
import InputBoxWrapper, {
  INPUT_INNER_STYLE,
  INPUT_INNER_COMFORTABLE_CLASS,
  INPUT_VARIANT_COMFORTABLE,
  INPUT_VARIANT_COMFORTABLE_TEXTAREA,
} from '@/components/UI/InputBoxWrapper'

/**
 * 레시피 *수정* 폼 Section 1(기본 정보) 표현 컴포넌트.
 *
 * god-file 분해 Phase 2 (ARCHITECTURE.md). recipes/new 의 폼과 edit 폼은 이미
 * 분기돼(단계 제목 유무·재료 삭제 임계·영양 검증 상한) new/_components 를 그대로
 * 재사용하면 edit 동작이 조용히 깨진다. 그래서 edit *현재* JSX 와 byte-identical 한
 * edit 전용 표현 컴포넌트로만 추출한다(행위 변경 0). 규약은 [[TagsField]] 동일:
 * 상태·setter 는 page 가 소유, 자식은 값+setter 만 받음. JSX·className·핸들러
 * 시그니처 원본과 동일. 검증: build(strict props)+e2e/recipe-edit.spec.ts.
 */

interface BasicInfoSectionProps {
  t: TranslationKeys
  tf: TranslationKeys['recipeForm']
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  servings: number | ''
  setServings: (v: number | '') => void
  prepTime: number | ''
  setPrepTime: (v: number | '') => void
  cookTime: number | ''
  setCookTime: (v: number | '') => void
  difficulty: string
  setDifficulty: (v: string) => void
  cuisineType: string
  setCuisineType: (v: string) => void
}

export default function BasicInfoSection({
  t,
  tf,
  title,
  setTitle,
  description,
  setDescription,
  servings,
  setServings,
  prepTime,
  setPrepTime,
  cookTime,
  setCookTime,
  difficulty,
  setDifficulty,
  cuisineType,
  setCuisineType,
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
            className={`${INPUT_INNER_COMFORTABLE_CLASS} min-h-[80px] resize-none`}
            style={INPUT_INNER_STYLE}
            placeholder={tf.descriptionPlaceholder}
          />
        </InputBoxWrapper>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
          <label className="text-sm font-medium text-text-secondary">{tf.prepTime} <span className="text-text-muted text-xs">{tf.optional}</span></label>
          <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
              min="0"
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
      </div>
    </section>
  )
}
