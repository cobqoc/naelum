import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { parseUploadForm, uploadAndRespond } from '@/lib/storage/uploadRoute';
import { checkVideoMeta } from '@/lib/storage/videoUpload';

// POST /api/upload-video — 레시피 영상 업로드 (Supabase Storage recipe-videos 버킷)
// KMP 모바일 앱 전용: /api/upload(이미지 전용)와 분리.
// ⚠️ 본문이 Vercel 함수 한도(4.5MB)를 넘으면 이 라우트에 도달하지 못한다 — 큰 영상은 /api/upload-video/sign(직접 업로드).
// anonKey 보안 채무 해소 — 서버가 requireAuth(쿠키)로 사용자 검증 후 service-role 업로드.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`upload-video:${user!.id}`, { windowMs: 60 * 1000, maxRequests: 3 });
  if (!allowed) {
    return NextResponse.json({ error: '영상 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  // 2026-10-04 AG2-33: 본문 파싱·파일 유무(400 문구)와 업로드·응답은 upload 와 같은 골격 → lib/storage/uploadRoute.
  const parsed = await parseUploadForm(request);
  if (parsed.response) return parsed.response;
  const { file } = parsed;

  // 형식·크기 규칙은 sign 경로와 공용(lib/storage/videoUpload, 2026-10-20 AG2-10 — 한도 100MB → 50MB)
  const check = checkVideoMeta(file.type, file.size);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();

  // MP4 매직 바이트 검증 (ftyp box — offset 4)
  if (file.type === 'video/mp4') {
    // 2026-10-04 AG2-11: 8바이트 미만이면 new Uint8Array(bytes, 4, 4) 가 RangeError → 500 이었다 → 불일치(400).
    const header = bytes.byteLength >= 8 ? new Uint8Array(bytes, 4, 4) : null;
    const ftyp = [0x66, 0x74, 0x79, 0x70]; // "ftyp"
    if (!header || !ftyp.every((b, i) => header[i] === b)) {
      return NextResponse.json({ error: '파일 내용이 선언된 형식과 일치하지 않습니다.' }, { status: 400 });
    }
  }

  const filename = `${user!.id}/${Date.now()}.${check.ext}`;

  return uploadAndRespond(supabase, 'recipe-videos', filename, bytes, file.type);
}
