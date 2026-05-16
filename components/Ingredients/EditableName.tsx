'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';

/**
 * 탭해서 편집하는 재료명 UI (수정 모드 전용).
 *
 * god-file(IngredientForm) 분해 Phase 2. 원래 IngredientForm.tsx 안의 독립
 * 함수 컴포넌트를 파일만 분리(verbatim relocate) — prop·로직·JSX 원본과
 * byte-identical, 동작 변경 0.
 *
 * - 기본: 이름 + ✏️ 아이콘 버튼으로 표시 (read-only)
 * - 탭 → 인라인 input으로 전환
 * - blur 또는 Enter → 확정 + read-only 복귀 (빈 값은 이전 값 유지)
 */
export default function EditableName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prop 변경 시 draft를 동기화 (controlled input 외부 업데이트 대응)
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value); // 빈 값이면 원복
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary text-base font-medium outline-none ring-2 ring-accent-warm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary text-text-primary text-base font-medium text-left hover:bg-white/5 active:scale-[0.99] transition-all ring-1 ring-white/10"
    >
      <span className="truncate">{value || t.quickAdd.nameEmpty}</span>
      <span className="text-xs text-text-muted flex-shrink-0 ml-2">{t.quickAdd.editLabel}</span>
    </button>
  );
}
