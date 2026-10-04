import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadToBucket, getPublicUrl, type StorageBucket } from '@/lib/storage';

/**
 * 업로드 라우트(api/upload · api/upload-video) 공통 골격. 2026-10-04 AG2-33 (행위보존 — 두 라우트에서 *문구까지 같은*
 * 단계만 추출. 다른 단계 — rate limit 키·한도·문구, 버킷 선택, 파일 검증, 확장자 산출 — 은 각 라우트에 그대로).
 */

/** multipart 본문 파싱 + `file` 필드 존재 확인. 실패 시 원본과 같은 400. */
export async function parseUploadForm(
  request: Request,
): Promise<{ file: File; form: FormData; response?: undefined } | { response: NextResponse; file?: undefined; form?: undefined }> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { response: NextResponse.json({ error: '요청 형식이 잘못되었습니다.' }, { status: 400 }) };
  }

  const file = form.get('file') as File | null;
  if (!file) {
    return { response: NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 }) };
  }
  return { file, form };
}

/** 버킷 업로드(upsert 금지) → 실패 500 / 성공 `{ url, path }` — 원본 두 라우트와 같은 문구·형태. */
export async function uploadAndRespond(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  filename: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<NextResponse> {
  const { path: uploadedPath, error } = await uploadToBucket(supabase, bucket, filename, bytes, { contentType, upsert: false });

  if (error) {
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다: ' + error.message }, { status: 500 });
  }

  const finalPath = uploadedPath ?? filename;
  const publicUrl = getPublicUrl(supabase, bucket, finalPath);

  return NextResponse.json({ url: publicUrl, path: finalPath });
}
