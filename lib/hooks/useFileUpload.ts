'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadToBucket, getPublicUrl, type StorageBucket } from '@/lib/storage';

/**
 * 이미지 업로드 공용 hook — 4 페이지(레시피·팁 new/edit) 10 인스턴스의 boilerplate
 * 통합. 추출 전 각 호출은 ~30줄(검증·인증·경로 빌드·업로드·에러 토스트), 추출 후 ~3줄.
 *
 * **Why 추출** ([[feedback-check-line-count-before-adding]]):
 *  - 같은 패턴이 10번 반복 — Rule of Three 한참 초과
 *  - `recipes/new` 가 다시 god-file 화 (1042줄, 분해 필수 임계 900 초과)
 *  - 2026-05-17 Phase 2 ([[project-god-file-phase2]]) 가 잡았던 사이클 재발
 *
 * **사용 패턴**:
 *   const thumb = useFileUpload(supabase, router, toast, {
 *     bucket: 'recipe-images',
 *     prefix: 'thumbnail',
 *     onSuccess: setThumbnailImage,
 *     errors: { imageType: tf.errorImageType, imageSize: tf.errorImageSize,
 *               upload: tf.errorImageUpload, loginRequired: tf.errorLoginRequired },
 *   });
 *   // <input onChange={e => e.target.files?.[0] && thumb.upload(e.target.files[0])} />
 *   // {thumb.uploading && <Spinner />}
 *
 * **차이 흡수**:
 *  - 레시피 페이지: `loginRequired` 토스트 + redirect
 *  - 팁 페이지: redirect 만 (loginRequired undefined)
 *  - 단계 이미지: `onSuccess` 가 setSteps(prev => prev.map(...)) 패턴 캡처
 *  - 썸네일·재료 준비 이미지: `onSuccess` 가 setX(url) 단순
 *
 * **불변식**:
 *  - 검증 실패(mime·size) → 토스트만, 업로드 시도 X
 *  - 미인증 → 토스트(optional) + redirect, 폼 상태 그대로 (재시도 안 함)
 *  - upload error → `console.error` (silent fail 차단) + 토스트 + onSuccess 미호출
 *  - `uploading` 은 finally 에서 false (어느 분기든 정확)
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UseFileUploadConfig {
  bucket: StorageBucket;
  /** 파일명 prefix — 'thumbnail' | 'ingredients' | 'tip-thumb' | `step-${i}` 등 */
  prefix: string;
  /** 업로드 성공 → publicUrl 받아 외부 state 세팅. 호출자 책임 */
  onSuccess: (publicUrl: string) => void;
  errors: {
    imageType: string;
    imageSize: string;
    upload: string;
    /** undefined 면 미인증 시 토스트 생략 (팁 패턴) */
    loginRequired?: string;
  };
}

export interface UseFileUploadResult {
  upload: (file: File) => Promise<void>;
  uploading: boolean;
}

/**
 * 파일명 빌더 — userId/{prefix}-{ms}-{rand6}.{ext}. 외부 추출로 vitest 가능.
 * 확장자는 원본 파일명 마지막 .뒤. 없으면 'bin'.
 */
export function buildUploadFileName(userId: string, prefix: string, originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  const ext = dot > 0 && dot < originalName.length - 1 ? originalName.slice(dot + 1) : 'bin';
  return `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
}

/**
 * 순수 async 업로드 함수 — hook 아닌 standalone. step image 같이 per-index 상태로
 * `useState`(boolean) 이 맞지 않는 케이스용. onStart·onFinally lifecycle hook 제공.
 *
 * useFileUpload 가 이 함수를 wrap 해 단일 boolean 상태 관리. caller 가 자기 state
 * 매핑 책임 — `onStart: () => setUploadingX(index)`, `onFinally: () => setUploadingX(null)`.
 */
export async function runImageUpload(
  supabase: SupabaseClient,
  router: { push: (url: string) => void },
  toast: { error: (msg: string) => void },
  file: File,
  config: UseFileUploadConfig & {
    onStart?: () => void;
    onFinally?: () => void;
  },
): Promise<void> {
  if (!file.type.startsWith('image/')) {
    toast.error(config.errors.imageType);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error(config.errors.imageSize);
    return;
  }

  config.onStart?.();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // 세션 만료 — submit 패턴과 일관: /signin 으로 redirect 해 즉시 복구 동선.
      // 팁 페이지는 loginRequired 토스트 없이 redirect 만 (옛 패턴 보존).
      if (config.errors.loginRequired) toast.error(config.errors.loginRequired);
      router.push('/signin');
      return;
    }

    const fileName = buildUploadFileName(user.id, config.prefix, file.name);
    const { path, error } = await uploadToBucket(supabase, config.bucket, fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;

    const publicUrl = getPublicUrl(supabase, config.bucket, path ?? fileName);
    config.onSuccess(publicUrl);
  } catch (err) {
    // silent fail 차단 — DB 쓰기 RLS 거부 + storage 정책 변경 등 표면화.
    console.error('Image upload error:', err);
    toast.error(config.errors.upload);
  } finally {
    config.onFinally?.();
  }
}

export function useFileUpload(
  supabase: SupabaseClient,
  router: { push: (url: string) => void },
  toast: { error: (msg: string) => void },
  config: UseFileUploadConfig,
): UseFileUploadResult {
  const [uploading, setUploading] = useState(false);
  // config 는 매 렌더 새 객체 (caller 가 inline 전달 일반) — ref 로 stale closure 회피
  // + useCallback deps 안정화. React 19 `react-hooks/refs` 가 render 중 ref 갱신
  // 차단 → useEffect 로 commit 후 sync. 첫 렌더는 useRef(config) 가 초기값,
  // 이후 매 렌더 effect 가 최신값 mirror. 1-render lag 은 async upload 사용자
  // 액션이라 무해 (사용자가 즉시 클릭 못 함).
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  const upload = useCallback(
    async (file: File) => {
      const cfg = configRef.current;
      await runImageUpload(supabase, router, toast, file, {
        ...cfg,
        onStart: () => setUploading(true),
        onFinally: () => setUploading(false),
      });
    },
    [supabase, router, toast],
  );

  return { upload, uploading };
}
