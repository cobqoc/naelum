'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { addSubstituteChip, removeSubstituteChipAt } from '@/lib/recipes/substituteChips';
import InputBoxWrapper from '@/components/UI/InputBoxWrapper';

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
 *  - 쉼표(직접 타이핑 또는 paste) 또는 Enter 입력 시 칩 추가 (trim, dedup case-insensitive, empty skip)
 *  - 입력이 비어있을 때 Backspace → 마지막 칩 제거
 *  - 칩 ✕ 버튼 클릭 → 해당 칩 제거
 *  - blur 시 input 잔여값이 있으면 칩으로 확정
 *
 * 한글/일본어/중국어 IME (Input Method Editor) 가드:
 *  - 조합 중(`isComposing`)에는 Enter·","·Backspace 핸들러를 모두 무시
 *  - IME 가 Enter 를 "조합 확정" 으로 쓰는 동작과 충돌 방지
 *  - 사용자 입력 "고추가루, 다진마늘" 가 "고추, 추, 간O" 식으로 잘게 쪼개지던 회귀 fix
 *  - 표준 `keyCode === 229` 도 함께 체크 (일부 브라우저/IME 가 isComposing 만으로는 안 잡힘)
 *
 * 스타일: warning(amber) 톤 — RecipeBrowseView 의 substitute 표시와 시각 언어 통일.
 */
export default function SubstituteChipInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: SubstituteChipInputProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composingRef = useRef(false);

  const commitDraft = useCallback(
    (raw: string) => {
      const next = addSubstituteChip(value, raw);
      setDraft('');
      if (next !== value) onChange(next);
    },
    [value, onChange]
  );

  /** 쉼표 포함 문자열(주로 paste) 을 split → 마지막 segment 만 draft 로 남김 */
  const commitWithCommas = useCallback(
    (v: string) => {
      const parts = v.split(',');
      const last = parts.pop() ?? '';
      let next = value;
      for (const part of parts) {
        next = addSubstituteChip(next, part);
      }
      if (next !== value) onChange(next);
      setDraft(last);
    },
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME 조합 중: 모든 단축키 핸들러 무시 (Enter = 한글 확정용)
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }
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
    <InputBoxWrapper
      className="flex-wrap gap-1.5"
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
        // SearchBar 패턴: outline/border 강제 0 (inline style + Tailwind important)
        style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
        }}
        onChange={e => {
          const v = e.target.value;
          // IME 조합 중 onChange 는 draft 만 갱신 (쉼표 split 금지 — 한글 조합 깨짐)
          if (composingRef.current) {
            setDraft(v);
            return;
          }
          // paste 등으로 쉼표 포함 문자열이 들어오면 split 처리
          if (v.includes(',')) {
            commitWithCommas(v);
            return;
          }
          setDraft(v);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!composingRef.current) commitDraft(draft);
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        aria-label={ariaLabel}
        className="flex-1 min-w-[80px] bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 !outline-none !border-0 !border-none"
      />
    </InputBoxWrapper>
  );
}
