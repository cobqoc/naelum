import { describe, it, expect } from 'vitest';
import { ALLERGEN_22 } from '@/lib/constants/allergens';
import { ALLERGEN_I18N_KEYS } from '@/lib/constants/allergenI18n';
import { loadLocale, SUPPORTED_LANGUAGES } from '@/lib/i18n/locales';
import { ko } from '@/lib/i18n/locales/ko';

// ICL-02 (2026-10-04): 재료 등록 다이얼로그의 알레르겐 표시를 번역 경유로 바꾸면서 ko 화면 출력이
// 이전과 바이트 단위로 같아야 한다 — 칩 = ALLERGEN_22 label, 자동 제안 문장 = 표준 키.
describe('ALLERGEN_I18N_KEYS — 식약처 22품목 표준 키 ↔ 번역 키', () => {
  it('ALLERGEN_22 의 모든 표준 키를 빠짐없이(또 남김없이) 덮는다', () => {
    expect(Object.keys(ALLERGEN_I18N_KEYS).sort()).toEqual(ALLERGEN_22.map(a => a.key).sort());
  });

  it('ko: label 번역 = ALLERGEN_22 의 한국어 label, short 번역 = 표준 키 (표시 출력 불변)', () => {
    for (const a of ALLERGEN_22) {
      const k = ALLERGEN_I18N_KEYS[a.key];
      expect(ko.ingredient[k.label]).toBe(a.label);
      expect(ko.ingredient[k.short]).toBe(a.key);
    }
  });

  it('모든 로케일에 값이 있고, 비한국어 로케일엔 한글이 남지 않는다', async () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const t = await loadLocale(lang);
      for (const a of ALLERGEN_22) {
        const k = ALLERGEN_I18N_KEYS[a.key];
        for (const key of [k.label, k.short]) {
          const v = t.ingredient[key];
          expect(typeof v === 'string' && v.trim().length > 0, `${lang}.ingredient.${key}`).toBe(true);
          if (lang !== 'ko') expect(/[가-힣]/.test(v), `${lang}.ingredient.${key}=${v}`).toBe(false);
        }
      }
    }
  });
});
