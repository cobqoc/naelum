import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// GET /api/users/blocks - 내가 차단한 사용자 목록
export async function GET() {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_blocks')
    .select(`
      blocked_id,
      created_at,
      blocked:profiles!user_blocks_blocked_id_fkey(id, username, avatar_url)
    `)
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 });
  }

  const blockedUsers = (data || []).map((row: { blocked_id: string; created_at: string; blocked: { id: string; username: string; avatar_url: string | null } }) => ({
    id: row.blocked_id,
    username: row.blocked?.username,
    avatar_url: row.blocked?.avatar_url,
    blocked_at: row.created_at,
  }));

  return NextResponse.json({ blockedUsers });
}
