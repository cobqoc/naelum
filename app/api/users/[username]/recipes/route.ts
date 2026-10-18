import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import { firstPerKey } from '@/lib/queries/firstPerKey'
import { fetchCookedRecipeIds } from '@/lib/queries/recipeCards'

// GET /api/users/[username]/recipes - 사용자 레시피 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
  const { username } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 12 })
  const type = searchParams.get('type') || 'created' // created, saved, liked, cooked

  // 사용자 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, show_saved_to_public, show_cooked_to_public')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  // 현재 로그인 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  // drafts, private, liked는 항상 본인만 접근 가능
  if ((type === 'drafts' || type === 'private' || type === 'liked') && !isOwnProfile) {
    return NextResponse.json({
      recipes: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    })
  }

  // saved: 본인이 아니면 프라이버시 설정 확인
  if (type === 'saved' && !isOwnProfile && !profile.show_saved_to_public) {
    return NextResponse.json({
      recipes: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    })
  }

  // cooked: 본인이 아니면 프라이버시 설정 확인
  if (type === 'cooked' && !isOwnProfile && !profile.show_cooked_to_public) {
    return NextResponse.json({
      recipes: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recipes: any[] = []
  let count = 0

  switch (type) {
    case 'created': {
      const query = supabase
        .from('recipes')
        .select(`
          id, title, description, thumbnail_url, display_image,
          prep_time_minutes, cook_time_minutes, difficulty_level,
          average_rating, views_count, created_at, status
        `, { count: 'exact' })
        .eq('author_id', profile.id)
        // 레시피(created) 탭은 공개 레시피만 — 본인이 봐도 동일. 비공개는
        // '비공개' 탭에만 노출되어 통계 블록의 '레시피' 수와 일치한다.
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      const result = await query

      recipes = result.data || []
      count = result.count || 0
      break
    }

    case 'saved': {
      const result = await supabase
        .from('recipe_saves')
        .select(`
          created_at,
          notes,
          recipe:recipes(
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, views_count,
            author:profiles!recipes_author_id_fkey(username, avatar_url)
          )
        `, { count: 'exact' })
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      // 2026-10-04 API1-10: RLS 로 가려진(비공개 전환된) 레시피는 recipe=null 임베드 → id 없는 항목 제외(정상 항목 동일)
      recipes = result.data?.filter(s => s.recipe != null).map(s => ({ ...s.recipe, save_notes: s.notes })) || []
      count = result.count || 0
      break
    }

    case 'liked': {
      const result = await supabase
        .from('recipe_likes')
        .select(`
          created_at,
          recipe:recipes(
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, views_count,
            author:profiles!recipes_author_id_fkey(username, avatar_url)
          )
        `, { count: 'exact' })
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      // 2026-10-04 API1-10: 가려진 레시피의 null 원소 제외 — 아래 has_cooked 의 r.id 접근 TypeError(500)도 방지
      recipes = result.data?.filter(l => l.recipe != null).map(l => l.recipe) || []
      count = result.count || 0
      break
    }

    case 'cooked': {
      // cooking_sessions와 recipe_ratings를 LEFT JOIN
      // 2026-10-04 API1-42: cooking_sessions 는 (user, recipe) UNIQUE 가 없어 같은 레시피를 여러 번 완성하면 세션
      // *행* 마다 카드가 중복(React key 중복)되고 total 도 세션 수였다 → 완료 세션을 전부 받아(사용자당 소수,
      // fetchAllRows 로 1000행 cap 회피) completed_at 내림차순 그대로 레시피별 *가장 최근* 1건만 남긴 뒤 페이지를
      // 자른다. 순서 규칙(최근 완성순)·카드 필드는 동일. RLS 로 가려진 레시피(null 임베드)는 여기서 빠져 count 와도 일치.
      // 읽기 실패 시 이전처럼 빈 목록(200) — 단 로그로 표면화.
      type CookedRecipeEmbed = { id: string } & Record<string, unknown>
      type CookedSessionRow = {
        completed_at: string
        photo_url: string | null
        recipe: CookedRecipeEmbed | CookedRecipeEmbed[] | null
      }
      const embedOf = (s: CookedSessionRow) => (Array.isArray(s.recipe) ? s.recipe[0] : s.recipe)
      let allSessions: CookedSessionRow[] = []
      try {
        allSessions = await fetchAllRows<CookedSessionRow>(() => supabase
          .from('cooking_sessions')
          .select(`
          completed_at,
          photo_url,
          recipe:recipes(
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, views_count,
            author:profiles!recipes_author_id_fkey(username, avatar_url)
          )
        `)
          .eq('user_id', profile.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false }))
      } catch (e) {
        console.error('[recipes] cooked sessions read failed:', e)
      }
      const latestPerRecipe = firstPerKey(allSessions, s => embedOf(s)?.id)
      const sessions = latestPerRecipe.slice(offset, rangeEnd + 1)
      const sessionsCount = latestPerRecipe.length

      // 각 레시피에 대한 리뷰 조회
      if (sessions && sessions.length > 0) {
        const recipeIds = sessions.map(s => {
          const recipe = Array.isArray(s.recipe) ? s.recipe[0] : s.recipe;
          return recipe?.id;
        }).filter(Boolean)

        // 리뷰는 통합 피드(recipe_posts)의 rating 있는 글에서 조회 (review = content)
        const { data: ratings } = await supabase
          .from('recipe_posts')
          .select('recipe_id, rating, content')
          .eq('user_id', profile.id)
          .not('rating', 'is', null)
          .is('parent_id', null)
          .eq('is_deleted', false)
          .in('recipe_id', recipeIds)

        // 리뷰 데이터를 맵으로 변환
        const ratingsMap = new Map(
          ratings?.map(r => [r.recipe_id, { rating: r.rating, review: r.content }]) || []
        )

        // completed_at, photo_url, 리뷰 정보를 recipe 객체에 포함
        recipes = sessions.map(s => {
          const recipe = Array.isArray(s.recipe) ? s.recipe[0] : s.recipe;
          return {
            ...recipe,
            completed_at: s.completed_at,
            completion_photo_url: s.photo_url,
            user_rating: ratingsMap.get(recipe?.id)?.rating,
            user_review: ratingsMap.get(recipe?.id)?.review
          };
        })
        // (2026-10-04 API1-10 의 null 임베드 제외는 위 firstPerKey 가 페이지 자르기 전에 처리 — API1-42)
      } else {
        recipes = []
      }

      count = sessionsCount || 0
      break
    }

    case 'drafts': {
      const result = await supabase
        .from('recipes')
        .select(`
          id, title, description, thumbnail_url, display_image,
          prep_time_minutes, cook_time_minutes, difficulty_level,
          average_rating, views_count, created_at, status
        `, { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      recipes = result.data || []
      count = result.count || 0
      break
    }

    case 'private': {
      const result = await supabase
        .from('recipes')
        .select(`
          id, title, description, thumbnail_url, display_image,
          prep_time_minutes, cook_time_minutes, difficulty_level,
          average_rating, views_count, created_at, status
        `, { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('status', 'private')
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      recipes = result.data || []
      count = result.count || 0
      break
    }

    default:
      return NextResponse.json({ error: '잘못된 타입입니다' }, { status: 400 })
  }

  // 로그인한 사용자가 있고, cooked 탭이 아닌 경우 has_cooked 정보 추가
  if (user && recipes && recipes.length > 0 && type !== 'cooked') {
    const recipeIds = recipes.map((r: Record<string, unknown>) => r.id).filter(Boolean)

    if (recipeIds.length > 0) {
      // (2026-10-04 API1-39: 같은 쿼리 4벌 → lib/queries/recipeCards.fetchCookedRecipeIds — 오류 시 빈 집합 동일)
      const cookedRecipeIds = await fetchCookedRecipeIds(supabase, user.id, recipeIds as string[])

      recipes = recipes.map((r: Record<string, unknown>) => ({
        ...r,
        has_cooked: cookedRecipeIds.has(r.id as string)
      }))
    }
  }

  return NextResponse.json({
    recipes: recipes || [],
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  })
  } catch (error) {
    console.error('[recipes] GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
