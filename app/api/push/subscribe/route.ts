import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

/** 문자열이 https URL 인지 — 브라우저 PushSubscription.endpoint 는 항상 https(FCM·Mozilla·Apple·WNS). */
function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// POST /api/push/subscribe — 구독 저장
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // 2026-10-04 AG2-42/AG2-49: 형식 오류 JSON·null 본문은 500 이었다 → 400. endpoint 가 https URL 이 아니면 저장하지
  // 않는다(이전엔 임의 문자열·http URL 도 저장돼 크론이 매일 그 주소로 서버발 POST). 브라우저 구독은 항상 https 라
  // 정상 구독은 불변. (푸시 서비스 호스트 허용목록은 브라우저 호환 위험으로 미적용 — 보고서 참고)
  let body: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }
  const { endpoint, keys } = body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }
  if (!isHttpsUrl(endpoint) || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/push/subscribe — 구독 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // 2026-10-04 AG2-49: 형식 오류 JSON 은 500 이었다 → 기존 400 문구.
  let body: { endpoint?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
  }
  const endpoint = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  const { error: delErr } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
