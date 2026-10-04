import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { type StorageBucket } from '@/lib/storage';
import { validateImageFile } from '@/lib/storage/validateImage';
import { parseUploadForm, uploadAndRespond } from '@/lib/storage/uploadRoute';

const ALLOWED_BUCKETS = ['recipe-images', 'tip-images', 'avatars', 'step-images', 'contact-screenshots'];

// POST /api/upload - 이미지 업로드 (Supabase Storage)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`upload:${user!.id}`, { windowMs: 60 * 1000, maxRequests: 10 })
  if (!allowed) {
    return NextResponse.json({ error: '업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  // 2026-10-04 AG2-33: 본문 파싱·파일 유무(400 문구)와 업로드·응답은 upload-video 와 같은 골격 → lib/storage/uploadRoute.
  const parsed = await parseUploadForm(request);
  if (parsed.response) return parsed.response;
  const { file, form: formData } = parsed;
  const bucket = (formData.get('bucket') as string) || 'recipe-images';

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: '허용되지 않는 버킷입니다.' }, { status: 400 });
  }

  // 타입·크기·매직바이트 검증 (lib/storage/validateImage 단일 출처)
  const validation = await validateImageFile(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const bytes = validation.bytes!;

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${user.id}/${Date.now()}.${ext}`;

  // bucket 은 ALLOWED_BUCKETS 로 런타임 검증됨(위) → StorageBucket 캐스트 안전
  return uploadAndRespond(supabase, bucket as StorageBucket, filename, bytes, file.type);
}
