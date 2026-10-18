import { createClient } from './server'
import { User } from '@supabase/supabase-js'
import { getClientIp } from '@/lib/api/clientIp'

/**
 * 관리자 권한 검증 에러 타입
 */
export type AdminAuthError = {
  error: string
  status: number
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND'
}

/**
 * 관리자 권한 검증 성공 타입
 */
export type AdminAuthSuccess = {
  user: User
  profile: { role: string; username: string }
  supabase: Awaited<ReturnType<typeof createClient>>
}

/**
 * 관리자 권한 확인 헬퍼 함수
 * API 라우트에서 사용하여 관리자 권한을 검증합니다.
 *
 * @returns 성공 시 사용자, 프로필, Supabase 클라이언트 / 실패 시 에러 정보
 *
 * @example
 * ```typescript
 * const auth = await verifyAdmin()
 *
 * if ('error' in auth) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status })
 * }
 *
 * // auth.user, auth.profile, auth.supabase 사용 가능
 * ```
 */
export async function verifyAdmin(): Promise<AdminAuthError | AdminAuthSuccess> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: '인증이 필요합니다',
      status: 401,
      code: 'UNAUTHORIZED'
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return {
      error: '프로필을 찾을 수 없습니다',
      status: 404,
      code: 'NOT_FOUND'
    }
  }

  if (profile.role !== 'admin') {
    return {
      error: '관리자 권한이 필요합니다',
      status: 403,
      code: 'FORBIDDEN'
    }
  }

  return { user, profile, supabase }
}

/**
 * 관리자 활동 로그 기록 헬퍼 함수
 */
export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_actions')
    .insert({
      admin_id: adminId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details: details || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })

  if (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * 관리자 권한 확인 및 로그 기록을 함께 수행하는 헬퍼 함수
 */
export async function verifyAdminAndLog(
  actionType: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
  request?: Request
) {
  const auth = await verifyAdmin()

  if ('error' in auth) {
    return auth
  }

  // 로그 기록
  // 2026-10-04 API1-44: x-forwarded-for 원문(전체, Cloudflare 뒤에선 엣지 IP·다중 값)을 그대로 넣던 것을 단일 출처
  // getClientIp(CF-Connecting-IP 우선 → XFF 첫 값 → X-Real-IP)로. 헤더가 없으면('unknown') 이전처럼 NULL —
  // ip_address 는 INET 컬럼이라 'unknown' 문자열을 넣으면 감사로그 insert 자체가 실패한다.
  const clientIp = request ? getClientIp(request.headers, { realIpFallback: true }) : 'unknown'
  const ipAddress = clientIp === 'unknown' ? undefined : clientIp
  const userAgent = request?.headers.get('user-agent') || undefined

  await logAdminAction(
    auth.user.id,
    actionType,
    targetType,
    targetId,
    details,
    ipAddress,
    userAgent
  )

  return auth
}
