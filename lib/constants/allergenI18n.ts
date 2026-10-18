import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 식약처 22품목 알레르겐 *표준 키*(lib/constants/allergens.ts `ALLERGEN_22[].key` — DB `ingredients_master.allergens`
 * 저장값) → `t.ingredient` 번역 키 이름 매핑. 표시만 로케일별로 바꾸고, DB 값(표준 키)은 한글 그대로 둔다
 * (CLAUDE.md "DB 저장 값은 한글 유지"). ICL-02, 2026-10-04 — 재료 등록 다이얼로그가 비한국어 로케일에도
 * 한국어 라벨을 그대로 보여주던 것을 번역 경유로.
 *
 * - `label`: 칩 표시용. ko 값 = ALLERGEN_22 의 한국어 `label` 과 같다(예: '난류 (알류)').
 * - `short`: "이름 기반 자동 제안" 문장용 — 원래 표준 키를 그대로 보여주던 자리라 ko 값 = 표준 키(예: '난류').
 * 두 등식은 lib/constants/__tests__/allergenI18n.test.ts 가 고정한다(allergens.ts 가 바뀌면 테스트가 깨진다).
 */
export type AllergenI18nKey = Extract<keyof TranslationKeys['ingredient'], `allergen${string}`>;

export const ALLERGEN_I18N_KEYS: Readonly<Record<string, { label: AllergenI18nKey; short: AllergenI18nKey }>> = {
  '난류': { label: 'allergenEgg', short: 'allergenEggShort' },
  '우유': { label: 'allergenMilk', short: 'allergenMilk' },
  '메밀': { label: 'allergenBuckwheat', short: 'allergenBuckwheat' },
  '땅콩': { label: 'allergenPeanut', short: 'allergenPeanut' },
  '대두': { label: 'allergenSoybean', short: 'allergenSoybean' },
  '밀': { label: 'allergenWheat', short: 'allergenWheat' },
  '고등어': { label: 'allergenMackerel', short: 'allergenMackerel' },
  '게': { label: 'allergenCrab', short: 'allergenCrab' },
  '새우': { label: 'allergenShrimp', short: 'allergenShrimp' },
  '돼지고기': { label: 'allergenPork', short: 'allergenPork' },
  '복숭아': { label: 'allergenPeach', short: 'allergenPeach' },
  '토마토': { label: 'allergenTomato', short: 'allergenTomato' },
  '아황산류': { label: 'allergenSulfite', short: 'allergenSulfite' },
  '호두': { label: 'allergenWalnut', short: 'allergenWalnut' },
  '닭고기': { label: 'allergenChicken', short: 'allergenChicken' },
  '쇠고기': { label: 'allergenBeef', short: 'allergenBeef' },
  '오징어': { label: 'allergenSquid', short: 'allergenSquid' },
  '조개류': { label: 'allergenShellfish', short: 'allergenShellfishShort' },
  '잣': { label: 'allergenPineNut', short: 'allergenPineNut' },
  '아몬드': { label: 'allergenAlmond', short: 'allergenAlmond' },
  '캐슈넛': { label: 'allergenCashew', short: 'allergenCashew' },
  '연어': { label: 'allergenSalmon', short: 'allergenSalmon' },
};
