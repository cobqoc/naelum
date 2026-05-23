'use client';

import type { CSSProperties, ReactNode } from 'react';

interface InputBoxWrapperProps {
  children: ReactNode;
  /** 추가 className — 보통 `flex-1 min-w-[160px]` 같은 layout. flex-wrap·gap 같은 chip 용 옵션도 OK */
  className?: string;
  /** 자체 click 핸들러 — 보통 내부 input 포커스 (예: chip input) */
  onClick?: () => void;
}

/**
 * 다크 테마 input/select/textarea 의 *공통 wrapper*. 단일 진실 소스.
 *
 * Tailwind 4 의 ring/outline 갱신이 같은 className 으로도 *각 위치별로 다르게* 평가되는
 * subtle한 회귀가 있어 (2026-05-24 진단), focus-within ring 이 *확실히 작동하는*
 * className 조합을 한 곳에 고정해 모든 input 이 동일한 wrapper 를 사용하도록 함.
 *
 * 패턴:
 *  - `overflow-hidden + [&>*]:!border-0 + style={border:'none'}` — user-agent default
 *    border/outline 강제 0 (다크모드에서 visible 잔존 차단)
 *  - `ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-accent-warm` —
 *    base + focus 시 amber outline
 *  - `flex items-center min-h-[34px] rounded-md bg-background-tertiary px-2 py-1.5` —
 *    layout. chip input 처럼 flex-wrap·gap 필요하면 className 으로 추가
 *
 * 호출처에서 children 으로 input/select/textarea/chip 들을 넣음:
 * ```tsx
 * <InputBoxWrapper>
 *   <input className="w-full bg-transparent text-sm text-text-primary !outline-none !border-0"
 *          style={{ border: 'none', outline: 'none' }} />
 * </InputBoxWrapper>
 * ```
 */
export default function InputBoxWrapper({ children, className = '', onClick }: InputBoxWrapperProps) {
  return (
    <div
      className={`flex items-center min-h-[34px] rounded-md bg-background-tertiary px-2 py-1.5 cursor-text overflow-hidden transition-all ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-accent-warm [&>*]:!border-0 [&>*]:!border-l-0 [&>*]:!border-r-0 ${className}`}
      style={INPUT_BOX_STYLE}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

const INPUT_BOX_STYLE: CSSProperties = { border: 'none' };

/** 자식 input/select/textarea 에 적용할 표준 className/style — wrapper 와 짝. */
export const INPUT_INNER_CLASS =
  'w-full bg-transparent text-sm text-text-primary !outline-none !border-0 !border-none placeholder:text-text-muted/60';
export const INPUT_INNER_STYLE: CSSProperties = {
  border: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  outline: 'none',
};
