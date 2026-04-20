/**
 * 재료명 → 기본 저장 위치 큐레이션 맵.
 * 자주 쓰는 한식 재료 200여개에 대한 전문가 큐레이션.
 *
 * 우선순위 체인 (사용처: inferStorageLocation):
 *   1. 정확 일치 (STORAGE_MAP에 동일 이름)
 *   2. 부분 포함 (STORAGE_MAP 키를 재료명이 포함, 또는 반대)
 *   3. 카테고리 fallback (meat→냉장, veggie→상온 등)
 *   4. '기타'
 *
 * 향후 학습 시스템이 이 맵을 동적으로 확장할 수 있음
 * (ingredients_master.default_storage 컬럼 + 유저 투표 집계).
 */

export type StorageLocation = '냉장' | '냉동' | '상온';

// ── 상온 (pantry) ─────────────────────────────────────────────
const ROOM_TEMP: string[] = [
  // 야채 (뿌리/구근 위주)
  '감자', '고구마', '양파', '마늘', '생강', '대파', '쪽파', '실파', '파',
  // 곡류·가루
  '쌀', '백미', '현미', '찹쌀', '흑미', '잡곡', '보리', '밀가루', '부침가루',
  '튀김가루', '빵가루', '전분', '감자전분', '옥수수가루',
  // 면류
  '라면', '국수', '소면', '중면', '당면', '파스타', '스파게티', '우동면',
  // 양념·조미료 (개봉 전 기본)
  '간장', '진간장', '국간장', '양조간장',
  '설탕', '백설탕', '흑설탕', '올리고당', '물엿', '조청',
  '소금', '천일염', '꽃소금', '맛소금',
  // 식초·꿀 류는 FRIDGE 리스트로 이동됨 (도어 선반 보관 권장)
  '참기름', '들기름', '올리브유', '식용유', '카놀라유', '포도씨유', '해바라기유',
  '후추', '후춧가루', '통후추',
  '고춧가루', '깨', '참깨', '깨소금', '통깨', '들깨',
  '굴소스', '케첩', '마요네즈', '머스타드',
  '청주', '맛술', '미림',
  // 건어물·통조림
  '김', '미역', '다시마', '멸치', '건새우', '황태', '북어',
  '참치캔', '참치', '꽁치캔', '고등어캔', '스팸', '옥수수캔', '콩나물캔',
  // 과일 (상온 보관 위주)
  '사과', '배', '귤', '오렌지', '레몬', '라임', '바나나', '감', '복숭아',
  '자두', '체리토마토',
  // 기타 staple — 꿀류도 FRIDGE 리스트로 이동
  '물', '생수', '메이플시럽', '이유식',
];

// ── 냉장 (fridge) ─────────────────────────────────────────────
const FRIDGE: string[] = [
  // 육류 (신선)
  '돼지고기', '삼겹살', '목살', '등심', '앞다리', '뒷다리', '갈비', '다짐육',
  '소고기', '쇠고기', '한우', '불고기', '차돌박이', '사태', '안심',
  '닭고기', '닭', '닭가슴살', '닭다리', '닭날개', '닭안심',
  '오리고기', '양고기', '염소',
  '베이컨', '소시지', '햄', '비엔나',
  // 해산물 (생)
  '생선', '고등어', '삼치', '꽁치', '갈치', '조기', '명태', '코다리', '동태',
  '연어', '광어', '도미', '참치',
  '오징어', '꼴뚜기', '주꾸미', '낙지', '문어',
  '조개', '바지락', '홍합', '굴', '전복',
  // 달걀/유제품
  '계란', '달걀', '메추리알',
  '우유', '두유', '아몬드밀크', '오트밀크',
  '버터', '치즈', '슬라이스치즈', '체다치즈', '모짜렐라', '크림치즈',
  '요거트', '요구르트', '생크림', '휘핑크림', '연유',
  // 야채 (잎·엽채류·습기 보관)
  '시금치', '상추', '청상추', '적상추', '로메인', '깻잎', '부추', '케일',
  '배추', '얼갈이', '청경채', '쑥갓', '미나리',
  '당근', '무', '순무',
  '양배추', '양상추', '브로콜리', '콜리플라워', '샐러리', '아스파라거스',
  '파프리카', '피망', '고추', '청양고추', '홍고추', '꽈리고추',
  '버섯', '표고버섯', '느타리버섯', '새송이버섯', '팽이버섯', '양송이버섯',
  '애호박', '호박', '단호박', '가지', '오이', '토마토', '방울토마토',
  '콩나물', '숙주',
  // 과일 (냉장 선호)
  '딸기', '블루베리', '라즈베리', '포도', '수박', '참외', '멜론', '키위', '파인애플',
  // 한식 staple
  '두부', '순두부', '연두부', '부침두부',
  '김치', '배추김치', '열무김치', '깍두기', '총각김치', '파김치',
  '된장', '쌈장', '고추장', // 개봉 후 냉장 권장
  // 반찬·소스 (개봉 후)
  '드레싱', '샐러드드레싱', '다진마늘',
  // 음료
  '주스', '탄산수', '식혜', '수정과',
  // 작은 병 양념·소스 (개봉 후 냉장 권장 — 도어 선반 보관)
  '식초', '현미식초', '사과식초', '감식초',
  '꿀', '잼', '시럽', '메이플시럽',
];

