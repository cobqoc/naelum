import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
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

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 허용)' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
      { status: 400 }
    );
  }

  // 파일 매직 바이트 검증
  const bytes = await file.arrayBuffer();
  const header = new Uint8Array(bytes, 0, 8);
  const FILE_SIGNATURES: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
  };
  const expectedSig = FILE_SIGNATURES[file.type];
  if (expectedSig && !expectedSig.every((b, i) => header[i] === b)) {
    return NextResponse.json(
      { error: '파일 내용이 선언된 형식과 일치하지 않습니다.' },
      { status: 400 }
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다: ' + error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, path: data.path });
}
