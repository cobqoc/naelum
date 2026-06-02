import { describe, it, expect } from 'vitest';
import { swapLangSegment } from '../localizePath';

describe('swapLangSegment — 언어 스위처 경로 교체', () => {
  it('[lang] 세그먼트만 교체', () => {
    expect(swapLangSegment('/ko/recipes', '', 'en')).toBe('/en/recipes');
    expect(swapLangSegment('/en/recipes/123', '', 'ko')).toBe('/ko/recipes/123');
  });

  it('홈(/ko) 교체', () => {
    expect(swapLangSegment('/ko', '', 'en')).toBe('/en');
  });

  it('★ query·hash 보존 (언어 전환 시 필터·검색어 유지 — 2026-06-03 회귀 가드)', () => {
    expect(swapLangSegment('/ko/recipes', '?tab=ingredient&ingredients=%EC%8C%80&mode=all', 'en'))
      .toBe('/en/recipes?tab=ingredient&ingredients=%EC%8C%80&mode=all');
    expect(swapLangSegment('/ko/search', '?q=kimchi#top', 'ja'))
      .toBe('/ja/search?q=kimchi#top');
  });

  it('첫 세그먼트가 지원 언어 아니면 null(이동 안 함)', () => {
    expect(swapLangSegment('/', '', 'en')).toBeNull();
    expect(swapLangSegment('/notalang/x', '', 'en')).toBeNull();
    expect(swapLangSegment('', '', 'en')).toBeNull();
  });
});
