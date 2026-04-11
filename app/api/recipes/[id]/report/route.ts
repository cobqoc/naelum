import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';

const VALID_REASONS = ['spam', 'inappropriate', 'copyright', 'false_info', 'other'];

// POST /api/recipes/[id]/report - 레시피 신고
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

  const { id: recipeId } = await params;

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

  // 레시피 존재 확인
  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, author_id')
    .eq('id', recipeId)
    .single();

  if (!recipe) {
    return NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 자기 레시피 신고 방지
  if (recipe.author_id === user.id) {
    return NextResponse.json({ error: '자신의 레시피는 신고할 수 없습니다.' }, { status: 400 });
  }

  // 중복 신고 확인 (대기 중인 신고만)
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_type', 'recipe')
    .eq('reported_id', recipeId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: '이미 신고가 접수된 레시피입니다.' }, { status: 409 });
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_type: 'recipe',
    reported_id: recipeId,
    reason,
    description: description?.trim() || null,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: '신고 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.' });
}
