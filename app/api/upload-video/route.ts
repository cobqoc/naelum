import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { parseUploadForm, uploadAndRespond } from '@/lib/storage/uploadRoute';

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

  // 2026-10-04 AG2-33: 본문 파싱·파일 유무(400 문구)와 업로드·응답은 upload 와 같은 골격 → lib/storage/uploadRoute.
  const parsed = await parseUploadForm(request);
  if (parsed.response) return parsed.response;
  const { file } = parsed;

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
    // 2026-10-04 AG2-11: 8바이트 미만이면 new Uint8Array(bytes, 4, 4) 가 RangeError → 500 이었다 → 불일치(400).
    const header = bytes.byteLength >= 8 ? new Uint8Array(bytes, 4, 4) : null;
    const ftyp = [0x66, 0x74, 0x79, 0x70]; // "ftyp"
    if (!header || !ftyp.every((b, i) => header[i] === b)) {
      return NextResponse.json({ error: '파일 내용이 선언된 형식과 일치하지 않습니다.' }, { status: 400 });
    }
  }

  const ext = file.type === 'video/quicktime' ? 'mov' : file.type === 'video/webm' ? 'webm' : 'mp4';
  const filename = `${user!.id}/${Date.now()}.${ext}`;

  return uploadAndRespond(supabase, 'recipe-videos', filename, bytes, file.type);
}
