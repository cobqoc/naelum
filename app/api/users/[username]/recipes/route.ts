import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'

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
      let query = supabase
        .from('recipes')
        .select(`
          id, title, description, thumbnail_url, display_image,
          prep_time_minutes, cook_time_minutes, difficulty_level,
          average_rating, views_count, created_at, is_public
        `, { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      // 본인 프로필이 아닌 경우 공개된 레시피만 보이기
      if (!isOwnProfile) {
        query = query.eq('is_public', true)
      }

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
            author:profiles(username, avatar_url)
          )
        `, { count: 'exact' })
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      recipes = result.data?.map(s => ({ ...s.recipe, save_notes: s.notes })) || []
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
            author:profiles(username, avatar_url)
          )
        `, { count: 'exact' })
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, rangeEnd)

      recipes = result.data?.map(l => l.recipe) || []
      count = result.count || 0
      break
    }

    case 'cooked': {
      // cooking_sessions와 recipe_ratings를 LEFT JOIN
      const { data: sessions, count: sessionsCount } = await supabase
        .from('cooking_sessions')
        .select(`
          completed_at,
          photo_url,
          recipe:recipes(
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, views_count,
            author:profiles(username, avatar_url)
          )
        `, { count: 'exact' })
        .eq('user_id', profile.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .range(offset, rangeEnd)

      // 각 레시피에 대한 리뷰 조회
      if (sessions && sessions.length > 0) {
        const recipeIds = sessions.map(s => {
          const recipe = Array.isArray(s.recipe) ? s.recipe[0] : s.recipe;
          return recipe?.id;
        }).filter(Boolean)

        const { data: ratings } = await supabase
          .from('recipe_ratings')
          .select('recipe_id, rating, review')
          .eq('user_id', profile.id)
          .in('recipe_id', recipeIds)

        // 리뷰 데이터를 맵으로 변환
        const ratingsMap = new Map(
          ratings?.map(r => [r.recipe_id, { rating: r.rating, review: r.review }]) || []
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
          average_rating, views_count, created_at, is_public
        `, { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('is_published', false)
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
          average_rating, views_count, created_at, is_public
        `, { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('is_published', true)
        .eq('is_public', false)
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
      const { data: cookedSessions } = await supabase
        .from('cooking_sessions')
        .select('recipe_id')
        .eq('user_id', user.id)
        .in('recipe_id', recipeIds)
        .not('completed_at', 'is', null)

      const cookedRecipeIds = new Set(cookedSessions?.map(s => s.recipe_id) || [])

      recipes = recipes.map((r: Record<string, unknown>) => ({
        ...r,
        has_cooked: cookedRecipeIds.has(r.id)
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
