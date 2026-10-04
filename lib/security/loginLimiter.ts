/**
 * Login attempt rate limiter — DB-backed for Vercel serverless.
 * Replaces the in-memory Map that didn't persist across serverless instances.
 *
 * Uses the rate_limits table + check_rate_limit RPC (20260411_rate_limits.sql).
 * Fails open on DB errors to avoid blocking legitimate logins.
 */

import { getServiceRoleClient } from '@/lib/supabase/service';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const KEY_PREFIX = 'login:';

// 2026-10-04 AG2-29/API1-40: 호출마다 새로 만들던 인라인 사본(로그인 실패 1회에 check+record 2개) → 공용 memo.
// 무상태 클라이언트라 재사용해도 동작 동일. 각 호출부의 try 안에서 불리므로 env 누락 throw 도 기존처럼 fail-open.
function getAdminClient() {
  return getServiceRoleClient();
}

export async function checkLoginAttempt(identifier: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
}> {
  try {
    const supabase = getAdminClient();
    const key = `${KEY_PREFIX}${identifier}`;

    const { data } = await supabase
      .from('rate_limits')
      .select('count, reset_at')
      .eq('identifier', key)
      .maybeSingle();

    if (!data) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null };
    }

    const resetAt = new Date(data.reset_at).getTime();
    if (data.count >= MAX_ATTEMPTS && resetAt > Date.now()) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: resetAt };
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - data.count),
      lockedUntil: null,
    };
  } catch {
    // Fail open: DB errors should not block legitimate logins
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null };
  }
}

export async function recordFailedAttempt(identifier: string): Promise<{
  locked: boolean;
  lockedUntil: number | null;
  remainingAttempts: number;
}> {
  try {
    const supabase = getAdminClient();
    const key = `${KEY_PREFIX}${identifier}`;

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: key,
      p_window_ms: LOCKOUT_DURATION_MS,
      p_max_requests: MAX_ATTEMPTS,
    });

    if (error || !data?.length) {
      return { locked: false, lockedUntil: null, remainingAttempts: MAX_ATTEMPTS };
    }

    const row = data[0] as { allowed: boolean; current_count: number; reset_at: string };
    const lockedUntil = new Date(row.reset_at).getTime();

    if (row.current_count >= MAX_ATTEMPTS) {
      return { locked: true, lockedUntil, remainingAttempts: 0 };
    }

    return {
      locked: false,
      lockedUntil: null,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - row.current_count),
    };
  } catch {
    return { locked: false, lockedUntil: null, remainingAttempts: MAX_ATTEMPTS };
  }
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  try {
    const supabase = getAdminClient();
    const key = `${KEY_PREFIX}${identifier}`;
    // 2026-10-04 AG2-39: supabase 는 실패를 throw 하지 않고 { error } 로 돌려줘 아래 catch 로는 못 잡았다 → 로그로 표면화.
    // (흐름 불변 — 지워지지 않으면 실패 카운트가 남아 다음 오입력 몇 번에 조기 잠금될 수 있어 관측이 필요)
    const { error } = await supabase.from('rate_limits').delete().eq('identifier', key);
    if (error) console.error('[loginLimiter] clearLoginAttempts failed:', error.message);
  } catch {
    // Non-critical: record expires naturally after LOCKOUT_DURATION_MS
  }
}
