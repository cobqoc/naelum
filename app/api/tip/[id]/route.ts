import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// GET /api/tip/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // 조회수 증가 — 비치명적(논블로킹). 실패해도 응답은 진행하되 .error 는 로깅.
  const { error: viewError } = await supabase
    .from('tip').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id);
  if (viewError) console.error('tip views_count update failed:', viewError);

  const result = {
    ...data,
    steps: (data.steps as { step_number: number }[]).sort((a, b) => a.step_number - b.step_number),
    tags: (data.tags as { tag: string }[]).map((t) => t.tag),
    author: Array.isArray(data.author) ? data.author[0] : data.author,
  };

  return NextResponse.json({ tip: result });
}

// PUT /api/tip/[id] - 팁 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { id } = await params;
  const { title, description, category, duration_minutes, thumbnail_url, is_public, steps, tags } =
    await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('tip')
    .update({
      title,
      description,
      category,
      duration_minutes,
      thumbnail_url,
      is_public: is_public !== false,
      updated_at: new Date().toISOString(),
    })
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
