import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

      // OAuth 콜백은 항상 소셜 로그인(Google, Kakao 등)을 통해 도달함
      // app_metadata.provider는 Supabase auto-linking 이후에도 원래 값을 유지하므로 신뢰 불가
      // identities 배열에서 이메일 외의 provider(= 실제 사용한 OAuth provider)를 확인
      const identities = authData.user.identities ?? []
      const oauthIdentity = identities.find(i => i.provider !== 'email')
      const currentProvider = oauthIdentity?.provider ?? authData.user.app_metadata?.provider ?? 'unknown'

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('auth_provider, id')
        .eq('email', authData.user.email!)
        .maybeSingle()

      // 이미 다른 provider로 가입된 경우
      if (existingProfile && existingProfile.id !== authData.user.id) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${baseUrl}/auth/duplicate-email?email=${encodeURIComponent(authData.user.email!)}&original=${existingProfile.auth_provider}`
        )
      }

      // 같은 사용자지만 provider가 다른 경우
      if (existingProfile && existingProfile.auth_provider && existingProfile.auth_provider !== currentProvider) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${baseUrl}/auth/duplicate-email?email=${encodeURIComponent(authData.user.email!)}&original=${existingProfile.auth_provider}`
        )
      }

      // 프로필 존재 여부 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      // 프로필이 없으면 → 신규 사용자 → 약관 동의 페이지로
      if (!profile) {
        // 이메일 중복 체크 (다른 provider로 이미 가입된 경우)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email, auth_provider')
          .eq('email', authData.user.email!)
          .maybeSingle()

        if (existingProfile) {
          // 중복된 이메일이 있으면 로그아웃 후 에러 페이지로 리다이렉트
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${baseUrl}/auth/duplicate-email?email=${encodeURIComponent(authData.user.email!)}&original=${existingProfile.auth_provider}`
          )
        }

        // 중복이 없으면 약관 동의 페이지로 (프로필은 생성하지 않음)
        return NextResponse.redirect(`${baseUrl}/auth/terms-agreement`)
      }

      // 프로필이 있으면 기존 사용자 → 홈으로
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // 에러 발생 시 에러 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
