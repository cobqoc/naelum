import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyAdmin, type AdminAuthSuccess } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { getClientIp } from '@/lib/api/clientIp';
import { checkRateLimit } from '@/lib/ratelimit';

/**
 * 관리자 API 상단 보일러플레이트(IP → rate limit 429 → verifyAdmin 401/403/404) 단일 출처.
 * (2026-10-04 AG2-30, 행위보존: 8개 사본 중 다른 값 — events 의 rate-limit 키·429 문구, actions 의 인증 실패 code — 는 옵션으로 보존)
 */

const ADMIN_API_WINDOW = { windowMs: 10 * 60 * 1000, maxRequests: 100 };
const DEFAULT_RATE_LIMITED = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

export interface AdminGuardOptions {
  /** rate-limit 키 접두사 — 기본 'admin-api'(관리자 API 공유 버킷). analytics/events 는 'admin-analytics-events' */
  rateKeyPrefix?: string;
  /** 429 본문 — 기본 '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'. analytics/events 는 '요청이 너무 많습니다.' */
  rateLimitedMessage?: string;
  /** 인증 실패 본문에 code 포함 — actions 만 true(`{ error, code }`), 나머지 `{ error }` */
  includeErrorCode?: boolean;
}

export async function guardAdminApi(
  request: Request,
  opts: AdminGuardOptions = {},
): Promise<{ auth: AdminAuthSuccess; response?: undefined } | { response: NextResponse; auth?: undefined }> {
  const ip = getClientIp(request.headers);
  const { allowed } = await checkRateLimit(`${opts.rateKeyPrefix ?? 'admin-api'}:${ip}`, ADMIN_API_WINDOW);
  if (!allowed) {
    return { response: NextResponse.json({ error: opts.rateLimitedMessage ?? DEFAULT_RATE_LIMITED }, { status: 429 }) };
  }

  const auth = await verifyAdmin();
  if ('error' in auth) {
    return {
      response: NextResponse.json(
        opts.includeErrorCode ? { error: auth.error, code: auth.code } : { error: auth.error },
        { status: auth.status },
      ),
    };
  }
  return { auth };
}

/**
 * 쿠키 세션 로그인 + `profiles.role === 'admin'` 확인 — ingredients/[id]/approve(PATCH·DELETE)·ingredients/pending(GET)
 * 의 `checkAdminRole` 바이트 동일 2벌 + "인증→관리자 확인→403" 블록 3벌을 1벌로. (2026-10-04 AG2-31, 행위보존)
 *
 * verifyAdmin 과 의도적으로 다르다(원본 그대로): 401 은 requireAuth 본문 `'로그인이 필요합니다'`, 관리자가 아니거나
 * 프로필이 없으면 403 `'관리자 권한이 필요합니다'`. 역할 조회는 전달받은 같은 쿠키 세션 클라이언트로(원본은 같은 세션의
 * 클라이언트를 새로 하나 더 만들었을 뿐 — RLS·결과 동일).
 */
export async function requireAdminRole(
  supabase: SupabaseClient,
): Promise<{ user: { id: string; email?: string }; response?: undefined } | { response: NextResponse; user?: undefined }> {
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return { response: authError };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return { response: NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 }) };
  }
  return { user };
}
