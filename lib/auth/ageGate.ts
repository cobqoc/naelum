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
 *
 * `YYYY-MM-DD`(<input type="date"> 값)는 *달력 날짜 그대로* 비교한다(2026-10-04). 예전처럼 `new Date('YYYY-MM-DD')`
 * 로 파싱하면 UTC 자정이 되고 로컬 getter 로 읽을 때 UTC 서쪽(미주 등) 브라우저에선 하루 이른 날짜가 돼, 생일 하루 전에
 * 16세로 판정됐다(서버=UTC 판정과 불일치). KST·UTC 환경의 결과는 이전과 같다. 그 외 형식은 이전 방식 그대로 파싱.
 *
 * @param now 테스트용 기준 시각(기본: 지금)
 */
export function checkMinAge(birthDate: string, now: Date = new Date()): { age: number; meetsMinimum: boolean } {
  if (!birthDate) return { age: 0, meetsMinimum: false };

  let year: number;
  let month: number; // 0-based
  let day: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]) - 1;
    day = Number(iso[3]);
    // 존재하지 않는 날짜(2010-13-45 등)는 이전처럼 무효 처리
    const check = new Date(Date.UTC(year, month, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month || check.getUTCDate() !== day) {
      return { age: 0, meetsMinimum: false };
    }
  } else {
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return { age: 0, meetsMinimum: false };
    year = dob.getFullYear();
    month = dob.getMonth();
    day = dob.getDate();
  }

  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age -= 1;
  }

  return { age, meetsMinimum: age >= MIN_AGE };
}
