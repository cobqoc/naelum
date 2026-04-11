import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

type AuthResult =
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse }

export async function requireAuth(supabase: SupabaseClient): Promise<AuthResult> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 }),
    }
  }

  return { user, error: null }
}
