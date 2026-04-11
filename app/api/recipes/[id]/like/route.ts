import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';

// POST /api/recipes/[id]/like - 레시피 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params;
  const supabase = await createClient();

  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`like:${user.id}`, { windowMs: 60 * 1000, maxRequests: 30 });
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  try {
    const { data, error } = await supabase.rpc('toggle_recipe_like', {
      p_recipe_id: recipeId,
      p_user_id: user.id
    });

    if (error) {
      console.error('레시피 좋아요 오류:', error);
      if (error.code === 'P0001') {
        return NextResponse.json({ error: '레시피를 찾을 수 없습니다' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('레시피 좋아요 오류:', error);
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
