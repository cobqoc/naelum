import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// POST /api/ingredients/check-expiry — 호환용 no-op (2026-10-19 감사 결정 목록 AG2-21).
//
// 유통기한 임박 알림은 매일 cron(app/api/push/send-expiry)이 앱 내 알림 + 푸시로 만든다. 이 라우트는 같은 알림의
// 사본이었는데 사용자 컨텍스트 insert 라 notifications RLS 에 막혀 항상 실패했고, 링크도 없는 경로(/ingredients)였다.
// KMP 앱(FridgeViewModel)이 냉장고를 열 때마다 호출하므로 라우트는 남기고 응답 계약({ created })만 유지한다.
export async function POST() {
  const supabase = await createClient();
  const { error: authError } = await requireAuth(supabase);
  if (authError) return authError;
  return NextResponse.json({ created: 0 });
}
