import { createClient } from '@/lib/supabase/server'
import { removeOAuthIdentity } from '@/lib/supabase/service'
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

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
      if (emailIdentity && oauthIdentity) {
        try {
          await removeOAuthIdentity(authData.user.id, oauthIdentity.provider)
        } catch {
          // 제거 실패해도 signOut으로 세션 무효화
        }
        await supabase.auth.signOut()
        return redirectToDuplicateEmail(baseUrl, authData.user.email!, 'email')
      }

      // OAuth only로 로그인했는데 다른 provider로 가입된 프로필이 있는 경우
      if (oauthIdentity) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('auth_provider, id')
          .eq('email', authData.user.email!)
          .maybeSingle()

        if (existingProfile && existingProfile.id !== authData.user.id) {
          await supabase.auth.signOut()
          return redirectToDuplicateEmail(baseUrl, authData.user.email!, existingProfile.auth_provider)
        }
      }

      // 프로필 존재 여부 및 온보딩 완료 여부 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, onboarding_completed')
        .eq('id', authData.user.id)
        .maybeSingle()

      // 온보딩 미완료(신규 사용자 포함) → 약관 동의 페이지로
      if (!profile?.onboarding_completed) {
        if (!profile) {
          // 프로필이 아예 없으면 이메일 중복 체크 (다른 provider로 이미 가입된 경우)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, auth_provider')
            .eq('email', authData.user.email!)
            .maybeSingle()

          if (existingProfile && existingProfile.id !== authData.user.id) {
            await supabase.auth.signOut()
            return redirectToDuplicateEmail(baseUrl, authData.user.email!, existingProfile.auth_provider)
          }
        }

        // 약관 동의 페이지로 — 미동의 상태를 쿠키로 마킹 (미들웨어에서 강제 리다이렉트)
        const termsRedirect = NextResponse.redirect(`${baseUrl}/auth/terms-agreement`)
        termsRedirect.cookies.set('naelum_needs_terms', '1', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 24시간
        })
        return termsRedirect
      }

      // 온보딩 완료된 기존 사용자 → 홈으로
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // 에러 발생 시 에러 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
