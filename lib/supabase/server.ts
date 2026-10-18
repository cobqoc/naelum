import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { newServiceRoleClient } from './service'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서는 쿠키 설정 불가
          }
        },
      },
    }
  )
}

/**
 * Admin client with service role key - bypasses RLS
 * Use ONLY for legitimate server-side admin operations
 * DO NOT expose this client to client-side code
 */
export function createAdminClient() {
  // 2026-10-04 AG2-29/API1-40: 같은 인자의 인라인 생성 → lib/supabase/service 단일 출처(호출마다 새 인스턴스 — 기존과 동일).
  return newServiceRoleClient()
}
