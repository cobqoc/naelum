'use client';

import { useRef } from 'react';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { subjectParticle } from '@/lib/i18n/josa';
import { useI18n } from '@/lib/i18n/context';

interface ActionItem {
  id: string;
  ingredient_name: string;
  emoji?: string | null;
}

interface Props {
  item: ActionItem | null;
  onClose: () => void;
  onCook: (item: ActionItem) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (item: ActionItem) => void;
}

/**
 * 재료 chip 탭 시 열리는 액션 시트.
 * 모바일: 하단 바텀시트 (slide-up).
 * 데스크톱: 화면 중앙 카드.
 *
 * 3가지 액션:
 *  - 🍳 이 재료로 만들기: 해당 재료가 들어간 레시피 페이지로 이동
 *  - ✏️ 수정하기: 기존 IngredientDetailModal 열기
 *  - 🗑 삭제하기: 확인 후 삭제
 */
export default function IngredientActionSheet({ item, onClose, onCook, onEdit, onDelete }: Props) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, !!item);
  useFocusTrap(!!item, panelRef);

  if (!item) return null;

  // confirm() 제거 — 즉시 삭제 후 undo 토스트로 복원 가능 (HomeClient에서 처리)
  const handleDelete = () => {
    onDelete(item);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[sheet-fade-in_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div ref={panelRef} className="relative w-full md:max-w-sm bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out] md:animate-[sheet-fade-in_0.15s_ease-out]">
        {/* 핸들 (모바일) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 md:pt-5 pb-4 text-center border-b border-white/5">
          {item.emoji && <div className="text-4xl mb-1.5">{item.emoji}</div>}
          <h3 className="text-lg font-bold text-text-primary">{item.ingredient_name}</h3>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          {/* Primary: 이 재료로 만들기 */}
          <button
            onClick={() => onCook(item)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            <span className="text-xl">🍳</span>
            <span className="flex-1 text-left">
              <span className="block text-base">{t.ingredient.actionCookTitle}</span>
              <span className="block text-xs font-normal opacity-80 mt-0.5">
                {/* {subj}(주격 조사 이/가)는 ko 문구에만 있다 — 다른 로케일은 치환 대상 없음 (ICL-02 2026-10-04) */}
                {t.ingredient.actionCookDesc
                  .replace('{name}', () => item.ingredient_name)
                  .replace('{subj}', () => subjectParticle(item.ingredient_name))}
              </span>
            </span>
            <span className="text-lg">→</span>
          </button>

          {/* Secondary: 수정 */}
          <button
            onClick={() => onEdit(item)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background-tertiary hover:bg-white/5 text-text-primary transition-colors"
          >
            <span className="text-lg">✏️</span>
            <span className="flex-1 text-left text-sm">{t.ingredient.actionEdit}</span>
          </button>

          {/* Tertiary: 삭제 */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background-tertiary hover:bg-error/10 text-error transition-colors"
          >
            <span className="text-lg">🗑</span>
            <span className="flex-1 text-left text-sm">{t.ingredient.actionDelete}</span>
          </button>
        </div>

        {/* 취소 */}
        <button
          onClick={onClose}
          className="w-full py-3 text-sm text-text-muted hover:text-text-primary border-t border-white/5 transition-colors"
        >
          {t.common.cancel}
        </button>
      </div>

      {/* 키프레임: slideUp 은 globals.css 전역과 동일해 그대로 사용, opacity 전용 페이드는 sheet-fade-in
          (전역 fadeIn 은 translateY 포함이라 이름 분리). styled-jsx 런타임 제거, perf 2026-09-27 */}
    </div>
  );
}
