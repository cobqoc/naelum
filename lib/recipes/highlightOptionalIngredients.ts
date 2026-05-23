/**
 * 조리 단계 본문에서 "없어도 OK" 표시된 재료의 멘션을 자동 highlight 한다.
 *
 * 작성자는 재료 카드에서 토글 한 번만 하면 되고(`is_optional=true`),
 * 따라하는 사용자는 본문에서 "(선택)" 태그 + amber 색으로 즉시 인지.
 *
 * 매칭 정책:
 *  - 재료명 자체 + INGREDIENT_ALIASES 동의어 모두 후보로 (대파 optional → "파" 도 매칭)
 *  - 부분문자열 오매칭 차단 (word boundary): 매칭 직전·직후가 한글이면 단어의 일부로 간주
 *  - 단, 매칭 직후 한글이 *조사*면 OK ("청양고추를", "마늘은")
 *  - 첫 멘션만 `isFirstMention=true` → UI 는 (선택) 태그 + amber, 이후는 amber 색만
 *
 * 첫 멘션 추적은 `alreadyMentioned` Set 으로 단계 간 공유 (전체 레시피 기준).
 * 호출자가 단계마다 같은 Set 을 넘기면 step1 의 "청양고추(선택)" → step2 의 "청양고추" 색만.
 */

import { INGREDIENT_ALIASES } from '@/lib/recommendations/match';

export interface OptionalIngredient {
  name: string;
  substitutes?: string[];
}

export type HighlightToken =
  | { type: 'text'; value: string }
  | {
      type: 'optional';
      matchedText: string;
      ingredientName: string;
      isFirstMention: boolean;
      substitutes?: string[];
    };

// 한국어 조사 — 매칭 직후 한글이 조사면 단어 끝으로 간주.
// 자주 쓰이는 1~3글자만. drop-in 추가 가능.
const KOREAN_PARTICLES = [
  '으로는', '에서도', '에서는', '에서', '으로', '에게', '한테', '까지', '에는',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '의', '로',
  '쯤', '째', '랑', '나', '든', '서',
];

function isKoreanHangul(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

/**
 * `text[fromIndex]` 부터 시작하는 한글이 조사인가?
 * 가장 긴 조사부터 매칭 시도, 조사 다음이 비-한글(공백·구두점·끝)이어야 진짜 조사.
 */
function isParticleStart(text: string, fromIndex: number): boolean {
  if (!isKoreanHangul(text[fromIndex] || '')) return false;
  for (const p of KOREAN_PARTICLES) {
    if (text.startsWith(p, fromIndex)) {
      const afterParticle = text[fromIndex + p.length] || '';
      if (!afterParticle || !isKoreanHangul(afterParticle)) return true;
    }
  }
  return false;
}

/**
 * optional 재료 1개 → 매칭 후보 문자열 목록 (재료명 + 동의어).
 * 길이 내림차순 — 긴 매칭 먼저 시도 (대파 우선, 파 나중).
 *
 * 1글자 *동의어*는 제외 — "파"(대파 동의어) 같은 1글자 form 이 합성어
 * ("파고명", "파전" 등) 에서 false positive 유발. 작성자가 일관되게 동의어
 * 풀텍스트 ("대파") 적을 가능성 높음. 1글자 *원본 재료명* (쌀·콩 등) 은 유지.
 */
function buildCandidates(name: string): string[] {
  const lower = name.toLowerCase();
  const aliases = INGREDIENT_ALIASES[lower] ?? [];
  const safeAliases = aliases.filter(a => a.length >= 2);
  const all = new Set<string>([name, ...safeAliases]);
  return Array.from(all).sort((a, b) => b.length - a.length);
}

interface MatchAttempt {
  start: number;
  matchLen: number;
  ingredient: OptionalIngredient;
}

/**
 * `text` 의 `cursor` 위치 이후에서 가장 가까운 매칭을 찾는다.
 * 동률(같은 start)이면 가장 긴 매칭 우선.
 */
function findNextMatch(
  text: string,
  cursor: number,
  candidates: Array<{ form: string; ingredient: OptionalIngredient }>
): MatchAttempt | null {
  let best: MatchAttempt | null = null;

  for (const { form, ingredient } of candidates) {
    let searchFrom = cursor;
    while (searchFrom < text.length) {
      const idx = text.indexOf(form, searchFrom);
      if (idx === -1) break;

      // best 보다 멀면 이 form 으로는 더 가까운 매칭 없음 — 다음 form 으로
      if (best && idx > best.start) break;

      // word boundary 검사
      const prev = idx > 0 ? text[idx - 1] : '';
      const nextStart = idx + form.length;
      const next = text[nextStart] || '';

      const prevIsHangul = isKoreanHangul(prev);
      const nextIsHangul = isKoreanHangul(next);
      const nextIsParticle = nextIsHangul && isParticleStart(text, nextStart);

      // 앞이 한글이면 다른 단어의 일부일 가능성 — skip
      // 뒤가 한글이고 조사 아니면 다른 단어의 시작 — skip
      if (prevIsHangul || (nextIsHangul && !nextIsParticle)) {
        searchFrom = idx + 1;
        continue;
      }

      // 매칭 후보 — best 갱신
      if (!best || idx < best.start || (idx === best.start && form.length > best.matchLen)) {
        best = { start: idx, matchLen: form.length, ingredient };
      }
      break; // 이 form 으로 더 검색해도 best 갱신 못 함 (start 만 증가)
    }
  }

  return best;
}

/**
 * 메인 — 본문 텍스트를 토큰 배열로 변환.
 *
 * @param text 조리 단계 본문
 * @param optionalIngredients `is_optional=true` 인 재료 (substitutes 포함)
 * @param alreadyMentioned 이전 단계에서 이미 멘션된 재료 이름 Set (호출자가 단계 간 공유). 호출 시 본 단계 멘션도 추가됨 (mutation)
 */
export function tokenizeStepText(
  text: string,
  optionalIngredients: OptionalIngredient[],
  alreadyMentioned: Set<string>
): HighlightToken[] {
  if (!text) return [];
  if (optionalIngredients.length === 0) return [{ type: 'text', value: text }];

  // 모든 재료의 모든 후보 form 펼치기
  const candidates: Array<{ form: string; ingredient: OptionalIngredient }> = [];
  for (const ing of optionalIngredients) {
    for (const form of buildCandidates(ing.name)) {
      candidates.push({ form, ingredient: ing });
    }
  }

  const tokens: HighlightToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const match = findNextMatch(text, cursor, candidates);
    if (!match) {
      tokens.push({ type: 'text', value: text.slice(cursor) });
      break;
    }

    // match 직전까지 일반 텍스트
    if (match.start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, match.start) });
    }

    const matchedText = text.slice(match.start, match.start + match.matchLen);
    const isFirstMention = !alreadyMentioned.has(match.ingredient.name);
    if (isFirstMention) alreadyMentioned.add(match.ingredient.name);

    tokens.push({
      type: 'optional',
      matchedText,
      ingredientName: match.ingredient.name,
      isFirstMention,
      substitutes: match.ingredient.substitutes,
    });

    cursor = match.start + match.matchLen;
  }

  return tokens;
}
