import { describe, it, expect } from 'vitest';
import {
  containsBadWords,
  getDetectedBadWords,
  sanitizeText,
  validateIngredientName,
} from '../badWordsFilter';

// 욕설/스팸 필터 + obfuscation(@→a, 0→o 등) 우회 탐지.
// 사용자 보호 함수라 정확도가 중요. 현재 동작(한계 포함)을 고정한다.

describe('containsBadWords', () => {
  it('정상 재료명은 false', () => {
    expect(containsBadWords('토마토')).toBe(false);
    expect(containsBadWords('양파')).toBe(false);
    expect(containsBadWords('올리브유')).toBe(false);
  });

  it('직접 욕설은 true', () => {
    expect(containsBadWords('시발')).toBe(true);
    expect(containsBadWords('this is shit')).toBe(true);
  });

  it('obfuscation 우회 탐지: 숫자/기호 치환', () => {
    expect(containsBadWords('sh1t')).toBe(true); // 1→i
    expect(containsBadWords('$ex')).toBe(true); // $→s
    expect(containsBadWords('p0rn')).toBe(true); // 0→o
  });

  it('공백/하이픈 제거 후 탐지', () => {
    expect(containsBadWords('f u c k')).toBe(true);
  });

  it('알려진 한계: 정상 텍스트 오탐 (회귀 감지용 고정)', () => {
    // BAD_WORDS 에 "년"이 있고 normalizeText 가 4→a,0→o 치환을 하므로
    // "2024년" 같은 정상 텍스트가 차단된다. 이는 현 구현의 알려진 약점이다.
    // 개선 시 이 단언이 깨지며 "의도된 변경"임을 알린다 (정상 동작).
    expect(containsBadWords('2024년')).toBe(true);
  });
});

describe('getDetectedBadWords', () => {
  it('검출된 욕설 목록 반환', () => {
    const detected = getDetectedBadWords('시발놈');
    expect(detected).toContain('시발');
    expect(detected).toContain('놈');
  });

  it('정상 텍스트는 빈 배열', () => {
    expect(getDetectedBadWords('토마토')).toEqual([]);
  });
});

describe('sanitizeText', () => {
  it('욕설을 ***로 치환', () => {
    expect(sanitizeText('시발')).toBe('***');
    expect(sanitizeText('this is shit')).toBe('this is ***');
  });

  it('정상 텍스트는 그대로', () => {
    expect(sanitizeText('토마토')).toBe('토마토');
  });
});

describe('validateIngredientName', () => {
  it('정상 재료명 → valid', () => {
    expect(validateIngredientName('토마토')).toEqual({ valid: true });
  });

  it('욕설 → invalid + 한국어 에러 메시지', () => {
    const r = validateIngredientName('시발');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('부적절');
  });
});
