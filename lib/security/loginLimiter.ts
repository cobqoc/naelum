/**
 * Login attempt rate limiter — DB-backed for Vercel serverless.
 * Replaces the in-memory Map that didn't persist across serverless instances.
 *
 * Uses the rate_limits table + check_rate_limit RPC (20260411_rate_limits.sql).
 * Fails open on DB errors to avoid blocking legitimate logins.
 */

import { createClient } from '@supabase/supabase-js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const KEY_PREFIX = 'login:';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
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
    await supabase.from('rate_limits').delete().eq('identifier', key);
  } catch {
    // Non-critical: record expires naturally after LOCKOUT_DURATION_MS
  }
}
