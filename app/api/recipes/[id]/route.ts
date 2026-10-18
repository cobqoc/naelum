import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { requireRecipeOwner } from '@/lib/api/ownership';
import { firstOfEmbed } from '@/lib/queries/recipeCards';
import { resolveExactIngredientIds } from '@/lib/ingredients/resolveIngredientId';
import { pickEditableRecipeColumns } from '@/lib/recipes/editableColumns';
// 2026-10-04 API1-37: 자식 행 매핑·normalizeSubstitutesForStorage 가 POST 와 2벌 → lib/api/recipeChildRows 단일 출처(동작 그대로)
import {
  namesWithoutIngredientId, buildRecipeIngredientRows, buildRecipeStepRows, buildRecipeTagRows,
} from '@/lib/api/recipeChildRows';

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
        ingredients:recipe_ingredients(id, ingredient_name, ingredient_id, quantity, unit, notes, is_optional, substitutes, display_order),
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
      author: firstOfEmbed(recipe.author), // 2026-10-04 API1-39: 같은 식 4벌 → lib/queries/recipeCards
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

    // 레시피 소유자 확인 (2026-10-04 API1-36: PUT·DELETE·visibility 3벌 → lib/api/ownership, 404/403 문구 그대로)
    const owner = await requireRecipeOwner(supabase, recipeId, user.id, '레시피를 수정할 권한이 없습니다.');
    if (owner.response) return owner.response;

    const body = await request.json();
    const { title, description, ingredients, steps, tags, ...recipeData } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: '제목은 200자 이내로 입력해주세요.' }, { status: 400 });
    }
    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json({ error: '설명은 500자 이내로 입력해주세요.' }, { status: 400 });
    }

    // 레시피 기본 정보 업데이트
    // mass-assignment 방어(H1): body 통째 스프레드 금지 — 편집 가능 콘텐츠 컬럼만 허용.
    // status·카운터·author_id 등은 화이트리스트에서 제외(visibility 라우트·RPC 전용).
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        title,
        description,
        ...pickEditableRecipeColumns(recipeData),
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
    if (Array.isArray(ingredients)) {
      const { error: delErr } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      if (delErr) {
        return NextResponse.json({ error: `재료 삭제 실패: ${delErr.message}` }, { status: 500 });
      }

      if (ingredients.length > 0) {
        // 클라가 번호 안 준 재료는 *이름 정확일치* 로만 자동 번호 부여 (추측 0). 못 찾으면 null → 어드민 큐.
        const exactIds = await resolveExactIngredientIds(namesWithoutIngredientId(ingredients), supabase);
        const ingredientsToInsert = buildRecipeIngredientRows(recipeId, ingredients, exactIds);

        const { error: insErr } = await supabase.from('recipe_ingredients').insert(ingredientsToInsert);
        if (insErr) {
          return NextResponse.json({ error: `재료 저장 실패: ${insErr.message}` }, { status: 500 });
        }
      }
    }

    // 기존 조리 단계 삭제 후 재추가
    if (Array.isArray(steps)) {
      const { error: delErr } = await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);
      if (delErr) {
        return NextResponse.json({ error: `조리 단계 삭제 실패: ${delErr.message}` }, { status: 500 });
      }

      if (steps.length > 0) {
        const stepsToInsert = buildRecipeStepRows(recipeId, steps);

        const { error: insErr } = await supabase.from('recipe_steps').insert(stepsToInsert);
        if (insErr) {
          return NextResponse.json({ error: `조리 단계 저장 실패: ${insErr.message}` }, { status: 500 });
        }
      }
    }

    // 기존 태그 삭제 후 재추가 (빈 배열도 처리 — 태그 전체 제거 허용)
    if (Array.isArray(tags)) {
      const { error: delErr } = await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId);
      if (delErr) {
        return NextResponse.json({ error: `태그 삭제 실패: ${delErr.message}` }, { status: 500 });
      }

      if (tags.length > 0) {
        const tagsToInsert = buildRecipeTagRows(recipeId, tags);

        const { error: insErr } = await supabase.from('recipe_tags').insert(tagsToInsert);
        if (insErr) {
          return NextResponse.json({ error: `태그 저장 실패: ${insErr.message}` }, { status: 500 });
        }
      }
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

    // 레시피 소유자 확인 (2026-10-04 API1-36: lib/api/ownership, 404/403 문구 그대로)
    const owner = await requireRecipeOwner(supabase, recipeId, user.id, '레시피를 삭제할 권한이 없습니다.');
    if (owner.response) return owner.response;

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
