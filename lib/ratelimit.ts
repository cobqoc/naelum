/**
 * Unified Rate Limiting Module
 *
 * Supabase DB-backed — safe for Vercel serverless (no shared in-memory state).
 * Falls back to "allow" on DB errors to avoid blocking legitimate requests.
 *
 * Usage: `const { allowed } = await checkRateLimit(identifier, { windowMs, maxRequests });`
 * (2026-10-04 AG2-27: 클래스형 RateLimiter/rateLimit()/ingredientCreationLimiter 와 재-export 심 lib/utils/rateLimit.ts 는
 *  사용처가 ingredients/create 1곳뿐이라 함수형으로 바꾸고 제거 — 같은 키·창·한도라 동작 동일.)
 *
 * Prerequisites: apply supabase/migrations/20260411_rate_limits.sql first,
 * then set ENABLE_RATE_LIMITING=true in production environment variables.
 */

import { getServiceRoleClient } from '@/lib/supabase/service';

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

// 서비스 롤 클라이언트는 무상태(세션 저장·자동 갱신 끔)라 요청 간 재사용해도 동작이 같다.
// 매 요청마다 새로 만들던 것(검색·추천·자동완성 등 rate limit 경로 전부)을 모듈 단위로 1회 생성 (perf 2026-09-27).
// ※ 이것은 상태 저장이 아니다 — rate limit 카운터 자체는 여전히 DB(check_rate_limit RPC)에 있다.
// 2026-10-04 AG2-29/API1-40: 이 파일 전용 memo 사본 → lib/supabase/service 의 공용 memo(같은 인자·같은 재사용 방식).
function createRateLimitClient() {
  return getServiceRoleClient();
}

/**
 * Core rate limit check against Supabase DB.
 * Atomically increments and checks via the `check_rate_limit` RPC function.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  if (process.env.ENABLE_RATE_LIMITING !== 'true') {
    return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
  }

  try {
    const supabase = createRateLimitClient();
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_window_ms: config.windowMs,
      p_max_requests: config.maxRequests,
    });

    if (error || !data?.length) {
      console.error('[ratelimit] DB error:', error?.message ?? 'empty response');
      // Fail open: allow the request rather than block legitimate users
      return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
    }

    const row = data[0] as { allowed: boolean; current_count: number; reset_at: string };
    return {
      allowed: row.allowed,
      remaining: Math.max(0, config.maxRequests - row.current_count),
      resetTime: new Date(row.reset_at).getTime(),
    };
  } catch (err) {
    console.error('[ratelimit] Unexpected error:', err);
    return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
  }
}
