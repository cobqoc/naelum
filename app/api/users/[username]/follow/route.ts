import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { notifyFollow } from '@/lib/notifications/create'
import { checkRateLimit } from '@/lib/ratelimit'

// POST /api/users/[username]/follow - 팔로우 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { allowed } = await checkRateLimit(`follow:${user.id}`, { windowMs: 60 * 1000, maxRequests: 20 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  // 대상 사용자 조회
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle()

  if (!targetUser) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  if (targetUser.id === user.id) {
    return NextResponse.json({ error: '자기 자신을 팔로우할 수 없습니다' }, { status: 400 })
  }

  // 기존 팔로우 확인
  const { data: existingFollow } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUser.id)
    .maybeSingle()

  if (existingFollow) {
    // 언팔로우
    const { error: deleteError } = await supabase
      .from('user_follows')
      .delete()
      .eq('id', existingFollow.id)

    if (deleteError) {
      return NextResponse.json({ error: '언팔로우 처리 중 오류가 발생했습니다' }, { status: 500 })
    }

    // 카운트 업데이트
    await Promise.all([
      supabase.rpc('decrement_following_count', { user_id: user.id }),
      supabase.rpc('decrement_followers_count', { user_id: targetUser.id })
    ])

    return NextResponse.json({ following: false })
  } else {
    // 팔로우
    const { error: insertError } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: targetUser.id
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: '이미 팔로우 중입니다' }, { status: 409 })
      }
      return NextResponse.json({ error: '팔로우 처리 중 오류가 발생했습니다' }, { status: 500 })
    }

    // 카운트 업데이트
    await Promise.all([
      supabase.rpc('increment_following_count', { user_id: user.id }),
      supabase.rpc('increment_followers_count', { user_id: targetUser.id })
    ])

    // 알림 생성
    const { data: follower } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    await notifyFollow(
      supabase,
      targetUser.id,
      follower?.username || '누군가',
      user.id,
    )

    return NextResponse.json({ following: true })
  }
}
