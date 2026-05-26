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

/** 자식 input/select/textarea 에 적용할 표준 className/style — wrapper 와 짝.
 *
 * 모바일 16px / 데스크톱 14px:
 *  - iOS Safari 는 input/select font-size < 16px 일 때 포커스 시 *자동 줌* 발동
 *    (Apple Safari Web Content Guide 공식 동작). viewport 의 maximumScale=5,
 *    userScalable=true 라 줌 차단 불가능 — font-size 16px 강제만이 유일 해법.
 *  - 데스크톱은 자동 줌 동작 없음 → text-sm(14px) 시각 유지.
 *  - text-base md:text-sm: 모바일 우선 16px, md(768px)+ 에서 14px. */
export const INPUT_INNER_CLASS =
  'w-full bg-transparent text-base md:text-sm text-text-primary !outline-none !border-0 !border-none placeholder:text-text-muted/60';
export const INPUT_INNER_STYLE: CSSProperties = {
  border: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  outline: 'none',
};

/**
 * 큰 padding + secondary bg + rounded-xl 변형 — 페이지 수준 메인 input.
 * 카드 안 작은 input (default) 보다 prominent. BasicInfoSection·NutritionFields·TagsField 용.
 * InputBoxWrapper 의 default className 을 override 하는 utility — `className` prop 으로 전달.
 */
export const INPUT_VARIANT_COMFORTABLE =
  '!bg-background-secondary !rounded-xl !px-5 !py-4';
/** 큰 textarea 변형 — comfortable + 자유 min-height + top alignment */
export const INPUT_VARIANT_COMFORTABLE_TEXTAREA =
  '!bg-background-secondary !rounded-xl !px-5 !py-4 !min-h-[100px] !items-start';
/** comfortable 자식 input 의 text size override — wrapper padding 이 크니 본문 텍스트도 base */
export const INPUT_INNER_COMFORTABLE_CLASS =
  'w-full bg-transparent text-text-primary !outline-none !border-0 !border-none placeholder:text-text-muted/60';
