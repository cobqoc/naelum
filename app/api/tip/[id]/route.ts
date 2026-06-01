import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// GET /api/tip/[id]
//
// 권한:
//  - is_public=true AND is_draft=false → 누구나 GET 가능
//  - 그 외 (비공개/임시저장) → 작성자 본인만 GET 가능 (다른 유저·비로그인 → 404)
//
// 조회수 dedup:
//  - 쿠키 `tip_v_{id}` 1시간 TTL 기반 — 같은 세션 refresh 시 increment skip
//  - 작성자 본인 view 는 항상 skip (자기 팁 조회수 inflation 방지)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('tip')
    .select(`
      *,
      author:profiles!tip_author_id_fkey(username, avatar_url),
      steps:tip_steps(id, step_number, instruction, tip, image_url),
      tags:tip_tags(tag)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 비공개/임시저장 팁은 작성자만 접근. RLS 가 차단하지 않더라도 defense-in-depth.
  const isPublic = data.is_public === true && data.is_draft === false;
  if (!isPublic) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== data.author_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  // 조회수 dedup — 쿠키 또는 작성자 본인이면 skip.
  // 같은 세션이 refresh 마다 +1 누적되던 회귀 차단.
  const viewedCookie = `tip_v_${id}`;
  const cookies = request.headers.get('cookie') || '';
  const alreadyViewed = cookies.split(';').some(c => c.trim().startsWith(`${viewedCookie}=`));
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isOwnTip = currentUser?.id === data.author_id;
  const shouldIncrement = !alreadyViewed && !isOwnTip;

  if (shouldIncrement) {
    // 조회수 증가 — 비치명적(논블로킹). 실패해도 응답은 진행하되 .error 는 로깅.
    const { error: viewError } = await supabase
      .from('tip').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id);
    if (viewError) console.error('tip views_count update failed:', viewError);
  }

  const result = {
    ...data,
    steps: (data.steps as { step_number: number }[]).sort((a, b) => a.step_number - b.step_number),
    tags: (data.tags as { tag: string }[]).map((t) => t.tag),
    author: Array.isArray(data.author) ? data.author[0] : data.author,
  };

  const response = NextResponse.json({ tip: result });
  if (shouldIncrement) {
    // 1시간 TTL — 같은 세션이 다시 와도 +1 안 됨. Path-scoped 라 다른 팁 영향 0.
    response.cookies.set(viewedCookie, '1', {
      maxAge: 60 * 60,
      path: `/api/tip/${id}`,
      httpOnly: true,
      sameSite: 'lax',
    });
  }
  return response;
}

// PUT /api/tip/[id] - 팁 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { id } = await params;
  const { title, description, category, duration_minutes, thumbnail_url, is_public, is_draft, steps, tags } =
    await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: '제목은 200자 이내로 입력해주세요.' }, { status: 400 });
  }
  if (description && description.length > 500) {
    return NextResponse.json({ error: '설명은 500자 이내로 입력해주세요.' }, { status: 400 });
  }

  // is_draft 는 명시 전송 시에만 갱신 — draft 팁을 편집으로 발행(is_draft=false)할 수 있게(H16).
  const updateFields: Record<string, unknown> = {
    title,
    description,
    category: category || null,
    duration_minutes,
    thumbnail_url,
    is_public: is_public !== false,
    updated_at: new Date().toISOString(),
  };
  if (typeof is_draft === 'boolean') updateFields.is_draft = is_draft;

  const { error: updateError } = await supabase
    .from('tip')
    .update(updateFields)
    .eq('id', id)
    .eq('author_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 단계 교체 — Supabase는 RLS/제약 거부 시 throw 안 하고 { error } 반환.
  // 자식 행(steps/tags) 침묵 유실 방지 위해 delete/insert 모두 .error 체크.
  if (Array.isArray(steps)) {
    const { error: delStepsError } = await supabase.from('tip_steps').delete().eq('tip_id', id);
    if (delStepsError) return NextResponse.json({ error: delStepsError.message }, { status: 500 });
    if (steps.length > 0) {
      const stepsToInsert = steps.map(
        (s: { instruction: string; tip?: string; image_url?: string }, idx: number) => ({
          tip_id: id,
          step_number: idx + 1,
          instruction: s.instruction,
          tip: s.tip || null,
          image_url: s.image_url || null,
        })
      );
      const { error: insStepsError } = await supabase.from('tip_steps').insert(stepsToInsert);
      if (insStepsError) return NextResponse.json({ error: insStepsError.message }, { status: 500 });
    }
  }

  // 태그 교체
  if (Array.isArray(tags)) {
    const { error: delTagsError } = await supabase.from('tip_tags').delete().eq('tip_id', id);
    if (delTagsError) return NextResponse.json({ error: delTagsError.message }, { status: 500 });
    if (tags.length > 0) {
      const tagsToInsert = tags.map((tag: string) => ({ tip_id: id, tag }));
      const { error: insTagsError } = await supabase.from('tip_tags').insert(tagsToInsert);
      if (insTagsError) return NextResponse.json({ error: insTagsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/tip/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { id } = await params;

  const { error } = await supabase
    .from('tip')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
