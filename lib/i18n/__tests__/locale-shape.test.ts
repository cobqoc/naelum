import { describe, it, expect } from 'vitest';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { ja } from '../locales/ja';
import { zh } from '../locales/zh';
import { es } from '../locales/es';
import { fr } from '../locales/fr';
import { de } from '../locales/de';
import { it as itLocale } from '../locales/it';

/**
 * 8개 locale이 동일한 key shape인지 런타임으로 검증한다.
 *
 * 왜 런타임 테스트가 필요한가:
 *  - TranslationKeys = typeof ko 로 타입을 강제하지만,
 *    locales/index.ts 의 loadLocale 이 `(await import('./en')).en as TranslationKeys`
 *    처럼 **명시적 as 캐스트**를 한다. 이 캐스트가 구조 불일치를 통째로 삼킨다 —
 *    en.ts 에서 키가 빠지거나 string↔object 가 어긋나도 빌드는 통과한다.
 *  - 새 키 추가 시 "8개 locale 모두 동시 추가"가 규칙(CLAUDE.md)이지만 사람 규율이다.
 *    이 테스트가 그 규율을 파이프라인으로 박는다(AI가 일부 locale만 건드려도 회귀로 잡힘).
 *
 * ko 를 정본(canonical)으로 두고 나머지 7개를 대조한다.
 */

type Locale = Record<string, unknown>;

/**
 * 중첩 객체를 `a.b.c` → 'string' | 'object' 맵으로 평탄화.
 * leaf 의 종류(문자열 vs 분기)까지 기록해 구조 타입 어긋남도 잡는다.
 */
function shapeOf(obj: Locale, prefix = ''): Map<string, 'string' | 'object'> {
  const out = new Map<string, 'string' | 'object'>();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.set(path, 'object');
      for (const [k, v] of shapeOf(value as Locale, path)) out.set(k, v);
    } else {
      out.set(path, 'string');
    }
  }
  return out;
}

const LOCALES: Record<string, Locale> = { en, ja, zh, es, fr, de, it: itLocale };
const koShape = shapeOf(ko as Locale);
const koPaths = [...koShape.keys()].sort();

/**
 * 의도적으로 비어 있는 leaf 화이트리스트.
 *
 * 한국어·일본어는 문법상 숫자/명사 뒤에 조사·단위·동사가 붙는다
 * (예: 평점 "4.5점", 수량 "3개", SOV 후치 동사 " 찾아줘요").
 * 영어 등 서구권은 이런 접사가 없어 빈 문자열이 **정답**이다.
 * → 빈 문자열 = 미번역 버그라는 일반 규칙의 정당한 예외. 새 접사 키 추가 시 여기 등재.
 */
const INTENTIONALLY_EMPTY = new Set<string>([
  'profile.ratingSuffix',
  'quickAdd.countSuffix',
  'home.demoTaglinePost',
  'ingredient.countSuffixLabel',
]);

describe('i18n locale shape (ko 정본 대조)', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    describe(lang, () => {
      const shape = shapeOf(locale);
      const paths = [...shape.keys()].sort();

      it(`${lang}: ko 에 없는 잉여 키가 없다`, () => {
        const extra = paths.filter((p) => !koShape.has(p));
        expect(extra, `${lang} 에만 있는 키: ${extra.join(', ')}`).toEqual([]);
      });

      it(`${lang}: ko 의 모든 키를 빠짐없이 가진다`, () => {
        const missing = koPaths.filter((p) => !shape.has(p));
        expect(missing, `${lang} 에 누락된 키: ${missing.join(', ')}`).toEqual([]);
      });

      it(`${lang}: 모든 경로에서 string↔object 구조가 ko 와 일치한다`, () => {
        const mismatched = koPaths
          .filter((p) => shape.has(p) && shape.get(p) !== koShape.get(p))
          .map((p) => `${p} (ko=${koShape.get(p)}, ${lang}=${shape.get(p)})`);
        expect(mismatched, `구조 불일치: ${mismatched.join('; ')}`).toEqual([]);
      });

      it(`${lang}: 빈 문자열 번역이 없다 (존재하지만 미번역인 leaf)`, () => {
        const empty: string[] = [];
        for (const [path, kind] of shape) {
          if (kind !== 'string') continue;
          if (INTENTIONALLY_EMPTY.has(path)) continue;
          const segs = path.split('.');
          let cur: unknown = locale;
          for (const s of segs) cur = (cur as Locale)[s];
          if (typeof cur === 'string' && cur.trim() === '') empty.push(path);
        }
        expect(empty, `${lang} 빈 번역: ${empty.join(', ')}`).toEqual([]);
      });
    });
  }

  it('ko 정본 키 개수 회귀 가드 (구조 급변 감지)', () => {
    // 키가 통째로 사라지는 사고(예: 잘못된 머지)를 잡는 하한선.
    // 정상적인 키 추가/삭제 시 이 숫자를 함께 갱신한다.
    expect(koPaths.length).toBeGreaterThan(1000);
  });
});
