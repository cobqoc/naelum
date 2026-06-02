import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// URL-safe base62. 12자 = ~71 bits → 충돌 거의 없음.
const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateToken(): string {
  const bytes = randomBytes(12);
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length];
  }
  return token;
}

// POST: 현재 활성 토큰 반환 또는 신규 생성.
// 사용자당 활성 토큰 1개만 — 매번 새로 만들지 않고 기존 거 재사용.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 활성 토큰 있는지 먼저 확인
  const { data: existing } = await supabase
    .from('shopping_list_shares')
    .select('token, expires_at')
    .eq('owner_user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle();

  if (existing) {
    // expires_at 만료 검사 (DB partial index에서 못 거른 부분 — NOW() not IMMUTABLE)
    if (!existing.expires_at || new Date(existing.expires_at) > new Date()) {
      return NextResponse.json({ token: existing.token });
    }
    // 만료된 거면 revoke 처리하고 새로 생성. revoke 실패해도 토큰은 이미 만료라 새 토큰 발급이 본질 — 로그만.
    const { error: revokeErr } = await supabase
      .from('shopping_list_shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token', existing.token);
    if (revokeErr) console.warn('[cart/share] 만료 토큰 revoke 실패:', revokeErr.message);
  }

  // 새 토큰 생성. 충돌 시 1회 재시도.
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = generateToken();
    const { error } = await supabase
      .from('shopping_list_shares')
      .insert({ token, owner_user_id: user.id });
    if (!error) {
      return NextResponse.json({ token });
    }
    // unique violation이 아니면 즉시 실패
    if (!error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: '토큰 생성 실패' }, { status: 500 });
}

// DELETE: 현재 활성 토큰 revoke.
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('shopping_list_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('owner_user_id', user.id)
    .is('revoked_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
