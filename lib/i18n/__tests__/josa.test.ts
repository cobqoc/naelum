import { describe, it, expect } from 'vitest';
import { subjectParticle } from '../josa';

describe('subjectParticle — 주격 조사 이/가', () => {
  it('받침 있으면 이', () => {
    expect(subjectParticle('쌀')).toBe('이');   // ㄹ
    expect(subjectParticle('당근')).toBe('이'); // ㄴ
    expect(subjectParticle('밥')).toBe('이');   // ㅂ
    expect(subjectParticle('양배추 덮밥')).toBe('이'); // 끝 글자 밥
  });
  it('받침 없으면 가', () => {
    expect(subjectParticle('사과')).toBe('가');
    expect(subjectParticle('양파')).toBe('가');
    expect(subjectParticle('김치')).toBe('가');
    expect(subjectParticle('감자')).toBe('가');
  });
  it('비한글/빈값은 가로 폴백', () => {
    expect(subjectParticle('tofu')).toBe('가');
    expect(subjectParticle('')).toBe('가');
  });
});
