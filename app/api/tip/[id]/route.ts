import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
// 2026-10-04 API1-37: tip_steps·tip_tags 행 매핑이 POST 와 2벌 → lib/api/recipeChildRows 단일 출처(동작 그대로)
import { buildTipStepRows, buildTipTagRows } from '@/lib/api/recipeChildRows';
import { firstOfEmbed } from '@/lib/queries/recipeCards';

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

  // getUser 는 요청당 최대 1회 (perf 2026-09-27) — 이전엔 비공개 팁에서 같은 Auth 조회를 두 번 했다.
  let userPromise: ReturnType<typeof supabase.auth.getUser> | null = null;
  const getUserOnce = () => (userPromise ??= supabase.auth.getUser());

  // 비공개/임시저장 팁은 작성자만 접근. RLS 가 차단하지 않더라도 defense-in-depth.
  const isPublic = data.is_public === true && data.is_draft === false;
  if (!isPublic) {
    const { data: { user } } = await getUserOnce();
    if (!user || user.id !== data.author_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  // 조회수 dedup — 쿠키 또는 작성자 본인이면 skip.
  // 같은 세션이 refresh 마다 +1 누적되던 회귀 차단.
  const viewedCookie = `tip_v_${id}`;
  const cookies = request.headers.get('cookie') || '';
  const alreadyViewed = cookies.split(';').some(c => c.trim().startsWith(`${viewedCookie}=`));
  // 이미 본 팁이면 증가 여부가 작성자 여부와 무관하게 false → 사용자 조회 생략.
  const isOwnTip = alreadyViewed ? false : (await getUserOnce()).data.user?.id === data.author_id;
  const shouldIncrement = !alreadyViewed && !isOwnTip;

  if (shouldIncrement) {
    // 조회수 증가 — 비치명적(논블로킹). 실패해도 응답은 진행하되 .error 는 로깅.
    // 2026-10-04 API1-05: tip UPDATE RLS 는 작성자만("Author update tip") — 증가 주체(비로그인·타인)의
    // user-context UPDATE 는 0행·error 없음으로 무시돼 조회수가 영구 고정이었다.
    // service-role 은 이 증가 UPDATE 한 곳에만 쓰고, 공개 팁(is_public·!is_draft) id 로 한정한다
    // (shouldIncrement 는 공개 팁에서만 true — 비공개 팁은 위에서 작성자만 통과하고 작성자는 증가 제외).
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('tip views_count update skipped: SUPABASE_SERVICE_ROLE_KEY not set');
    } else {
      const { error: viewError } = await createAdminClient()
        .from('tip')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id)
        .eq('is_public', true)
        .eq('is_draft', false);
      if (viewError) console.error('tip views_count update failed:', viewError);
    }
  }

  const result = {
    ...data,
    steps: (data.steps as { step_number: number }[]).sort((a, b) => a.step_number - b.step_number),
    tags: (data.tags as { tag: string }[]).map((t) => t.tag),
    author: firstOfEmbed(data.author), // 2026-10-04 API1-39: 같은 식 4벌 → lib/queries/recipeCards
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

  const { error: updateError, count: updatedCount } = await supabase
    .from('tip')
    .update(updateFields, { count: 'exact' })
    .eq('id', id)
    .eq('author_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  // 2026-10-04 API1-26: UPDATE 의 필터/RLS 불일치는 error 가 아니라 0행 — 남의 팁·없는 팁도 200 success 였다
  // (steps/tags 를 안 보내면). 0행이면 자식 교체 전에 404 로 표면화. 본인 팁(1행)은 그대로 진행.
  if (updatedCount === 0) {
    return NextResponse.json({ error: '팁을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 단계 교체 — Supabase는 RLS/제약 거부 시 throw 안 하고 { error } 반환.
  // 자식 행(steps/tags) 침묵 유실 방지 위해 delete/insert 모두 .error 체크.
  if (Array.isArray(steps)) {
    const { error: delStepsError } = await supabase.from('tip_steps').delete().eq('tip_id', id);
    if (delStepsError) return NextResponse.json({ error: delStepsError.message }, { status: 500 });
    if (steps.length > 0) {
      const stepsToInsert = buildTipStepRows(id, steps);
      const { error: insStepsError } = await supabase.from('tip_steps').insert(stepsToInsert);
      if (insStepsError) return NextResponse.json({ error: insStepsError.message }, { status: 500 });
    }
  }

  // 태그 교체
  if (Array.isArray(tags)) {
    const { error: delTagsError } = await supabase.from('tip_tags').delete().eq('tip_id', id);
    if (delTagsError) return NextResponse.json({ error: delTagsError.message }, { status: 500 });
    if (tags.length > 0) {
      const tagsToInsert = buildTipTagRows(id, tags);
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

  const { error, count } = await supabase
    .from('tip')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('author_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 2026-10-04 API1-26: 0행 삭제(남의 팁·없는 팁)도 200 success 라 클라가 낙관 제거 후 새로고침하면 되살아났다
  // → 404. 본인 팁 삭제(1행)는 그대로 200 { success: true }.
  if (count === 0) return NextResponse.json({ error: '팁을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
