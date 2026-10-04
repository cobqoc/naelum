import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/ratelimit';

/**
 * 콘텐츠/사용자 신고 공용 핸들러 — 레시피·팁·사용자 신고 라우트 3벌(95% 동일 복붙)의 단일 출처.
 * (2026-10-04 API1-35, 행위보존: 각 라우트의 메시지·사유 목록·rate-limit 키·대상 조회를 cfg 로 그대로 주입)
 *
 * 처리 순서(원본 그대로): 인증 401 → rate limit 429 → JSON 400 → 사유 400 → 대상 404 → 자기 신고 400
 * → 중복(대기 중) 409 → insert 500 → 200.
 */

export interface ReportTarget {
  /** reports.reported_id 로 저장·중복검사에 쓰는 값(레시피·팁은 URL id 원문, 사용자는 profiles.id) */
  id: string;
  /** 자기 신고 판정용 소유자 id(레시피·팁 author_id, 사용자는 자기 id) */
  ownerId: string;
}

export interface ReportConfig {
  reportedType: 'recipe' | 'tip' | 'user';
  reasons: readonly string[];
  /** rate-limit 키 접두사 — 레시피·팁은 'report'(공유 버킷), 사용자는 'user-report' */
  rateKeyPrefix: 'report' | 'user-report';
  /** 신고 대상 조회. 없으면 null(→404) */
  resolveTarget: (supabase: SupabaseClient) => Promise<ReportTarget | null>;
  messages: { notFound: string; self: string; duplicate: string; success: string };
}

export async function handleReport(
  request: Request,
  supabase: SupabaseClient,
  cfg: ReportConfig,
): Promise<NextResponse> {
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { allowed } = await checkRateLimit(`${cfg.rateKeyPrefix}:${user.id}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 });
  if (!allowed) {
    return NextResponse.json({ error: '신고 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 });
  }

  let body: { reason?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
  // 2026-10-04 API1-41: 본문이 JSON null·원시값이면 구조분해 TypeError → 500 이었다 → 같은 400.
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { reason, description } = body;

  if (!reason || !cfg.reasons.includes(reason)) {
    return NextResponse.json({ error: '유효한 신고 사유를 선택해주세요.' }, { status: 400 });
  }

  // 신고 대상 존재 확인
  const target = await cfg.resolveTarget(supabase);

  if (!target) {
    return NextResponse.json({ error: cfg.messages.notFound }, { status: 404 });
  }

  // 자기 콘텐츠·자기 자신 신고 방지
  if (target.ownerId === user.id) {
    return NextResponse.json({ error: cfg.messages.self }, { status: 400 });
  }

  // 중복 신고 확인 (대기 중인 신고만)
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_type', cfg.reportedType)
    .eq('reported_id', target.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: cfg.messages.duplicate }, { status: 409 });
  }

  // 2026-10-04 API1-41: 문자열이 아닌 description 은 아래 `description?.trim()` 에서 TypeError → 500 이었다 → 400
  // (원래 실패하던 지점 그대로 — 앞선 404/400/409 판정 순서 불변).
  if (description != null && typeof description !== 'string') {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_type: cfg.reportedType,
    reported_id: target.id,
    reason,
    description: description?.trim() || null,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: '신고 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: cfg.messages.success });
}

// ── 라우트별 설정 (원본 3벌의 값 그대로) ─────────────────────────────────────────

const CONTENT_REPORT_REASONS = ['spam', 'inappropriate', 'copyright', 'false_info', 'other'] as const;
const USER_REPORT_REASONS = ['spam', 'harassment', 'inappropriate', 'impersonation', 'other'] as const;

/** POST /api/recipes/[id]/report */
export function recipeReportConfig(recipeId: string): ReportConfig {
  return {
    reportedType: 'recipe',
    reasons: CONTENT_REPORT_REASONS,
    rateKeyPrefix: 'report',
    resolveTarget: async (supabase) => {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('id, author_id')
        .eq('id', recipeId)
        .single();
      return recipe ? { id: recipeId, ownerId: recipe.author_id } : null;
    },
    messages: {
      notFound: '레시피를 찾을 수 없습니다.',
      self: '자신의 레시피는 신고할 수 없습니다.',
      duplicate: '이미 신고가 접수된 레시피입니다.',
      success: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
    },
  };
}

/** POST /api/tip/[id]/report — 레시피 신고와 동일 패턴(`reported_type = 'tip'`) */
export function tipReportConfig(tipId: string): ReportConfig {
  return {
    reportedType: 'tip',
    reasons: CONTENT_REPORT_REASONS,
    rateKeyPrefix: 'report',
    resolveTarget: async (supabase) => {
      const { data: tip } = await supabase
        .from('tip')
        .select('id, author_id')
        .eq('id', tipId)
        .single();
      return tip ? { id: tipId, ownerId: tip.author_id } : null;
    },
    messages: {
      notFound: '팁을 찾을 수 없습니다.',
      self: '자신의 팁은 신고할 수 없습니다.',
      duplicate: '이미 신고가 접수된 팁입니다.',
      success: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
    },
  };
}

/** POST /api/users/[username]/report */
export function userReportConfig(username: string): ReportConfig {
  return {
    reportedType: 'user',
    reasons: USER_REPORT_REASONS,
    rateKeyPrefix: 'user-report',
    resolveTarget: async (supabase) => {
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      return targetUser ? { id: targetUser.id, ownerId: targetUser.id } : null;
    },
    messages: {
      notFound: '사용자를 찾을 수 없습니다.',
      self: '자기 자신을 신고할 수 없습니다.',
      duplicate: '이미 신고가 접수된 사용자입니다.',
      success: '신고가 접수되었습니다.',
    },
  };
}
