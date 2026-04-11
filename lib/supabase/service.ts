import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

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
