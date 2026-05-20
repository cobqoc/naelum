import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';

const VALID_REASONS = ['spam', 'inappropriate', 'copyright', 'false_info', 'other'];

/**
 * POST /api/tip/[id]/report — 요리 팁 신고
 * 레시피 신고와 동일 패턴 (`reports` 테이블, `reported_type = 'tip'`).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`report:${user.id}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 });
  if (!allowed) {
    return NextResponse.json({ error: '신고 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 });
  }

  const { id: tipId } = await params;

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

  // 팁 존재 + 자기 팁 방지
  const { data: tip } = await supabase
    .from('tip')
    .select('id, author_id')
    .eq('id', tipId)
    .single();

  if (!tip) {
    return NextResponse.json({ error: '팁을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (tip.author_id === user.id) {
    return NextResponse.json({ error: '자신의 팁은 신고할 수 없습니다.' }, { status: 400 });
  }

  // 중복 신고 방지 (대기 중인 신고)
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_type', 'tip')
    .eq('reported_id', tipId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: '이미 신고가 접수된 팁입니다.' }, { status: 409 });
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_type: 'tip',
    reported_id: tipId,
    reason,
    description: description?.trim() || null,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: '신고 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.' });
}
