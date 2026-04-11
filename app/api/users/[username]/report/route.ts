import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';

const VALID_REASONS = ['spam', 'harassment', 'inappropriate', 'impersonation', 'other'];

// POST /api/users/[username]/report - 사용자 신고
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`user-report:${user.id}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 });
  if (!allowed) {
    return NextResponse.json({ error: '신고 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 });
  }

  const { username } = await params;

  let body: { reason?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { reason, description } = body;

  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: '유효한 신고 사유를 선택해주세요.' }, { status: 400 });
  }

  // 신고 대상 사용자 조회
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 자기 자신 신고 방지
  if (targetUser.id === user.id) {
    return NextResponse.json({ error: '자기 자신을 신고할 수 없습니다.' }, { status: 400 });
  }

  // 중복 신고 확인
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_type', 'user')
    .eq('reported_id', targetUser.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: '이미 신고가 접수된 사용자입니다.' }, { status: 409 });
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_type: 'user',
    reported_id: targetUser.id,
    reason,
    description: description?.trim() || null,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: '신고 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '신고가 접수되었습니다.' });
}
