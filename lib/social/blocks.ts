import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 차단(user_blocks) 적용 헬퍼 (H3).
 *
 * 기존엔 차단을 기록만 하고 어디에서도 필터하지 않아 "안전기능 placebo" 였다.
 * 차단은 *차단한 사람(blocker) 관점에서 단방향* — 내가 차단한 사용자의 콘텐츠를
 * 내 화면에서 가린다(상대는 영향 없음).
 *
 * 사용처: 댓글/답글 목록, 추천(작성자 기준) 등 사용자 생성 콘텐츠 노출 경로.
 */

/** 현재 사용자가 차단한 사용자 id 목록. 비로그인/없으면 빈 배열. */
export async function getBlockedUserIds(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  if (error) {
    // 차단 목록 조회 실패는 비치명적 — 필터 없이 진행하되 로깅.
    console.error('getBlockedUserIds error:', error.message);
    return [];
  }
  return (data ?? []).map((r: { blocked_id: string }) => r.blocked_id);
}

/**
 * PostgREST `not.in` 필터에 쓸 id 리스트 리터럴. 비었으면 null(필터 미적용).
 * 예: `query.not('user_id', 'in', toNotInList(ids))`
 */
export function toNotInList(ids: string[]): string | null {
  if (ids.length === 0) return null;
  return `(${ids.join(',')})`;
}
