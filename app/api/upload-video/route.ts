import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { uploadToBucket, getPublicUrl } from '@/lib/storage';

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/upload-video — 레시피 영상 업로드 (Supabase Storage recipe-videos 버킷)
// KMP 모바일 앱 전용: /api/upload(이미지 전용)와 분리.
// anonKey 보안 채무 해소 — 서버가 requireAuth(쿠키)로 사용자 검증 후 service-role 업로드.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`upload-video:${user!.id}`, { windowMs: 60 * 1000, maxRequests: 3 });
  if (!allowed) {
    return NextResponse.json({ error: '영상 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: '요청 형식이 잘못되었습니다.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: '지원하지 않는 파일 형식입니다. (MP4, MOV, WebM만 허용)' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: '파일 크기는 100MB를 초과할 수 없습니다.' },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();

  // MP4 매직 바이트 검증 (ftyp box — offset 4)
  if (file.type === 'video/mp4') {
    const header = new Uint8Array(bytes, 4, 4);
    const ftyp = [0x66, 0x74, 0x79, 0x70]; // "ftyp"
    if (!ftyp.every((b, i) => header[i] === b)) {
      return NextResponse.json({ error: '파일 내용이 선언된 형식과 일치하지 않습니다.' }, { status: 400 });
    }
  }

  const ext = file.type === 'video/quicktime' ? 'mov' : file.type === 'video/webm' ? 'webm' : 'mp4';
  const filename = `${user!.id}/${Date.now()}.${ext}`;

  const { path: uploadedPath, error } = await uploadToBucket(
    supabase,
    'recipe-videos',
    filename,
    bytes,
    { contentType: file.type, upsert: false }
  );

  if (error) {
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다: ' + error.message }, { status: 500 });
  }

  const finalPath = uploadedPath ?? filename;
  const publicUrl = getPublicUrl(supabase, 'recipe-videos', finalPath);

  return NextResponse.json({ url: publicUrl, path: finalPath });
}
