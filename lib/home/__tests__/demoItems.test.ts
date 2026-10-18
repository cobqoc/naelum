import { describe, it, expect } from 'vitest';
import { DEMO } from '@/app/[lang]/_home/demoItems';

describe('DEMO items', () => {
  it('모든 데모 재료는 emoji 필드를 가져야 한다 (정적 파일 없이도 이모지 표시 가능)', () => {
    for (const item of DEMO) {
      expect(item.emoji, `"${item.ingredient_name}"에 emoji가 없음`).toBeTruthy();
    }
  });

  // v5 데모 세트(21종 — 냉동 소고기→삼겹살 교체 + 만두 추가, _home/constants LS_KEY_DEMO_ITEMS v5)와 1:1.
  // 옛 맵은 소고기(현 세트에 없음)를 기대하고 삼겹살·만두는 없어 `if` 로 조용히 건너뛰었다(PHR-42, 2026-10-04).
  const expected: Record<string, string> = {
    닭고기: '🍗', 버터: '🧈', 계란: '🥚', 토마토: '🍅', 당근: '🥕',
    마늘: '🧄', 양배추: '🥬', 버섯: '🍄', 새우: '🦐', 삼겹살: '🥓', 만두: '🥟',
    감자: '🥔', 양파: '🧅', 밀가루: '🌾', 쌀: '🍚', 파스타: '🍝',
    올리브유: '🧴', 꿀: '🍯', 식용유: '🧴', 소금: '🧂', 후추: '🌶️',
  };

  it('기대 이모지 맵이 DEMO 세트와 정확히 같은 재료를 덮는다(누락·잉여 없음)', () => {
    expect(DEMO.map(item => item.ingredient_name).sort()).toEqual(Object.keys(expected).sort());
  });

  it('각 데모 재료의 이모지가 예상값과 일치한다', () => {
    for (const item of DEMO) {
      expect(item.emoji, item.ingredient_name).toBe(expected[item.ingredient_name]);
    }
  });
});
