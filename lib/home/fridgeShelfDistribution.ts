import type { FridgeItem } from '@/app/[lang]/_home/types';

/**
 * 냉장고 본체(3단)·냉동 선반 그룹 분배 + 통합 overflow 계산 (순수 함수).
 *
 * god-file(HomeClient) 분해 Step 1 — 순수 파생부터 분리(거의 무위험).
 * HomeClient 의 `fridgeShelfDistribution` useMemo 본문을 **알고리즘 byte-identical**
 * 로 이동(상태·React 의존 0). 유일한 비순수 그래프 의존(`urgencyScore` →
 * helpers.ts → quickAddList)은 **주입**해 lib 순수성 유지.
 * → vitest(node env)에서 단독 단위 테스트 가능. 동작 변경 0.
 *
 * 규칙:
 *  - 같은 이름끼리 그룹화(trim + case-insensitive). 그룹 내 = 가장 임박 우선,
 *    그룹 간 = 그룹 대표(첫 항목) 임박도 기준 정렬.
 *  - 냉동(storage_location === '냉동')은 별도 freezerGroups.
 *  - 비냉동 그룹을 본체 3단에 `shelfMaxBody` 단위로 분배(마지막 단에 잔여 누적).
 *  - overflow = 각 본체 단/냉동의 (그룹수 - shelfMaxBody) 합.
 */
export function computeFridgeShelfDistribution(
  items: FridgeItem[],
  shelfMaxBody: number,
  urgencyScore: (item: FridgeItem) => number,
): {
  bodyShelfGroups: FridgeItem[][][];
  freezerGroups: FridgeItem[][];
  totalOverflow: number;
} {
  // 같은 이름끼리 그룹화 (case-insensitive). 그룹 정렬 = 그룹 내 가장 임박한 항목 기준.
  const groupByName = (list: FridgeItem[]): FridgeItem[][] => {
    const buckets = new Map<string, FridgeItem[]>();
    for (const item of list) {
      const key = item.ingredient_name.trim().toLowerCase();
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(item);
    }
    // 그룹 내 항목 정렬 (가장 임박 우선)
    const groups = Array.from(buckets.values()).map(g => g.sort((a, b) => urgencyScore(a) - urgencyScore(b)));
    // 그룹 간 정렬 = 그룹 대표(첫 항목) 기준
    return groups.sort((a, b) => urgencyScore(a[0]) - urgencyScore(b[0]));
  };

  const nonFreezer = items.filter(i => i.storage_location !== '냉동');
  const freezerRaw = items.filter(i => i.storage_location === '냉동');

  const nonFreezerGroups = groupByName(nonFreezer);
  const freezerGroups = groupByName(freezerRaw);

  // 본체 선반 3단에 그룹 단위로 분배
  const bodyShelfGroups: FridgeItem[][][] = [[], [], []];
  nonFreezerGroups.forEach((group, i) => {
    bodyShelfGroups[Math.min(Math.floor(i / shelfMaxBody), 2)].push(group);
  });

  // overflow는 그룹 단위 카운트
  let totalOverflow = 0;
  bodyShelfGroups.forEach(list => {
    if (list.length > shelfMaxBody) totalOverflow += list.length - shelfMaxBody;
  });
  if (freezerGroups.length > shelfMaxBody) totalOverflow += freezerGroups.length - shelfMaxBody;

  return { bodyShelfGroups, freezerGroups, totalOverflow };
}
