/**
 * 초 → "MM:SS" 포맷 — 순수 함수.
 *
 * god-file(RecipeCookMode) 분해 Phase 2: 표현과 무관한 순수 함수라 분리해
 * vitest 단독 검증. 로직은 원본과 byte-identical — 동작 변경 0.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
