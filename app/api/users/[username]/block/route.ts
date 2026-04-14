import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// POST /api/users/[username]/block - 사용자 차단
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { username } = await params;

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  if (targetUser.id === user.id) {
    return NextResponse.json({ error: '자기 자신을 차단할 수 없습니다.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: user.id, blocked_id: targetUser.id });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 차단한 사용자입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: '차단 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '사용자를 차단했습니다.' });
}

// DELETE /api/users/[username]/block - 사용자 차단 해제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { username } = await params;

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUser.id);

  if (error) {
    return NextResponse.json({ error: '차단 해제 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '차단을 해제했습니다.' });
}

// GET /api/users/[username]/block - 차단 여부 확인
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { username } = await params;

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUser.id)
    .maybeSingle();

  return NextResponse.json({ isBlocked: !!data });
}
