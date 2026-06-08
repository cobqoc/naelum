'use client';

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import {
  addSubstituteChip,
  removeSubstituteChipAt,
  updateSubstituteNote,
  type SubstituteEntry,
} from '@/lib/recipes/substituteChips';
import InputBoxWrapper from '@/components/UI/InputBoxWrapper';
import { useI18n } from '@/lib/i18n/context';

interface SubstituteChipInputProps {
  value: SubstituteEntry[];
  onChange: (next: SubstituteEntry[]) => void;
  /** 이름 입력 placeholder (예: "대체 재료 추가...") */
  placeholder?: string;
  /** chip 내부 note input placeholder (예: "예: 1큰술") */
  notePlaceholder?: string;
  /** note 없을 때 chip 안에 표시되는 hint (예: "+ 양") */
  noteHint?: string;
  ariaLabel?: string;
}

/**
 * 대체 재료 chip 입력 — 사용자 입력을 칩으로 즉시 시각화 + 칩마다 *수량 note* 부착 가능.
 *
 * 데이터 모델: SubstituteEntry[] = { name; note? }[]
 *  - name: "멸치 다시다"
 *  - note: "1큰술" (선택) — 대체 시 사용할 양 자유 텍스트 ("약간"·"100ml" 등도 OK)
 *
 * 행동 — 이름 입력 (기존):
 *  - 쉼표(직접 타이핑 또는 paste) 또는 Enter → 칩 추가 (trim, dedup case-insensitive, empty skip)
 *  - 입력이 비어있을 때 Backspace → 마지막 칩 제거
 *  - blur 시 input 잔여값 있으면 칩으로 확정
 *
 * 행동 — 양 note (신규):
 *  - 칩 본문 클릭(✕ 영역 제외) → inline note input 펼침, 현재 note prefill
 *  - Enter 또는 blur → updateSubstituteNote 로 저장 + 압축 표시 (없으면 chip 안 hint "+ 양")
 *  - Escape → 저장 안 하고 닫음
 *
 * 한글/일본어/중국어 IME 가드 (이름·note input 둘 다):
 *  - 조합 중(`isComposing`)에는 Enter·","·Backspace 핸들러 무시
 *  - 사용자 입력이 "고추가루, 다진마늘" 가 "고추, 추, 간O" 식으로 잘게 쪼개지던 회귀 fix
 *  - 표준 `keyCode === 229` 도 함께 체크 (일부 브라우저/IME 가 isComposing 만으로는 안 잡힘)
 *
 * 스타일: warning(amber) 톤 — RecipeBrowseView 의 substitute 표시와 시각 언어 통일.
 */
export default function SubstituteChipInput({
  value,
  onChange,
  placeholder,
  notePlaceholder,
  noteHint,
  ariaLabel,
}: SubstituteChipInputProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const composingRef = useRef(false);
  const noteComposingRef = useRef(false);

  // 편집 시작 시 note input autofocus + 선택. value 변동(삭제 등)으로 인덱스 어긋나면 닫음.
  useEffect(() => {
    if (editingNoteIndex === null) return;
    if (editingNoteIndex >= value.length) {
      // 외부에서 chip 삭제로 편집 인덱스가 out-of-range — 편집 모드 해제.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingNoteIndex(null);
      setNoteDraft('');
      return;
    }
    noteInputRef.current?.focus();
    noteInputRef.current?.select();
  }, [editingNoteIndex, value.length]);

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
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
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
    if (editingNoteIndex === index) {
      setEditingNoteIndex(null);
      setNoteDraft('');
    }
    onChange(removeSubstituteChipAt(value, index));
    inputRef.current?.focus();
  };

  const startEditNote = (index: number) => {
    setEditingNoteIndex(index);
    setNoteDraft(value[index]?.note ?? '');
  };

  const commitNote = useCallback(() => {
    if (editingNoteIndex === null) return;
    const idx = editingNoteIndex;
    const next = updateSubstituteNote(value, idx, noteDraft);
    if (next !== value) onChange(next);
    setEditingNoteIndex(null);
    setNoteDraft('');
  }, [editingNoteIndex, noteDraft, value, onChange]);

  const handleNoteKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (noteComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNote();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingNoteIndex(null);
      setNoteDraft('');
    }
  };

  return (
    <InputBoxWrapper
      className="flex-wrap gap-1.5"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-xs text-warning shrink-0" aria-hidden>
        🔄
      </span>
      {value.map((entry, i) => {
        const isEditing = editingNoteIndex === i;
        return (
          <span
            key={`${entry.name}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
          >
            {isEditing ? (
              <>
                <span>{entry.name}</span>
                <input
                  ref={noteInputRef}
                  type="text"
                  value={noteDraft}
                  style={{ border: 'none', outline: 'none' }}
                  onCompositionStart={() => { noteComposingRef.current = true; }}
                  onCompositionEnd={() => { noteComposingRef.current = false; }}
                  onChange={e => setNoteDraft(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  onBlur={() => { if (!noteComposingRef.current) commitNote(); }}
                  onClick={e => e.stopPropagation()}
                  placeholder={notePlaceholder ?? ''}
                  aria-label={`${entry.name} ${noteHint ?? ''}`.trim()}
                  className="w-16 bg-transparent text-xs text-warning placeholder:text-warning/40 !outline-none !border-0 !border-none"
                />
              </>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  startEditNote(i);
                }}
                className="inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{entry.name}</span>
                {entry.note ? (
                  <span className="text-warning/80">· {entry.note}</span>
                ) : noteHint ? (
                  <span className="text-warning/50 font-normal">{noteHint}</span>
                ) : null}
              </button>
            )}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                removeAt(i);
              }}
              className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-warning/70 hover:text-warning hover:bg-warning/20 transition-colors"
              aria-label={t.recipe.removeSubstituteAria.replace('{name}', entry.name)}
            >
              ×
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        onChange={e => {
          const v = e.target.value;
          if (composingRef.current) {
            setDraft(v);
            return;
          }
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
