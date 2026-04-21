/**
 * 최소 연령 gate — 글로벌 기준.
 *
 * 국가별 최소 가입 연령:
 * - 미국 (COPPA): 13세
 * - 한국 (개인정보보호법): 14세
 * - EU GDPR Art. 8: 16세 (독일·아일랜드·일본 동일)
 * - 그 외: 13~16세 혼재
 *
 * 전세계 safe 기준으로 **16세 이상**만 가입 허용 → 모든 주요 관할 충족.
 */
export const MIN_AGE = 16;

/**
 * 주어진 생년월일(YYYY-MM-DD)로 현재 기준 나이 계산 + 최소 나이 이상인지 판정.
 */
export function checkMinAge(birthDate: string): { age: number; meetsMinimum: boolean } {
  if (!birthDate) return { age: 0, meetsMinimum: false };

  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return { age: 0, meetsMinimum: false };

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return { age, meetsMinimum: age >= MIN_AGE };
}
