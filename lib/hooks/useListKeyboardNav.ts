'use client';

import { useEffect, RefObject } from 'react';

/**
 * Dropdown/menu 화살표 키 navigation (a11y — WAI-ARIA menu 패턴).
 *
 * 동작:
 *  - ↓ 키: 다음 항목 focus (마지막 → 첫 wrap)
 *  - ↑ 키: 이전 항목 focus (첫 → 마지막 wrap)
 *  - Home: 첫 항목
 *  - End: 마지막 항목
 *  - focus 가 panel 밖이면 ↓ 시 첫 항목으로 진입
 *
 * 패턴 일관성 — `useOutsideClick`·`useEscapeKey`·`useFocusTrap` 와 동일.
 * useFocusTrap 의 Tab 순환과 직교 (둘 다 적용 가능).
 *
 * @param isOpen    listener 활성 조건
 * @param panelRef  panel ref — list items 검출 영역
 */
export function useListKeyboardNav(
  isOpen: boolean,
  panelRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const handler = (e: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      const items = getListItems(panel);
      if (items.length === 0) return;

      e.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      const currentIdx = active ? items.indexOf(active) : -1;

      let nextIdx: number;
      if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = items.length - 1;
      } else if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length;
      } else {
        // ArrowUp
        nextIdx = currentIdx <= 0 ? items.length - 1 : currentIdx - 1;
      }
      items[nextIdx].focus();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, panelRef]);
}

/**
 * panel 안의 list items (focusable element) 목록을 DOM 순서로 반환.
 * disabled·aria-hidden·display:none 제외 — useFocusTrap 와 동일 기준.
 */
function getListItems(panel: HTMLElement): HTMLElement[] {
  const sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(panel.querySelectorAll<HTMLElement>(sel))
    .filter(el => el.getAttribute('aria-hidden') !== 'true')
    .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
}
