import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { createSignedUpload, getPublicUrl } from '@/lib/storage';
import { checkVideoMeta } from '@/lib/storage/videoUpload';

// POST /api/upload-video/sign — 레시피 영상 직접 업로드용 서명 URL 발급 (2026-10-20 AG2-10)
// body: { contentType, size } → { signedUrl, token, path, url }
// 클라이언트는 signedUrl 로 파일 본문을 PUT(Content-Type 동일)한 뒤 url 을 레시피에 저장한다.
// multipart POST /api/upload-video 는 Vercel 본문 한도(4.5MB) 때문에 작은 영상만 가능 — KMP 앱 호환으로 유지.
// 서버가 파일 바이트를 보지 않으므로 MP4 매직 바이트 검사는 여기선 없다. 형식·크기는 버킷 설정이 강제한다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // 같은 키 — multipart 경로와 한도 공유
  const { allowed } = await checkRateLimit(`upload-video:${user!.id}`, { windowMs: 60 * 1000, maxRequests: 3 });
  if (!allowed) {
    return NextResponse.json({ error: '영상 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  let body: { contentType?: unknown; size?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '요청 형식이 잘못되었습니다.' }, { status: 400 });
  }

  const check = checkVideoMeta(body.contentType, body.size);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const filename = `${user!.id}/${Date.now()}.${check.ext}`;
  const signed = await createSignedUpload(supabase, 'recipe-videos', filename);
  if (signed.error || !signed.signedUrl || !signed.token) {
    return NextResponse.json(
      { error: '업로드 준비 중 오류가 발생했습니다: ' + (signed.error?.message ?? 'unknown') },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    token: signed.token,
    path: signed.path,
    url: getPublicUrl(supabase, 'recipe-videos', signed.path),
  });
}
