'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: React.ReactNode;
}

/**
 * onError 처리가 내장된 next/image 래퍼.
 * 이미지 로드 실패 시 fallback을 표시하거나 아무것도 렌더링하지 않습니다.
 */
export default function SafeImage({ src, fallback, alt, ...props }: SafeImageProps) {
  // 실패한 src 를 기억하고 *지금* src 와 같을 때만 폴백 — 같은 인스턴스가 다른 src 로 재사용되면
  // (예: 프로필 탭 전환) 자동으로 다시 이미지를 시도한다. 전엔 한 번 실패하면 src 가 바뀌어도
  // 🍳 폴백이 남았다(2026-10-04). 객체로 감싸 초기값(null)과 src 값이 우연히 같아지는 일도 없게.
  const [failed, setFailed] = useState<{ src: ImageProps['src'] } | null>(null);
  const errored = failed !== null && failed.src === src;

  if (errored) {
    return fallback ? <>{fallback}</> : (
      <div className="absolute inset-0 bg-background-tertiary flex items-center justify-center text-4xl">
        🍳
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={() => setFailed({ src })}
    />
  );
}