// ── 냉동 (freezer) ───────────────────────────────────────────
const FREEZER: string[] = [
  '만두', '군만두', '물만두',
  '떡', '가래떡', '떡국떡',
  '아이스크림', '얼음',
  '냉동만두', '냉동새우', '냉동채소', '냉동고기', '냉동생선',
  '새우', // 대부분 냉동 유통
  '핫도그', '피자',
];

// ── 빠른 lookup을 위한 Set 변환 ───────────────────────────────
const PANTRY_SET = new Set(ROOM_TEMP);
const FRIDGE_SET = new Set(FRIDGE);
const FREEZER_SET = new Set(FREEZER);

// ── 카테고리 fallback ────────────────────────────────────────
const CATEGORY_FALLBACK: Record<string, StorageLocation> = {
  meat: '냉장',
  seafood: '냉동',  // 대부분 냉동 유통 기준
  dairy: '냉장',
  veggie: '상온',  // 뿌리채소 기준 (엽채류는 STORAGE_MAP에서 냉장으로 명시)
  fruit: '상온',
  grain: '상온',
  seasoning: '상온',
  bakery: '상온',
  asian: '상온',
  snack: '상온',
  beverage: '상온',
  dessert: '냉장',
  other: '상온',  // 매칭 안 되는 '기타' 카테고리는 상온으로 취급 (찬장 표시)
};

// ── 냉장고 도어 선반 전용 아이템 (자주 꺼내는 소스·음료·계란 등) ──
const FRIDGE_DOOR_ITEMS = new Set<string>([
  '계란', '달걀', '메추리알',
  '우유', '두유', '아몬드밀크', '오트밀크',
  '버터', '치즈', '슬라이스치즈', '크림치즈',
  '요거트', '요구르트', '생크림',
  '케첩', '마요네즈', '머스타드',
  '굴소스', '드레싱', '샐러드드레싱', '다진마늘',
  '주스', '탄산수', '식혜', '수정과',
  // 작은 병 양념류 — 도어 선반 단골
  '식초', '현미식초', '사과식초', '감식초',
  '꿀', '잼', '시럽', '메이플시럽',
]);

/**
 * 이 재료가 냉장고 도어 선반에 보관되는 타입인지 (소스·음료·자주 꺼냄).
 * 냉장 보관되는 재료 중에서만 쓰임.
 */
export function isFridgeDoorItem(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  if (FRIDGE_DOOR_ITEMS.has(trimmed)) return true;
  for (const key of FRIDGE_DOOR_ITEMS) {
    if (trimmed.includes(key) || key.includes(trimmed)) return true;
  }
  return false;
}

/**
 * 재료명으로만 큐레이션 맵에서 조회. 매칭 안 되면 null.
 * (name만 매칭이면 유저 의도가 명확 — e.g., "양파"는 누가 봐도 상온)
 */
export function lookupStorageByName(name: string): StorageLocation | null {
  const trimmed = name.trim().toLowerCase();

  // 1. 정확 일치
  if (PANTRY_SET.has(trimmed)) return '상온';
  if (FRIDGE_SET.has(trimmed)) return '냉장';
  if (FREEZER_SET.has(trimmed)) return '냉동';

  // 2. 부분 포함 (예: "다진마늘" → "마늘" 매칭)
  for (const key of PANTRY_SET) if (trimmed.includes(key) || key.includes(trimmed)) return '상온';
  for (const key of FRIDGE_SET) if (trimmed.includes(key) || key.includes(trimmed)) return '냉장';
  for (const key of FREEZER_SET) if (trimmed.includes(key) || key.includes(trimmed)) return '냉동';

  return null;
}

/**
 * 재료명과 카테고리를 받아 기본 저장 위치를 추론.
 * name 매칭 → 카테고리 fallback → '상온' 순.
 *
 * 주의: 카테고리 fallback은 신뢰도 낮음. 가능하면 lookupStorageByName()만 쓰고
 * null일 때 유저의 pill 선택 사용 권장.
 */
export function inferStorageLocation(name: string, category?: string | null): StorageLocation {
  const byName = lookupStorageByName(name);
  if (byName) return byName;

  // 카테고리 fallback
  if (category && CATEGORY_FALLBACK[category]) return CATEGORY_FALLBACK[category];

  // 최종 fallback — 상온
  return '상온';
}
