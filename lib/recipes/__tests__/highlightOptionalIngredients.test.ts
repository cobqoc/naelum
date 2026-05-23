import { describe, expect, it } from 'vitest';
import { tokenizeStepText, type OptionalIngredient } from '@/lib/recipes/highlightOptionalIngredients';

const cheong: OptionalIngredient = { name: '청양고추' };
const daepa: OptionalIngredient = { name: '대파' };
const garlic: OptionalIngredient = { name: '마늘' };

describe('tokenizeStepText — 기본 매칭', () => {
  it('optional 재료 없으면 원본 그대로', () => {
    expect(tokenizeStepText('양배추는 한입 크기로 잘라주세요.', [], new Set())).toEqual([
      { type: 'text', value: '양배추는 한입 크기로 잘라주세요.' },
    ]);
  });

  it('본문이 비어있으면 빈 배열', () => {
    expect(tokenizeStepText('', [cheong], new Set())).toEqual([]);
  });

  it('첫 멘션 — optional 토큰 + isFirstMention=true', () => {
    const seen = new Set<string>();
    const tokens = tokenizeStepText('청양고추를 어슷썰어 주세요.', [cheong], seen);
    expect(tokens).toEqual([
      { type: 'optional', matchedText: '청양고추', ingredientName: '청양고추', isFirstMention: true, substitutes: undefined },
      { type: 'text', value: '를 어슷썰어 주세요.' },
    ]);
    expect(seen.has('청양고추')).toBe(true);
  });

  it('이후 멘션 — isFirstMention=false (alreadyMentioned 공유)', () => {
    const seen = new Set<string>(['청양고추']);
    const tokens = tokenizeStepText('청양고추는 한 번 더 볶아주세요.', [cheong], seen);
    const optionalToken = tokens.find(t => t.type === 'optional');
    expect(optionalToken).toMatchObject({ ingredientName: '청양고추', isFirstMention: false });
  });
});

describe('tokenizeStepText — 한국어 조사', () => {
  it.each([
    ['청양고추를 더하시려면', '를'],
    ['청양고추는 송송 썰어', '는'],
    ['청양고추가 매콤하게', '가'],
    ['청양고추에 양념을', '에'],
    ['청양고추로 풍미를', '로'],
    ['청양고추와 마늘을', '와'],
    ['청양고추까지 넣어주세요', '까지'],
  ])('"%s" — 조사 "%s" 인식', (text) => {
    const tokens = tokenizeStepText(text, [cheong], new Set());
    expect(tokens[0]).toMatchObject({ type: 'optional', matchedText: '청양고추' });
  });
});

describe('tokenizeStepText — 부분문자열 오매칭 차단', () => {
  it('"고추장" 본문 + "고추" optional → 매칭 안 됨 (뒤 글자 "장" 이 조사 아님)', () => {
    const tokens = tokenizeStepText('고추장 1큰술 넣고', [{ name: '고추' }], new Set());
    expect(tokens.every(t => t.type === 'text')).toBe(true);
  });

  it('"양배추" 본문 + "배추" optional → 매칭 안 됨 (앞 글자 "양" 이 한글)', () => {
    const tokens = tokenizeStepText('양배추는 큼직하게', [{ name: '배추' }], new Set());
    expect(tokens.every(t => t.type === 'text')).toBe(true);
  });
});

describe('tokenizeStepText — 동의어 매칭', () => {
  it('"대파" optional → 본문 "파" 단독은 매칭 안 됨 (1글자 동의어 합성어 false positive 차단)', () => {
    // 2026-05-24 fix: "파" 같은 1글자 동의어는 합성어("파고명"·"파전" 등) 에서
    // false positive 유발해 후보에서 제외. 작성자가 일관되게 "대파" 풀텍스트 적을 가능성 높음.
    const tokens = tokenizeStepText('파를 송송 썰어주세요.', [daepa], new Set());
    expect(tokens.every(t => t.type === 'text')).toBe(true);
  });

  it('"대파" optional → 본문 "대파" 는 매칭 (원본 form 유지)', () => {
    const tokens = tokenizeStepText('대파를 송송 썰어주세요.', [daepa], new Set());
    const optionalToken = tokens.find(t => t.type === 'optional');
    expect(optionalToken).toMatchObject({ matchedText: '대파', ingredientName: '대파' });
  });

  it('"마늘" optional → 본문 "다진마늘" 매칭 (alias)', () => {
    const tokens = tokenizeStepText('다진마늘 1큰술 넣고', [garlic], new Set());
    const optionalToken = tokens.find(t => t.type === 'optional');
    expect(optionalToken).toMatchObject({ matchedText: '다진마늘', ingredientName: '마늘' });
  });

  it('긴 동의어 우선 — "대파"가 본문에 있으면 "파"가 아닌 "대파" 매칭', () => {
    const tokens = tokenizeStepText('대파를 어슷썰어', [daepa], new Set());
    const optionalToken = tokens.find(t => t.type === 'optional');
    expect(optionalToken).toMatchObject({ matchedText: '대파', ingredientName: '대파' });
  });
});

describe('tokenizeStepText — 여러 재료/멘션', () => {
  it('한 단계 안 여러 재료 → 각각 토큰화', () => {
    const tokens = tokenizeStepText(
      '마늘은 편으로 썰고 청양고추는 어슷썰어 주세요.',
      [garlic, cheong],
      new Set()
    );
    const optionals = tokens.filter(t => t.type === 'optional');
    expect(optionals).toHaveLength(2);
    expect(optionals.map(t => 'ingredientName' in t ? t.ingredientName : '')).toEqual(['마늘', '청양고추']);
  });

  it('같은 재료 같은 단계 안 두 번 — 둘 다 optional 토큰, 첫 번째만 isFirstMention=true', () => {
    const tokens = tokenizeStepText(
      '청양고추는 어슷썰고, 청양고추 매운 향이 올라오면',
      [cheong],
      new Set()
    );
    const optionals = tokens.filter(t => t.type === 'optional');
    expect(optionals).toHaveLength(2);
    expect((optionals[0] as { isFirstMention: boolean }).isFirstMention).toBe(true);
    expect((optionals[1] as { isFirstMention: boolean }).isFirstMention).toBe(false);
  });
});

describe('tokenizeStepText — substitutes 전달', () => {
  it('substitutes 가 토큰에 포함', () => {
    const ing: OptionalIngredient = { name: '청양고추', substitutes: ['페페론치노', '풋고추'] };
    const tokens = tokenizeStepText('청양고추를 넣어주세요', [ing], new Set());
    const optionalToken = tokens.find(t => t.type === 'optional');
    expect(optionalToken).toMatchObject({ substitutes: ['페페론치노', '풋고추'] });
  });
});
