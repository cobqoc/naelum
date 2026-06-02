/**
 * 한국어 주격 조사 선택 — 받침 있으면 '이', 없으면 '가'.
 *
 * "쌀이(가) 들어간…" 처럼 이(가)를 병기하던 어색함을 자연스럽게("쌀이 들어간…").
 * 한글 음절이 아닌 끝글자(영문·숫자·기호)는 가장 흔한 '가'로 폴백(거짓 정확성 회피).
 */
export function subjectParticle(word: string): '이' | '가' {
  const last = (word ?? '').trim().slice(-1);
  if (!last) return '가';
  const code = last.charCodeAt(0);
  // 한글 음절 영역: 가(0xAC00) ~ 힣(0xD7A3)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jongseong = (code - 0xac00) % 28; // 0 = 받침 없음
    return jongseong === 0 ? '가' : '이';
  }
  return '가';
}
