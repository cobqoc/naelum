/**
 * 식약처 알레르기 유발 표시 22품목 (한국 표준).
 *
 * V2 매칭 (2026-05-29): 재료 마스터의 `allergens` 컬럼은 *이 표준 키* 만 저장한다.
 * 사용자 알레르기 등록도 이 22품목 체크박스로 받음 → 표기 다양성(땅콩/peanut/피넛)은
 * 사용자 입력 단계에서 *표준 키로 통일*. 매칭은 exact key 비교.
 *
 * 안전 critical — 새 재료 등록 시 자동 추정 + 어드민 검수 필수.
 */

export interface AllergenSpec {
  key: string;       // ingredients_master.allergens 에 저장될 표준 키
  label: string;     // 한국어 UI 라벨
  emoji?: string;
}

export const ALLERGEN_22: AllergenSpec[] = [
  { key: '난류', label: '난류 (알류)', emoji: '🥚' },
  { key: '우유', label: '우유', emoji: '🥛' },
  { key: '메밀', label: '메밀', emoji: '🌾' },
  { key: '땅콩', label: '땅콩', emoji: '🥜' },
  { key: '대두', label: '대두', emoji: '🫘' },
  { key: '밀', label: '밀', emoji: '🌾' },
  { key: '고등어', label: '고등어', emoji: '🐟' },
  { key: '게', label: '게', emoji: '🦀' },
  { key: '새우', label: '새우', emoji: '🦐' },
  { key: '돼지고기', label: '돼지고기', emoji: '🐖' },
  { key: '복숭아', label: '복숭아', emoji: '🍑' },
  { key: '토마토', label: '토마토', emoji: '🍅' },
  { key: '아황산류', label: '아황산류' },
  { key: '호두', label: '호두', emoji: '🌰' },
  { key: '닭고기', label: '닭고기', emoji: '🐓' },
  { key: '쇠고기', label: '쇠고기', emoji: '🥩' },
  { key: '오징어', label: '오징어', emoji: '🦑' },
  { key: '조개류', label: '조개류 (전복·홍합 포함)', emoji: '🐚' },
  { key: '잣', label: '잣' },
  { key: '아몬드', label: '아몬드' },
  { key: '캐슈넛', label: '캐슈넛' },
  { key: '연어', label: '연어', emoji: '🐟' },
];

export const ALLERGEN_KEYS: string[] = ALLERGEN_22.map(a => a.key);
export const ALLERGEN_KEY_SET = new Set(ALLERGEN_KEYS);

/**
 * 재료 이름에서 알레르겐 자동 추정 (substring 매칭).
 * 어드민 검수 전 *기본값 제안* 용. 사용자가 다이얼로그에서 확인·수정.
 * 안전 critical 이라 보수적 — 의심되면 제안.
 */
export function suggestAllergens(ingredientName: string): string[] {
  const lower = ingredientName.trim().toLowerCase();
  if (!lower) return [];

  const suggested = new Set<string>();
  for (const spec of ALLERGEN_22) {
    if (lower.includes(spec.key)) suggested.add(spec.key);
  }

  // 추가 키워드 — 식약처 표준 외 일상 표기
  const extras: Array<[string[], string]> = [
    [['계란', '달걀', 'egg', '에그', '노른자', '흰자', '메추리알', '오리알'], '난류'],
    [['milk', '밀크', '치즈', '버터', '요거트', '생크림', '크림', '연유'], '우유'],
    [['peanut', '피넛'], '땅콩'],
    [['soy', 'soybean', '콩', '두부', '두유', '간장', '된장', '고추장'], '대두'],
    [['wheat', '밀가루', '강력분', '박력분', '중력분', '글루텐'], '밀'],
    [['shrimp', 'prawn', '쉬림프'], '새우'],
    [['crab', '꽃게', '게살'], '게'],
    [['squid', '오징어채'], '오징어'],
    [['salmon'], '연어'],
    [['mackerel'], '고등어'],
    [['peach'], '복숭아'],
    [['tomato', '방울토마토', '케첩', '토마토소스'], '토마토'],
    [['pork', '삼겹살', '베이컨', '햄', '소시지', '스팸'], '돼지고기'],
    [['beef', '한우', '안심', '등심', '쇠고기', '소고기'], '쇠고기'],
    [['chicken', '치킨', '닭', '닭살', '닭가슴살', '닭다리'], '닭고기'],
    [['walnut'], '호두'],
    [['almond'], '아몬드'],
    [['cashew', '캐슈'], '캐슈넛'],
    [['pine nut'], '잣'],
    [['buckwheat'], '메밀'],
    [['shellfish', 'clam', '바지락', '모시조개', '홍합', '대합', '전복', '굴'], '조개류'],
    [['와인', 'wine', '포도주', '건포도'], '아황산류'],
  ];
  for (const [keywords, key] of extras) {
    if (keywords.some(k => lower.includes(k))) suggested.add(key);
  }

  return Array.from(suggested);
}
