/**
 * 한국어 조사(으)로 자동 선택 — i18n 유틸.
 *
 * ko 로케일 문자열의 `{nameWithRo}` 보간을 위해 재료명 끝글자 받침을 보고 '로/으로' 를 붙인다.
 *  - 끝글자 받침 없음(모음) 또는 ㄹ 받침 → 로  (예: 쌀로, 두유로)
 *  - 그 외 받침 → 으로  (예: 닭으로)
 *  - 한글 아닌 글자(영문·숫자 끝) → 기본 '로' (대부분 외래 재료명에 자연스러움)
 *
 * ⚠️ 이 함수의 '로'/'으로' 는 *한국어 문법 출력*이라 번역 대상이 아니다(ko 전용 경로에서만 호출).
 * 비-ko 로케일 템플릿은 `{name}`/`{names}` 를 단순 join 치환하므로 이 함수를 거치지 않는다.
 * 'use client' 컴포넌트 인라인이 아니라 i18n 유틸로 둠으로써 관심사를 분리한다.
 */
export function withRoParticle(name: string): string {
  const last = name.trim().slice(-1);
  if (!last) return name;
  const code = last.charCodeAt(0);
  // 한글 음절 범위 (가~힣)
  if (code < 0xac00 || code > 0xd7a3) return `${name}로`;
  const batchim = (code - 0xac00) % 28;
  // batchim === 0: 받침 없음(모음 끝), batchim === 8: ㄹ
  if (batchim === 0 || batchim === 8) return `${name}로`;
  return `${name}으로`;
}
