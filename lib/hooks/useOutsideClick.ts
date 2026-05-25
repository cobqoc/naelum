'use client';

import { useEffect, RefObject } from 'react';

/**
 * Dropdown/popover 외부 클릭 닫기 hook.
 *
 * 기존 패턴(`<div className="fixed inset-0 z-40" onClick={onClose} />`)은
 * 투명 overlay 가 첫 클릭을 *소비* 해 다른 버튼으로 전파 안 됨 → 사용자가
 * "어 안 눌리네" 하며 두 번 클릭해야 다른 dropdown 열림. (이슈 #1)
 *
 * document-level mousedown 리스너로 변경하면:
 *  1) 클릭이 panel/trigger 외부면 close
 *  2) 클릭 이벤트는 *그대로* 다음 element 에 도달 → cart 버튼 클릭 한 번에 cart 열림
 *
 * @param isOpen     listener 활성 조건 (false 면 listener 등록 안 함)
 * @param panelRef   panel 내부 클릭은 닫기 제외
 * @param onClose    외부 클릭 감지 시 호출
 * @param triggerRef trigger 버튼 클릭은 닫기 제외 (button 의 onClick 가 toggle 처리)
 */
export function useOutsideClick(
  isOpen: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen, panelRef, triggerRef, onClose]);
}
