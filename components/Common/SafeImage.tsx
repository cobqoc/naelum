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
  const [errored, setErrored] = useState(false);

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
      onError={() => setErrored(true)}
    />
  );
}
