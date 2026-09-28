/**
 * Unified Rate Limiting Module
 *
 * Supabase DB-backed — safe for Vercel serverless (no shared in-memory state).
 * Falls back to "allow" on DB errors to avoid blocking legitimate requests.
 *
 * Two usage styles:
 * 1. Class-based: `const limiter = rateLimit(); await limiter.check(3, userId);`
 * 2. Function-based: `await checkRateLimit(identifier, { windowMs, maxRequests });`
 *
 * Prerequisites: apply supabase/migrations/20260411_rate_limits.sql first,
 * then set ENABLE_RATE_LIMITING=true in production environment variables.
 */

import { createClient } from '@supabase/supabase-js';

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  interval?: number;
  /** Kept for API compatibility — not used in DB-backed implementation */
  uniqueTokenPerInterval?: number;
}

// 서비스 롤 클라이언트는 무상태(세션 저장·자동 갱신 끔)라 요청 간 재사용해도 동작이 같다.
// 매 요청마다 새로 만들던 것(검색·추천·자동완성 등 rate limit 경로 전부)을 모듈 단위로 1회 생성 (perf 2026-09-27).
// ※ 이것은 상태 저장이 아니다 — rate limit 카운터 자체는 여전히 DB(check_rate_limit RPC)에 있다.
function newRateLimitClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
// ReturnType<typeof newRateLimitClient> 로 제네릭 추론 보존 (lib/supabase/client.ts 와 같은 패턴)
let rateLimitClient: ReturnType<typeof newRateLimitClient> | null = null;
function createRateLimitClient() {
  if (!rateLimitClient) rateLimitClient = newRateLimitClient();
  return rateLimitClient;
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

/**
 * Class-based rate limiter (maintains .check() interface used by existing call sites).
 */
export class RateLimiter {
  private interval: number;

  constructor(options: RateLimitOptions = {}) {
    this.interval = options.interval ?? 60 * 1000;
  }

  async check(limit: number, token: string): Promise<void> {
    const { allowed, resetTime } = await checkRateLimit(token, {
      windowMs: this.interval,
      maxRequests: limit,
    });

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    }
  }
}

/**
 * Create a new rate limiter instance.
 */
export function rateLimit(options?: RateLimitOptions): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Rate limiter for ingredient creation (3 per minute per user).
 */
export const ingredientCreationLimiter = rateLimit({
  interval: 60 * 1000,
});
