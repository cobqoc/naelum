/**
 * 레시피 작성 폼의 태그 입력 블록 (presentational).
 *
 * god-file(NewRecipePage 1587줄) 분해의 첫 down-payment.
 * 원칙(ARCHITECTURE.md Strangler Fig): 상태/핸들러는 부모(page.tsx)가 그대로
 * 소유하고, 이 컴포넌트는 값과 콜백만 props 로 받는 순수 표현 컴포넌트다.
 * → 행위 변경 0, 회귀 위험을 타입(strict)·빌드·e2e 로 검증 가능.
 *
 * 결합도 최소 블록(태그)부터 추출해 패턴을 증명한다. 나머지 섹션은
 * 회귀 안전망(e2e/recipe-creation.spec.ts)이 충분히 두꺼워진 뒤 검토하에 진행.
 */

interface TagsFieldProps {
  label: string;
  placeholder: string;
  addButtonLabel: string;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  tags: string[];
  onAdd: () => void;
  onRemove: (tag: string) => void;
}

export default function TagsField({
  label,
  placeholder,
  addButtonLabel,
  tagInput,
  onTagInputChange,
  tags,
  onAdd,
  onRemove,
}: TagsFieldProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          className="flex-1 rounded-xl bg-background-secondary px-5 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
          placeholder={placeholder}
        />
        <button
          onClick={onAdd}
          disabled={!tagInput.trim() || tags.length >= 10}
          className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-50"
        >
          {addButtonLabel}
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-background-secondary text-sm flex items-center gap-2"
            >
              #{tag}
              <button onClick={() => onRemove(tag)} className="text-text-muted hover:text-error">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
