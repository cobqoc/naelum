import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getBlockedUserIds, toNotInList } from '@/lib/social/blocks'

// GET /api/recipes/[id]/posts/[postId]/replies — 답글 목록(1단)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> },
) {
  const { postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const notInList = toNotInList(await getBlockedUserIds(supabase, user?.id))

  let query = supabase
    .from('recipe_posts')
    .select(`*, user:profiles(id, username, avatar_url)`)
    .eq('parent_id', postId)
    .eq('is_deleted', false)
  if (notInList) query = query.not('user_id', 'in', notInList)

  const { data: replies, error } = await query.order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let withMeta = replies || []
  if (withMeta.length > 0 && user) {
    const ids = withMeta.map(r => r.id)
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', ids)
      .eq('user_id', user.id)
    const liked = new Set(likes?.map(l => l.post_id) || [])
    withMeta = withMeta.map(r => ({ ...r, is_liked: liked.has(r.id), replies_count: 0 }))
  } else {
    withMeta = withMeta.map(r => ({ ...r, is_liked: false, replies_count: 0 }))
  }

  return NextResponse.json({ replies: withMeta })
}
