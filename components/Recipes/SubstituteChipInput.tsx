'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { addSubstituteChip, removeSubstituteChipAt } from '@/lib/recipes/substituteChips';

interface SubstituteChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * 대체 재료 chip 입력 — 사용자 입력을 칩으로 즉시 시각화.
 *
 * 행동:
 *  - 쉼표 또는 Enter 입력 시 칩 추가 (trim, dedup case-insensitive, empty skip)
 *  - 입력이 비어있을 때 Backspace → 마지막 칩 제거
 *  - 칩 ✕ 버튼 클릭 → 해당 칩 제거
 *  - blur 시 input 잔여값이 있으면 칩으로 확정
 *
 * 스타일: warning(amber) 톤 — RecipeBrowseView 의 substitute 표시와 시각 언어 통일.
 * 화이트 라벨/구분자/긴 placeholder 가 다 사라져 옵션 줄 가로 노이즈 크게 감소.
 */
export default function SubstituteChipInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: SubstituteChipInputProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commitDraft = useCallback(
    (raw: string) => {
      const next = addSubstituteChip(value, raw);
      setDraft('');
      if (next !== value) onChange(next);
    },
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft(draft);
      return;
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const removeAt = (index: number) => {
    onChange(removeSubstituteChipAt(value, index));
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[34px] rounded-md bg-background-tertiary px-2 py-1.5 ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-accent-warm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-xs text-warning shrink-0" aria-hidden>
        🔄
      </span>
      {value.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
        >
          <span>{chip}</span>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              removeAt(i);
            }}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-warning/70 hover:text-warning hover:bg-warning/20 transition-colors"
            aria-label={`${chip} 제거`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={e => {
          const v = e.target.value;
          if (v.endsWith(',')) {
            commitDraft(v.slice(0, -1));
            return;
          }
          setDraft(v);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => commitDraft(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        aria-label={ariaLabel}
        className="flex-1 min-w-[80px] bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 outline-none"
      />
    </div>
  );
}
