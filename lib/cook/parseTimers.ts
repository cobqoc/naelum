/**
 * 조리 지시문에서 타이머(분)를 파싱한다.
 *
 * - `N시간 M분` / `N시간` → 총 분으로 환산. 매칭 구간은 공백으로 치환해
 *   내부 `M분`이 따로 또 잡히지 않게 한다 ("1시간 30분"이 "30분"으로
 *   오파싱되던 문제 해결).
 * - `N분` → 분. 단 `N분의 M`(분수)은 타이머가 아니므로 제외.
 * - 중복 제거, 1~120분 범위만 (3시간+ 같은 장시간은 인앱 타이머 대상 아님).
 *
 * 디지털 숫자만 인식한다 — 한글 숫자("삼 분")는 의도적으로 미지원:
 * `오이`(=오5·이2) 같은 일반 단어와 충돌해 가짜 타이머를 만들기 때문.
 */
export function parseAllTimers(instruction: string): number[] {
  const result: number[] = [];

  // 1) "N시간 [M분]" → 총 분. 매칭 구간은 제거(공백 치환).
  const stripped = instruction.replace(
    /(\d+)\s*시간(?:\s*(\d+)\s*분)?/g,
    (_match, h: string, m?: string) => {
      result.push(parseInt(h, 10) * 60 + (m ? parseInt(m, 10) : 0));
      return ' ';
    },
  );

  // 2) 남은 텍스트의 "N분" — "분의"(분수)는 제외
  for (const mt of stripped.matchAll(/(\d+)\s*분(?!의)(?:간|동안|씩|정도|가량)?/g)) {
    result.push(parseInt(mt[1], 10));
  }

  // 3) 중복 제거 + 1~120분 범위
  const seen = new Set<number>();
  const out: number[] = [];
  for (const n of result) {
    if (n >= 1 && n <= 120 && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
