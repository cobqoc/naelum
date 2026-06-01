import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { uploadToBucket, getPublicUrl, type StorageBucket } from '@/lib/storage';
import { validateImageFile } from '@/lib/storage/validateImage';

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: '요청 형식이 잘못되었습니다.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const bucket = (formData.get('bucket') as string) || 'recipe-images';

  if (!file) {
    return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 });
  }

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
  const { path: uploadedPath, error } = await uploadToBucket(
    supabase,
    bucket as StorageBucket,
    filename,
    bytes,
    { contentType: file.type, upsert: false }
  );

  if (error) {
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다: ' + error.message }, { status: 500 });
  }

  const finalPath = uploadedPath ?? filename;
  const publicUrl = getPublicUrl(supabase, bucket as StorageBucket, finalPath);

  return NextResponse.json({ url: publicUrl, path: finalPath });
}
