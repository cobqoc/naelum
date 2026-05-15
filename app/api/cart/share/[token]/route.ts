import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: 비로그인 가능. 토큰 검증 후 cart items + owner 닉네임 반환.
// RLS 우회를 위해 service role 사용 — 토큰 검증으로 권한 게이트.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 8 || token.length > 32) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 토큰 lookup — revoked·expired는 모두 404로 묶음 (정보 노출 최소화)
  const { data: share } = await supabase
    .from('shopping_list_shares')
    .select('owner_user_id, revoked_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!share || share.revoked_at) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (share.expires_at && new Date(share.expires_at) <= new Date()) {
    return NextResponse.json({ error: 'expired' }, { status: 404 });
  }

  const ownerId = share.owner_user_id;

  // owner 닉네임 + cart items 병렬 조회
  const [profileRes, itemsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', ownerId)
      .maybeSingle(),
    supabase
      .from('shopping_list_items')
      .select('id, ingredient_name, category, quantity, unit, recipe_id, recipe_title, is_checked, is_owned, note')
      .eq('user_id', ownerId)
      .order('is_checked', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const ownerName =
    profileRes.data?.full_name ||
    profileRes.data?.username ||
    '낼름 사용자';

  // last_viewed_at 기록 (fire-and-forget — 실패해도 응답엔 영향 없음).
  // view_count 증분은 별도 RPC 필요해서 1단계에선 생략, 필요해지면 추가.
  void supabase
    .from('shopping_list_shares')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('token', token);

  return NextResponse.json({
    ownerName,
    items: itemsRes.data ?? [],
  });
}
