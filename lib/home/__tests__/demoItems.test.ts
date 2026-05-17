import { describe, it, expect } from 'vitest';
import { DEMO } from '@/app/[lang]/_home/demoItems';

describe('DEMO items', () => {
  it('모든 데모 재료는 emoji 필드를 가져야 한다 (정적 파일 없이도 이모지 표시 가능)', () => {
    for (const item of DEMO) {
      expect(item.emoji, `"${item.ingredient_name}"에 emoji가 없음`).toBeTruthy();
    }
  });

  it('각 데모 재료의 이모지가 예상값과 일치한다', () => {
    const expected: Record<string, string> = {
      닭고기: '🍗', 버터: '🧈', 계란: '🥚', 토마토: '🍅', 당근: '🥕',
      마늘: '🧄', 양배추: '🥬', 버섯: '🍄', 새우: '🦐', 소고기: '🥩',
      감자: '🥔', 양파: '🧅', 밀가루: '🌾', 쌀: '🍚', 파스타: '🍝',
      올리브유: '🧴', 꿀: '🍯', 식용유: '🧴', 소금: '🧂', 후추: '🌶️',
    };
    for (const item of DEMO) {
      if (expected[item.ingredient_name]) {
        expect(item.emoji).toBe(expected[item.ingredient_name]);
      }
    }
  });
});
