import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  // 이 기기 세션만 — 기본값(global)은 사용자의 모든 기기를 로그아웃시켰다(2026-10-19 감사 AG2-36)
  await supabase.auth.signOut({ scope: 'local' })

  return NextResponse.redirect(new URL('/', request.url))
}
