'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import CloseIcon from '@/components/icons/CloseIcon';

interface SmallModalProps {
  /** 헤더 제목(굵은 글씨 span 안에 그대로 렌더) */
  title: ReactNode;
  onClose: () => void;
  /** 배경 클릭 이벤트를 부모로 올리지 않음 — 클릭 가능한 카드 안에서 열리는 모달(RecipeFridgeModal)용 */
  stopBackdropPropagation?: boolean;
  children: ReactNode;
}

/**
 * 소형 중앙 모달 셸 — 배경(blur) + max-w-sm 패널 + 제목/닫기 헤더 + ESC·포커스 트랩.
 * CustomTimerSetup ↔ RecipeFridgeModal 에 13줄 셸이 복붙돼 있던 것을 하나로(ICL-20, 2026-10-04) —
 * 마크업·className·핸들러는 두 원본과 동일. 호출처가 조건부 마운트(마운트 = 열림)라 ESC·트랩은 항상 활성.
 */
export default function SmallModal({ title, onClose, stopBackdropPropagation = false, children }: SmallModalProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, true);
  useFocusTrap(true, panelRef);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={stopBackdropPropagation ? (e: MouseEvent) => { e.stopPropagation(); onClose(); } : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className="relative mx-4 w-full max-w-sm bg-background-secondary rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-bold text-text-primary">{title}</span>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-all"
          >
            <CloseIcon weight="regular" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
