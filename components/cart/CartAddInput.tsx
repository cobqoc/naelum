import type { TranslationKeys } from '@/lib/i18n/translations';
import { COMMON_UNITS, type CartAddSource, type Suggestion } from '@/components/cart/types';

/**
 * cart 재료 추가 입력창 + 단위 select + 자동완성 목록 (순수 표현).
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2. 디바운스·addItem·suggestions
 * fetch 등 로직은 전부 부모 소유 — 이 컴포넌트는 값+콜백만. JSX·className·핸들러
 * 시그니처 원본과 byte-identical → 행위 변경 0. 회귀 가드: cart.spec.ts
 * (직접 입력 추가)·cart-note 등.
 */

interface CartAddInputProps {
  t: TranslationKeys;
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputText: string;
  setInputText: (v: string) => void;
  inputUnit: string;
  setInputUnit: (v: string) => void;
  inputFocused: boolean;
  setInputFocused: (v: boolean) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  adding: boolean;
  addItem: (name: string, category?: string, unit?: string, source?: CartAddSource) => void;
}

export default function CartAddInput({
  t,
  inputRef,
  inputText,
  setInputText,
  inputUnit,
  setInputUnit,
  inputFocused,
  setInputFocused,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  adding,
  addItem,
}: CartAddInputProps) {
  return (
    <div className="relative px-3 py-2.5 border-b border-white/10 flex-shrink-0">
      <div
        className={`relative w-full flex items-center gap-0 overflow-hidden bg-background-secondary transition-all duration-300 rounded-xl [&>*]:!border-0 ${
          inputFocused
            ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)] scale-[1.01]'
            : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)] scale-100'
        }`}
        style={{ border: 'none' }}
      >
        <input
            ref={inputRef}
            type="search"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputText.trim()) {
                e.preventDefault();
                addItem(inputText, '', undefined, 'manual');
              }
              if (e.key === 'Escape') {
                setInputText('');
                setShowSuggestions(false);
              }
            }}
            onFocus={() => { setInputFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
            onBlur={() => setInputFocused(false)}
            placeholder={t.cart.inputPlaceholder}
            className="w-full bg-transparent text-text-primary placeholder-text-muted !outline-none !border-0 !border-none pl-3 pr-2 py-2 text-sm"
            style={{ border: 'none', outline: 'none' }}
          />
        {/* 단위 select — DetailFields 패턴 (appearance-none + ▾) */}
        <div className="relative flex-shrink-0 flex items-center mr-1.5">
          <select
            value={inputUnit}
            onChange={e => setInputUnit(e.target.value)}
            onClick={e => e.stopPropagation()}
            aria-label={t.cart.unitLabel}
            className="bg-background-tertiary text-text-secondary text-xs rounded-md appearance-none cursor-pointer outline-none border-0 pl-2 pr-5 py-1 hover:bg-background-tertiary/80"
            style={{ maxWidth: '5.5rem' }}
          >
            <option value="">{t.cart.unitLabel}</option>
            {COMMON_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 text-text-muted text-[9px]">▾</span>
        </div>
        {adding ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent flex-shrink-0 mr-3" />
        ) : (
          <button
            onMouseDown={() => inputText.trim() && addItem(inputText, '', undefined, 'manual')}
            disabled={!inputText.trim()}
            className="flex-shrink-0 mr-2 px-3 py-1.5 text-xs rounded-lg bg-accent-warm font-semibold text-background-primary transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed !outline-none !border-0"
            style={{ border: 'none' }}
          >
            {t.cart.addButton}
          </button>
        )}
      </div>

      {/* 자동완성 목록 */}
      {showSuggestions && inputText.trim() && (
        <div className="absolute left-3 right-3 top-full mt-1 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-10 overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.id}
              onMouseDown={() => addItem(s.name, s.category, undefined, 'autocomplete')}
              className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <span className="text-accent-warm flex-shrink-0">+</span>
              <span className="text-text-primary flex-1 truncate">{s.name}</span>
              {s.category && <span className="text-text-muted">{s.category}</span>}
            </button>
          ))}
          <button
            onMouseDown={() => addItem(inputText, '', undefined, 'manual')}
            className="w-full text-left px-4 py-2.5 text-xs hover:bg-accent-warm/10 transition-colors flex items-center gap-2 border-t border-white/5"
          >
            <span className="text-accent-warm flex-shrink-0">+</span>
            <span className="text-accent-warm font-medium truncate">{t.cart.directAddLabel.replace('{name}', inputText)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
