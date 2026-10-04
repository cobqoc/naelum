import { createClient } from '@/lib/supabase/server'
import { createServiceClient, removeOAuthIdentity } from '@/lib/supabase/service'
import { safeRedirectPath } from '@/lib/auth/safeRedirect'
import { NextResponse } from 'next/server'

function redirectToDuplicateEmail(baseUrl: string, email: string, original: string): NextResponse {
  const response = NextResponse.redirect(`${baseUrl}/auth/duplicate-email`)
  response.cookies.set('_naelum_dup', JSON.stringify({ e: email, o: original }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 120,
    path: '/',
  })
  return response
}

// 좀비 계정 정리: 서비스 롤로 auth.users 행 삭제 (profiles FK CASCADE로 함께 정리됨).
// exchangeCodeForSession 직후 duplicate 상황이 감지됐을 때 호출해야 한다.
async function deleteZombieUser(userId: string) {
  try {
    const admin = createServiceClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    // 2026-10-04 AG2-19: deleteUser 실패는 throw 가 아니라 { error } — 이전엔 로그도 없이 좀비 auth.users 가 남았다.
    if (error) console.error('deleteZombieUser failed:', error)
  } catch (e) {
    console.error('deleteZombieUser failed:', e)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 2026-10-04 PAU-61: `next` 를 검증 없이 아래 `${baseUrl}${next}` 에 붙여 `?next=.evil.example`·`@evil.example`
  // 로 외부 도메인 이동이 가능했다 → signin ?redirect 와 같은 규칙(safeRedirectPath: '/' 로 시작·두 번째 문자 '/'·'\'
  // 아님·URL 해석 결과 같은 출처)인 경로만 허용, 아니면 기존 기본값 '/'. 정상 내부 경로는 그대로.
  const next = safeRedirectPath(searchParams.get('next'), origin)

  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && authData.user) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const getBaseUrl = () => {
        if (isLocalEnv) return origin
        if (forwardedHost) return `https://${forwardedHost}`
        return origin
      }

      const baseUrl = getBaseUrl()

      // identities 배열에서 email / OAuth identity 분리
      const identities = authData.user.identities ?? []
      const emailIdentity = identities.find(i => i.provider === 'email')
      const oauthIdentity = identities.find(i => i.provider !== 'email')

      // email + OAuth identity가 모두 있으면 → Supabase auto-linking이 발생한 것
      // 이메일로 가입한 계정에 OAuth가 무단으로 연결된 케이스
      // (이 경우 user.id는 기존 이메일 계정과 동일하므로 deleteUser 금지)
      if (emailIdentity && oauthIdentity) {
        try {
          // 2026-10-04 AG2-19: RPC 실패는 throw 가 아니라 { error } 로 온다 — 이전엔 버려져 자동연결된 identity 가
          // 무음으로 남았다. 흐름은 그대로(실패해도 signOut + duplicate 안내), 로그로만 표면화.
          const { error: unlinkError } = await removeOAuthIdentity(authData.user.id, oauthIdentity.provider)
          if (unlinkError) console.error('[auth/callback] removeOAuthIdentity failed:', unlinkError)
        } catch (e) {
          // 제거 실패해도 signOut으로 세션 무효화
          console.error('[auth/callback] removeOAuthIdentity threw:', e)
        }
        await supabase.auth.signOut()
        return redirectToDuplicateEmail(baseUrl, authData.user.email!, 'email')
      }

      // 2026-10-04 AG2-45: OAuth 경로의 "email 로 기존 profile" 조회와 아래 "id 로 내 profile" 조회는 서로 독립 → 병렬
      // (로그인당 왕복 1회 절감). 판정 순서는 그대로 — email 충돌이면 좀비 정리 후 duplicate(그때 id 조회 결과는 버림).
      const [emailProfileRes, { data: profile }] = await Promise.all([
        oauthIdentity
          ? supabase
              .from('profiles')
              .select('auth_provider, id')
              .eq('email', authData.user.email!)
              .maybeSingle()
          : null,
        // 프로필 존재 여부 및 온보딩 완료 여부 확인
        // (handle_new_user 트리거가 이미 profile 행을 생성했어야 함)
        supabase
          .from('profiles')
          .select('id, onboarding_completed')
          .eq('id', authData.user.id)
          .maybeSingle(),
      ])

      // OAuth only로 로그인했는데 다른 provider로 가입된 프로필이 있는 경우
      // → 이 user는 새로 생성된 좀비이므로 auth.users까지 완전 삭제
      if (oauthIdentity) {
        const existingProfile = emailProfileRes?.data

        if (existingProfile && existingProfile.id !== authData.user.id) {
          await supabase.auth.signOut()
          await deleteZombieUser(authData.user.id)
          return redirectToDuplicateEmail(baseUrl, authData.user.email!, existingProfile.auth_provider)
        }
      }

      // 트리거가 email 충돌로 profile 생성을 스킵한 케이스 — duplicate로 처리
      if (!profile) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, auth_provider')
          .eq('email', authData.user.email!)
          .maybeSingle()

        if (existingProfile && existingProfile.id !== authData.user.id) {
          await supabase.auth.signOut()
          await deleteZombieUser(authData.user.id)
          return redirectToDuplicateEmail(baseUrl, authData.user.email!, existingProfile.auth_provider)
        }

        // 예기치 않은 상태 — 트리거가 실행됐어야 하는데 profile이 없음.
        // 세션을 무효화하고 에러 페이지로 보내 좀비 상태를 방지한다.
        await supabase.auth.signOut()
        await deleteZombieUser(authData.user.id)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }

      // 온보딩 미완료 → 약관 동의 페이지로
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${baseUrl}/auth/terms-agreement`)
      }

      // 온보딩 완료된 기존 사용자 → 홈으로
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // 에러 발생 시 에러 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
