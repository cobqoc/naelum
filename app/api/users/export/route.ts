import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// GET /api/users/export
// GDPR Article 20 (Right to Data Portability) — 본인 데이터 일괄 export.
// 한국 개인정보보호법 제35조 (개인정보 열람권)·제36조 (정정·삭제권)과도 동일.
//
// 인증: 쿠키 (requireAuth) — 본인만 접근 가능.
// 데이터 조회: service-role client + 명시 user.id 필터.
//   ↳ events·ingredient_training_data 등 일부 테이블 RLS가 admin role만 SELECT 허용해
//      일반 user 본인 데이터도 RLS 거부됨. service-role로 우회 후 user.id 필터로 본인 데이터만.
//   ↳ user.id 는 requireAuth로 검증된 UUID — SQL injection 안전.
//
// 응답: JSON 다운로드 (Content-Disposition: attachment).
//
// **제외**: 다른 사용자가 본인을 향해 한 행동 (본인 레시피에 단 그들의 댓글·평점·좋아요,
// 본인을 차단한 사람 목록). 그들의 데이터·프라이버시이므로 본인 export에 포함 안 함.
export async function GET() {
  try {
    const serverClient = await createClient();
    const { user, error: authError } = await requireAuth(serverClient);
    if (authError) return authError;

    const uid = user!.id;
    const sb = createServiceClient();

    // Stage 1: 본인 식별 컬럼 기반 단순 조회 (병렬)
    const [
      profileRes,
      interestsRes, dietaryRes, allergiesRes,
      fridgeRes, favoritesRes, termsRes,
      foldersRes, savesRes, commentsRes, ratingsRes,
      likesRes, viewsRes, notesRes, commentLikesRes,
      sessionsRes, expLogsRes, badgesRes,
      shoppingListsRes, shoppingItemsRes,
      mealPlansRes, notifsRes, searchHistRes,
      recHistRes, inquiriesRes, priceReportsRes,
      trainingDataRes, eventsRes,
      deliveryAddrRes, riderProfileRes,
      recipesRes, tipsRes, restaurantsRes,
      reportsRes, blocksRes, followsRes, ordersRes,
      masterIngsRes, substitutesRes,
    ] = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
      sb.from('user_interests').select('*').eq('user_id', uid),
      sb.from('user_dietary_preferences').select('*').eq('user_id', uid),
      sb.from('user_allergies').select('*').eq('user_id', uid),
      sb.from('user_ingredients').select('*').eq('user_id', uid),
      sb.from('user_favorites_ingredients').select('*').eq('user_id', uid),
      sb.from('user_terms_acceptance').select('*').eq('user_id', uid),
      sb.from('recipe_folders').select('*').eq('user_id', uid),
      sb.from('recipe_saves').select('*').eq('user_id', uid),
      sb.from('recipe_comments').select('*').eq('user_id', uid),
      sb.from('recipe_ratings').select('*').eq('user_id', uid),
      sb.from('recipe_likes').select('*').eq('user_id', uid),
      sb.from('recipe_views').select('*').eq('user_id', uid),
      sb.from('recipe_notes').select('*').eq('user_id', uid),
      sb.from('comment_likes').select('*').eq('user_id', uid),
      sb.from('cooking_sessions').select('*').eq('user_id', uid),
      sb.from('experience_logs').select('*').eq('user_id', uid),
      sb.from('user_badges').select('*').eq('user_id', uid),
      sb.from('shopping_lists').select('*').eq('user_id', uid),
      sb.from('shopping_list_items').select('*').eq('user_id', uid),
      sb.from('meal_plans').select('*').eq('user_id', uid),
      sb.from('notifications').select('*').eq('user_id', uid),
      sb.from('search_history').select('*').eq('user_id', uid),
      sb.from('recommendation_history').select('*').eq('user_id', uid),
      sb.from('contact_inquiries').select('*').eq('user_id', uid),
      sb.from('ingredient_price_reports').select('*').eq('user_id', uid),
      sb.from('ingredient_training_data').select('*').eq('user_id', uid),
      sb.from('events').select('*').eq('user_id', uid),
      sb.from('delivery_addresses').select('*').eq('user_id', uid),
      sb.from('delivery_rider_profiles').select('*').eq('user_id', uid),
      // recipes: soft-delete 시스템 미구현 (20260209 마이그레이션 미적용, deleted_at 컬럼 없음).
      // status 컬럼(private/published) 으로만 관리. 본인 author_id 전체 export.
      sb.from('recipes').select('*').eq('author_id', uid),
      sb.from('tip').select('*').eq('author_id', uid),
      sb.from('delivery_restaurants').select('*').eq('owner_id', uid),
      sb.from('reports').select('*').eq('reporter_id', uid),
      // user_blocks: 본인이 *차단한* 사람만 (blocked_id=본인 = 본인을 차단한 사람은 비공개)
      sb.from('user_blocks').select('*').eq('blocker_id', uid),
      // user_follows: 양방향 (팔로잉·팔로워 모두 본인 사회 그래프)
      sb.from('user_follows').select('*').or(`follower_id.eq.${uid},following_id.eq.${uid}`),
      // delivery_orders: 소비자(user_id)·라이더(rider_id) 양쪽
      sb.from('delivery_orders').select('*').or(`user_id.eq.${uid},rider_id.eq.${uid}`),
      // 어드민 활동 (일반 사용자는 빈 배열)
      sb.from('ingredients_master').select('*').or(`created_by.eq.${uid},approved_by.eq.${uid}`),
      sb.from('ingredient_substitutes_global').select('*').eq('approved_by', uid),
    ]);

    // Stage 2: 자식 테이블 (부모 id 의존). 빈 배열이면 PostgREST .in() 에러라 skip.
    // Promise.all union 추론 한계로 .data 타입이 never 됨 — id 만 뽑으므로 명시 캐스트.
    type WithId = { id: string };
    const recipeIds = ((recipesRes.data as WithId[] | null) ?? []).map(r => r.id);
    const tipIds = ((tipsRes.data as WithId[] | null) ?? []).map(t => t.id);
    const mealPlanIds = ((mealPlansRes.data as WithId[] | null) ?? []).map(p => p.id);
    const orderIds = ((ordersRes.data as WithId[] | null) ?? []).map(o => o.id);

    const emptyData = { data: [] as unknown[] };
    const [recipeIngsRes, recipeStepsRes, recipeTagsRes, tipStepsRes, tipTagsRes, mealPlanItemsRes, orderItemsRes] = await Promise.all([
      recipeIds.length ? sb.from('recipe_ingredients').select('*').in('recipe_id', recipeIds) : emptyData,
      recipeIds.length ? sb.from('recipe_steps').select('*').in('recipe_id', recipeIds) : emptyData,
      recipeIds.length ? sb.from('recipe_tags').select('*').in('recipe_id', recipeIds) : emptyData,
      tipIds.length ? sb.from('tip_steps').select('*').in('tip_id', tipIds) : emptyData,
      tipIds.length ? sb.from('tip_tags').select('*').in('tip_id', tipIds) : emptyData,
      mealPlanIds.length ? sb.from('meal_plan_items').select('*').in('meal_plan_id', mealPlanIds) : emptyData,
      orderIds.length ? sb.from('delivery_order_items').select('*').in('order_id', orderIds) : emptyData,
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: uid,
      format_version: 1,
      notes: 'GDPR Article 20 (Right to Data Portability) export. Includes all data you provided or generated through your activity. Other users\' content (their comments/ratings on your recipes, people who blocked you) is excluded for their privacy.',
      profile: profileRes.data ?? null,
      preferences: {
        interests: interestsRes.data ?? [],
        dietary: dietaryRes.data ?? [],
        allergies: allergiesRes.data ?? [],
      },
      fridge: {
        items: fridgeRes.data ?? [],
        favorites: favoritesRes.data ?? [],
      },
      shopping: {
        lists: shoppingListsRes.data ?? [],
        items: shoppingItemsRes.data ?? [],
      },
      meal_plans: {
        plans: mealPlansRes.data ?? [],
        items: mealPlanItemsRes.data ?? [],
      },
      content: {
        recipes: recipesRes.data ?? [],
        recipe_ingredients: recipeIngsRes.data ?? [],
        recipe_steps: recipeStepsRes.data ?? [],
        recipe_tags: recipeTagsRes.data ?? [],
        recipe_notes: notesRes.data ?? [],
        recipe_folders: foldersRes.data ?? [],
        tips: tipsRes.data ?? [],
        tip_steps: tipStepsRes.data ?? [],
        tip_tags: tipTagsRes.data ?? [],
      },
      activity: {
        recipe_saves: savesRes.data ?? [],
        recipe_likes: likesRes.data ?? [],
        recipe_comments: commentsRes.data ?? [],
        recipe_ratings: ratingsRes.data ?? [],
        comment_likes: commentLikesRes.data ?? [],
        recipe_views: viewsRes.data ?? [],
        cooking_sessions: sessionsRes.data ?? [],
        search_history: searchHistRes.data ?? [],
        recommendation_history: recHistRes.data ?? [],
        experience_logs: expLogsRes.data ?? [],
        badges: badgesRes.data ?? [],
      },
      social: {
        follows: followsRes.data ?? [],
        blocks_made: blocksRes.data ?? [],
      },
      notifications: {
        received: notifsRes.data ?? [],
        terms_acceptance: termsRes.data ?? [],
      },
      support: {
        reports_filed: reportsRes.data ?? [],
        contact_inquiries: inquiriesRes.data ?? [],
      },
      delivery: {
        addresses: deliveryAddrRes.data ?? [],
        orders: ordersRes.data ?? [],
        order_items: orderItemsRes.data ?? [],
        restaurants_owned: restaurantsRes.data ?? [],
        rider_profile: riderProfileRes.data ?? [],
      },
      ingredients_data: {
        price_reports: priceReportsRes.data ?? [],
        training_data: trainingDataRes.data ?? [],
      },
      admin_contributions: {
        ingredients_master: masterIngsRes.data ?? [],
        substitutes_approved: substitutesRes.data ?? [],
      },
      analytics_events: eventsRes.data ?? [],
    };

    const filename = `naelum-data-${new Date().toISOString().slice(0, 10)}.json`;
    const body = JSON.stringify(exportData, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
