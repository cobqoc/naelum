/**
 * 상대 시간 표기("3일 전" 등) — 순수 함수.
 *
 * god-file([username]/page) 분해 Phase 2: 표현과 무관한 순수 함수라 분리해
 * vitest 단독 검증(영상 「2차 소프트웨어 위기」 테스트 처방). 로직은 원본과
 * byte-identical — 동작 변경 0. notifications 라벨은 호출측에서 i18n 으로 주입.
 */

export interface TimeAgoLabels {
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  monthsAgo: string;
  yearsAgo: string;
}

export function getTimeAgo(dateString: string, notifications: TimeAgoLabels): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 60) return `${diffMins}${notifications.minutesAgo}`;
  if (diffHours < 24) return `${diffHours}${notifications.hoursAgo}`;
  if (diffDays < 30) return `${diffDays}${notifications.daysAgo}`;
  if (diffMonths < 12) return `${diffMonths}${notifications.monthsAgo}`;
  return `${diffYears}${notifications.yearsAgo}`;
}
