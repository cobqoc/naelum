import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/[username]/following - 팔로잉 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { username } = await params;

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '30');
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('user_follows')
    .select(`
      following:profiles!user_follows_following_id_fkey(id, username, avatar_url, bio)
    `, { count: 'exact' })
    .eq('follower_id', targetUser.id)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const following = (data || []).map((row: any) => row.following);

  return NextResponse.json({
    following,
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
