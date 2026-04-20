import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

// GET /api/recipes/[id] - 레시피 상세 조회
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: recipeId } = await context.params;

    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        author:profiles!recipes_author_id_fkey(id, username, avatar_url, bio),
        ingredients:recipe_ingredients(id, ingredient_name, quantity, unit, notes, is_optional, display_order),
        steps:recipe_steps(id, step_number, title, instruction, timer_minutes, tip, image_url),
        tags:recipe_tags(id, tag_name)
      `)
      .eq('id', recipeId)
      .single();

    if (error || !recipe) {
      return NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 });
    }

    const result = {
      ...recipe,
      ingredients: (recipe.ingredients as { display_order: number }[]).sort(
        (a, b) => a.display_order - b.display_order
      ),
      steps: (recipe.steps as { step_number: number }[]).sort(
        (a, b) => a.step_number - b.step_number
      ),
      tags: (recipe.tags as { tag_name: string }[]).map((t) => t.tag_name),
      author: Array.isArray(recipe.author) ? recipe.author[0] : recipe.author,
    };

    return NextResponse.json({ recipe: result });
  } catch (error) {
    console.error('Error in GET recipe API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: recipeId } = await context.params;

    const { user, error: authError } = await requireAuth(supabase);
    if (authError) return authError;

    // 레시피 소유자 확인
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', recipeId)
      .single();

    if (fetchError || !recipe) {
      return NextResponse.json(
        { error: '레시피를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (recipe.author_id !== user.id) {
      return NextResponse.json(
        { error: '레시피를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, ingredients, steps, tags, ...recipeData } = body;

    // 레시피 기본 정보 업데이트
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        title,
        description,
        ...recipeData,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: '레시피 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 기존 재료 삭제 후 재추가
    if (ingredients && ingredients.length > 0) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);

      const ingredientsToInsert = ingredients.map((ing: { ingredient_name: string; quantity: string; unit: string; notes: string; is_optional?: boolean }, index: number) => ({
        recipe_id: recipeId,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
        is_optional: ing.is_optional || false,
        display_order: index + 1
      }));

      await supabase.from('recipe_ingredients').insert(ingredientsToInsert);
    }

    // 기존 조리 단계 삭제 후 재추가
    if (steps && steps.length > 0) {
      await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);

      const stepsToInsert = steps.map((step: { title: string; instruction: string; timer_minutes?: number; tip?: string; image_url?: string }, index: number) => ({
        recipe_id: recipeId,
        step_number: index + 1,
        title: step.title,
        instruction: step.instruction,
        timer_minutes: step.timer_minutes,
        tip: step.tip,
        image_url: step.image_url
      }));

      await supabase.from('recipe_steps').insert(stepsToInsert);
    }

    // 기존 태그 삭제 후 재추가
    if (tags && tags.length > 0) {
      await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId);

      const tagsToInsert = tags.map((tag: string) => ({
        recipe_id: recipeId,
        tag_name: tag
      }));

      await supabase.from('recipe_tags').insert(tagsToInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update recipe API:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: recipeId } = await context.params;

    // 사용자 인증 확인
    const { user, error: authError } = await requireAuth(supabase);
    if (authError) return authError;

    // 레시피 소유자 확인
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('author_id')
      .eq('id', recipeId)
      .single();

    if (fetchError || !recipe) {
      return NextResponse.json(
        { error: '레시피를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (recipe.author_id !== user.id) {
      return NextResponse.json(
        { error: '레시피를 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 레시피 삭제 (관련 데이터는 CASCADE로 자동 삭제)
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: '레시피 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete recipe API:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
