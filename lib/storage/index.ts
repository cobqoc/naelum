import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 스토리지 격리 래퍼 — Supabase Storage API 를 한 모듈로 캡슐화.
 *
 * ARCHITECTURE.md "AWS 이전" 원칙: Storage 호출을 격리해 향후 S3/R2 이전 시
 * 이 파일만 교체하면 되도록 한다. 동작은 기존 직접 호출과 동일(thin
 * pass-through) — 같은 버킷·같은 업로드·같은 public URL.
 *
 * 클라이언트는 호출측이 주입(브라우저=createClient(), 서버 라우트=server
 * client / service-role). 래퍼는 클라이언트 종류를 모름 = 격리 유지.
 */

// 앱에서 실제 사용하는 버킷 전체 (api/upload·api/upload-video 의 ALLOWED_BUCKETS 와 동일 집합)
export type StorageBucket =
  | 'recipe-images'
  | 'recipe-videos'
  | 'tip-images'
  | 'avatars'
  | 'step-images'
  | 'contact-screenshots'
  | 'recipe-completion-photos';

export interface UploadOptions {
  cacheControl?: string;
  upsert?: boolean;
  contentType?: string;
}

export interface UploadResult {
  /** 저장된 객체 경로 (Supabase data.path). 실패 시 null */
  path: string | null;
  /** 실패 시 메시지, 성공 시 null */
  error: { message: string } | null;
}

export async function uploadToBucket(
  client: SupabaseClient,
  bucket: StorageBucket,
  path: string,
  file: File | Blob | ArrayBuffer | ArrayBufferView,
  options?: UploadOptions
): Promise<UploadResult> {
  const { data, error } = await client.storage.from(bucket).upload(path, file, options);
  return {
    path: data?.path ?? null,
    error: error ? { message: error.message } : null,
  };
}

export function getPublicUrl(
  client: SupabaseClient,
  bucket: StorageBucket,
  path: string
): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export interface SignedUploadResult {
  /** 클라이언트가 파일 본문을 PUT 할 서명 URL. 실패 시 null */
  signedUrl: string | null;
  /** uploadToSignedUrl 용 토큰. 실패 시 null */
  token: string | null;
  path: string;
  error: { message: string } | null;
}

/**
 * 서명 업로드 URL 발급 — 파일 본문이 서버(Vercel 함수 본문 4.5MB 한도)를 거치지 않고 스토리지로 직접 간다.
 * 발급 권한은 호출 클라이언트의 INSERT 정책을 따르고, 크기·형식 강제는 버킷 설정(file_size_limit·allowed_mime_types)이 맡는다.
 * 2026-10-20 AG2-10.
 */
export async function createSignedUpload(
  client: SupabaseClient,
  bucket: StorageBucket,
  path: string
): Promise<SignedUploadResult> {
  const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(path);
  return {
    signedUrl: data?.signedUrl ?? null,
    token: data?.token ?? null,
    path: data?.path ?? path,
    error: error ? { message: error.message } : null,
  };
}
