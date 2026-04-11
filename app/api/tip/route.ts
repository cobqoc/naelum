import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// GET /api/tip?limit=20&offset=0&category=손질법&random=true
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const random = searchParams.get('random') === 'true';
  const category = searchParams.get('category');

  let query = supabase
    .from('tip')
    .select(`
      id, title, thumbnail_url, category, duration_minutes, created_at, views_count,
      author:profiles!tip_author_id_fkey(username)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);

  if (random) {
    query = query.limit(50);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let result = data || [];
  if (random && result.length > 0) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    result = result.slice(0, limit);
  }

  return NextResponse.json({ tips: result, hasMore: !random && result.length === limit });
}

// POST /api/tip
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const body = await request.json();
  const { title, description, thumbnail_url, category, duration_minutes, is_public, is_draft, steps, tags } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }
  if (!is_draft && (!steps || steps.length === 0)) {
    return NextResponse.json({ error: '단계를 최소 1개 입력해주세요.' }, { status: 400 });
  }

  const { data: tip, error: tipError } = await supabase
    .from('tip')
    .insert({
      author_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: thumbnail_url || null,
      category: category || '기타',
      duration_minutes: duration_minutes || null,
      is_public: is_draft ? false : (is_public !== false),
      is_draft: is_draft === true,
    })
    .select('id')
    .single();

  if (tipError || !tip) {
    return NextResponse.json({ error: tipError?.message }, { status: 500 });
  }

  // 단계 삽입 (draft이고 steps가 없으면 생략)
  if (steps && steps.length > 0) {
    const stepsToInsert = steps.map((step: { instruction: string; tip?: string; image_url?: string }, idx: number) => ({
      tip_id: tip.id,
      step_number: idx + 1,
      instruction: step.instruction,
      tip: step.tip || null,
      image_url: step.image_url || null,
    }));
    const { error: stepsError } = await supabase.from('tip_steps').insert(stepsToInsert);
    if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 });
  }

  // 태그 삽입
  if (tags && tags.length > 0) {
    const tagsToInsert = tags.map((tag: string) => ({ tip_id: tip.id, tag }));
    await supabase.from('tip_tags').insert(tagsToInsert);
  }

  return NextResponse.json({ tip }, { status: 201 });
}
