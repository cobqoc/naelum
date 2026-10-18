import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

/**
 * untyped service-role(RLS 우회) 클라이언트 — 서버 전용.
 *
 * 2026-10-04 AG2-29/API1-40: 같은 인자(`URL, SERVICE_ROLE_KEY, { autoRefreshToken: false, persistSession: false }`)의
 * 인라인 사본 7벌(createAdminClient·removeOAuthIdentity·ratelimit·loginLimiter·notifications·크론 2개)을 단일 출처로.
 * untyped 인 이유: database.types.ts 는 수기·stale(Functions 비어 있음, 배달·push 테이블 없음)이라 제네릭판은 tsc 오류 위험.
 * env 누락 시 동작은 기존 `!` 시맨틱 그대로(createClient 가 'supabaseKey is required' throw).
 */
export function newServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// 무상태(세션 저장·자동 갱신 끔) 클라이언트라 요청 간 재사용해도 동작이 같다 — lib/ratelimit.ts 의 기존 memo 와 같은 근거.
// ※ 상태 저장이 아니다. auth 로그인류(세션을 만드는 호출)에는 쓰지 말 것 — 그런 용도는 newServiceRoleClient().
let sharedServiceRoleClient: ReturnType<typeof newServiceRoleClient> | null = null

/** 모듈 단위 1회 생성 후 재사용하는 service-role 클라이언트(rate limit·알림·크론 등 hot path 용). */
export function getServiceRoleClient(): ReturnType<typeof newServiceRoleClient> {
  if (!sharedServiceRoleClient) sharedServiceRoleClient = newServiceRoleClient()
  return sharedServiceRoleClient
}

/**
 * Service Role 클라이언트 (RLS 우회)
 *
 * ⚠️ 주의사항:
 * - 서버 사이드에서만 사용할 것!
 * - 클라이언트 컴포넌트에서 사용 금지
 * - 클라이언트에 노출되면 심각한 보안 위험
 *
 * 용도:
 * - 개발/테스트 시 RLS 정책 우회
 * - 관리자 작업 시 모든 데이터 접근
 * - 마이그레이션 및 데이터 시딩
 *
 * 사용 예시:
 * ```typescript
 * import { createServiceClient } from '@/lib/supabase/service'
 *
 * const supabase = createServiceClient()
 * const { data } = await supabase
 *   .from('profiles')
 *   .select('*')
 * // RLS 정책 무시하고 모든 프로필 조회
 * ```
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. ' +
      '.env.local 파일을 확인하세요.'
    )
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Supabase auto-linking으로 잘못 추가된 OAuth identity를 제거합니다.
 * unlinkIdentity()는 서버 사이드에서 작동하지 않으므로 service role로 직접 처리합니다.
 *
 * 2026-10-04 AG2-19: RPC 결과의 `{ error }` 를 버리고 있었다(supabase-js 는 throw 하지 않아 호출부 try/catch 로
 * 못 잡음 → 실패해도 로그 0). 결과를 돌려줘 호출부가 표면화한다. 서비스 롤 키 미설정도 오류로 알린다.
 */
export async function removeOAuthIdentity(
  userId: string,
  provider: string,
): Promise<{ error: { message: string } | null }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: { message: 'SUPABASE_SERVICE_ROLE_KEY is not set' } }
  }
  const { error } = await getServiceRoleClient().rpc('remove_oauth_identity', { p_user_id: userId, p_provider: provider })
  return { error }
}

