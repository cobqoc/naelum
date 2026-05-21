import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { sanitizeHtml } from '@/lib/security/sanitize'

// GET /api/users/[username] - 사용자 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id, username, full_name, avatar_url, bio, recipes_count,
      created_at, show_saved_to_public, show_cooked_to_public
    `)
    .eq('username', username)
    .maybeSingle()

  if (error || !profile) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  // 본인 프로필 여부 (권한 제어용)
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = !!user && user.id === profile.id

  // 최근 레시피 조회
  const recipesQuery = supabase
    .from('recipes')
    .select(`
      id, title, thumbnail_url, average_rating, created_at, status
    `)
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: recipes } = await recipesQuery

  // 관심사 조회
  const { data: interests } = await supabase
    .from('user_interests')
    .select('interest_value')
    .eq('user_id', profile.id)

  // 식단 선호도 조회
  const { data: dietaryPrefs } = await supabase
    .from('user_dietary_preferences')
    .select('preference_type')
    .eq('user_id', profile.id)

  // 알레르기 정보 조회
  const { data: allergies } = await supabase
    .from('user_allergies')
    .select('ingredient_name')
    .eq('user_id', profile.id)

  // 콘텐츠 카운트 — 프로필 카드 통계 블록용. 4개 버킷(공개 레시피·공개 팁·
  // 임시저장·비공개)은 서로 겹치지 않고 사용자의 모든 글을 정확히 분할한다.
  // count:'exact',head:true — 행을 가져오지 않고 집계해 PostgREST 기본 1000행
  // 제한에 안 걸림(레시피 1000개 넘는 작성자도 정확). recipes_count 컬럼은
  // 공개+비공개 전 상태 합산이라 "공개 레시피" 통계엔 부적합 → 직접 센다.
  const counts = { recipes: 0, tips: 0, drafts: 0, private: 0 }
  const [pubRecipes, pubTips] = await Promise.all([
    supabase.from('recipes').select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id).eq('status', 'published'),
    supabase.from('tip').select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id).eq('is_public', true).eq('is_draft', false),
  ])
  counts.recipes = pubRecipes.count || 0
  counts.tips = pubTips.count || 0
  // 임시저장·비공개는 비공개 정보 → 본인 프로필일 때만 계산
  if (isOwnProfile) {
    const [draftRecipes, privateRecipes, draftTips, privateTips] = await Promise.all([
      supabase.from('recipes').select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id).eq('status', 'draft'),
      supabase.from('recipes').select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id).eq('status', 'private'),
      supabase.from('tip').select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id).eq('is_draft', true),
      supabase.from('tip').select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id).eq('is_public', false).eq('is_draft', false),
    ])
    counts.drafts = (draftRecipes.count || 0) + (draftTips.count || 0)
    counts.private = (privateRecipes.count || 0) + (privateTips.count || 0)
  }

  return NextResponse.json({
    profile,
    counts,
    recipes: recipes || [],
    interests: interests?.map(i => i.interest_value) || [],
    // 알레르기·식단 선호도는 민감한 개인정보 — 본인만 조회 가능
    dietaryPreferences: isOwnProfile ? dietaryPrefs?.map(d => d.preference_type) || [] : [],
    allergies: isOwnProfile ? allergies?.map(a => a.ingredient_name) || [] : [],
    isOwnProfile
  })
  } catch (error) {
    console.error('[users/username] GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT /api/users/[username] - 프로필 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
  const { username } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  // 본인 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!profile || profile.id !== user.id) {
    return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
  }

  const body = await request.json()
  const {
    full_name, bio, avatar_url,
    birth_date, gender, country,
    email_notifications, push_notifications, meal_time_notifications
  } = body

  if (full_name && typeof full_name === 'string' && full_name.length > 100) {
    return NextResponse.json({ error: '이름은 100자 이내여야 합니다' }, { status: 400 })
  }
  if (bio && typeof bio === 'string' && bio.length > 500) {
    return NextResponse.json({ error: '소개는 500자 이내여야 합니다' }, { status: 400 })
  }

  const sanitizedFullName = full_name ? sanitizeHtml(full_name) : full_name;
  const sanitizedBio = bio ? sanitizeHtml(bio) : bio;

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      full_name: sanitizedFullName,
      bio: sanitizedBio,
      avatar_url,
      birth_date,
      gender,
      country,
      email_notifications,
      push_notifications,
      meal_time_notifications,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('[users/username] PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
