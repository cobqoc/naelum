import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RateLimitConfig } from '../ratelimit'

/**
 * Rate Limit 미들웨어
 *
 * API 라우트를 rate limiting으로 보호합니다.
 * 환경변수 ENABLE_RATE_LIMITING=true일 때만 활성화됩니다.
 *
 * @param request - Next.js request 객체
 * @param config - Rate limit 설정 (windowMs, maxRequests)
 * @param handler - 실제 API 핸들러 함수
 * @returns NextResponse
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withRateLimit(
 *     request,
 *     { windowMs: 10 * 60 * 1000, maxRequests: 100 }, // 10분에 100개
 *     async () => {
 *       // 실제 API 로직
 *       return NextResponse.json({ data: '...' })
 *     }
 *   )
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // IP 주소 추출
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const { allowed, remaining, resetTime } = await checkRateLimit(ip, config)

  // Rate limit 초과
  if (!allowed) {
    return NextResponse.json(
      {
        error: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: new Date(resetTime).toISOString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        }
      }
    )
  }

  // 핸들러 실행
  const response = await handler()

  // Rate limit 헤더 추가
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())

  return response
}

/**
 * 사전 정의된 Rate Limit 설정
 */
export const RATE_LIMITS = {
  /** 관리자 API: 10분에 100개 요청 */
  ADMIN_API: {
    windowMs: 10 * 60 * 1000,
    maxRequests: 100
  },

  /** 일반 API: 5분에 50개 요청 */
  GENERAL_API: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 50
  },

  /** 인증 API: 15분에 5개 요청 */
  AUTH_API: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5
  },

  /** 업로드 API: 1시간에 20개 요청 */
  UPLOAD_API: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20
  }
} as const
