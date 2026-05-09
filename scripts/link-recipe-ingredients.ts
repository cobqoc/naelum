/**
 * recipe_ingredients.ingredient_id → ingredients_master.id 연결
 *
 * ingredient_name 기준으로 ingredients_master와 정확히 매칭.
 * 퍼지 매칭 없음 — 안전한 완전 일치만 처리.
 *
 * 실행: npx tsx scripts/link-recipe-ingredients.ts
 * Prod: npx tsx scripts/link-recipe-ingredients.ts --prod
 * 드라이런: npx tsx scripts/link-recipe-ingredients.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const DRY_RUN = process.argv.includes('--dry-run');
const PROD = process.argv.includes('--prod');

const SUPABASE_URL = PROD
  ? 'https://rgnlgpfazxgwsnkgrhzs.supabase.co'
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = PROD
  ? (process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ────────────────────────────────────────────────────────────────
// recipe_ingredients.ingredient_name → ingredients_master.name 별칭 매핑
// "다진 마늘" 같은 조리 형태 표현을 마스터의 "마늘"로 연결
// ────────────────────────────────────────────────────────────────
const ALIAS_MAP: Record<string, string> = {
  // 마늘
  '다진 마늘': '마늘',
  '다진마늘': '마늘',
  '다진대파': '대파',
  '다진 대파': '대파',
  '다진파': '파',
  '다진 파': '파',
  // 달걀
  '계란': '달걀',
  '달걀 노른자': '달걀',
  '달걀노른자': '달걀',
  '삶은 달걀': '달걀',
  '푼 달걀': '달걀',
  '채 썬 달걀 지단': '달걀',
  // 쌀
  '백미': '쌀',
  '일반 쌀': '쌀',
  '흰쌀': '쌀',
  '멥쌀': '쌀',
  '정백미(흰쌀)': '쌀',
  // 밀가루
  '중력분(밀가루)': '밀가루',
  '박력분': '밀가루',
  '강력분': '밀가루',
  // 두부
  '단단한 두부': '두부',
  '구운 두부': '두부',
  '얼린 두부(고야 두부)': '고야 두부(건조 두부)',
  // 소고기
  '쇠고기': '소고기',
  // 닭고기
  '닭 허벅지살': '닭고기',
  '닭가슴살': '닭고기',
  '닭': '닭고기',
  // 파류
  '대파': '파',
  '쪽파': '파',
  '실파': '파',
  // 된장류
  '흰된장': '된장',
  '보리된장': '된장',
  '적된장': '된장',
  // 간장류
  '연간장': '간장',
  '진간장': '간장',
  '한식간장': '간장',
  // 고추류
  '홍고추': '고추',
  '청고추': '고추',
  '풋고추': '고추',
  // 유부 (이제 master에 등록됨)
  '두꺼운 유부': '유부',
  // 버섯
  '느타리버섯': '느타리버섯',
  '팽이버섯': '팽이버섯',
  '건표고버섯': '표고버섯',
  // 곤약 (이제 master에 등록됨)
  '실곤약': '곤약',
  // 어묵 (이제 master에 등록됨)
  '어묵(치쿠와)': '어묵',
  // 깨
  '통깨': '깨',
  '깨소금': '깨',
  '간 깨': '깨',
  // 찹쌀가루
  '찹쌀가루(시라타마)': '찹쌀가루',
  // 밥
  '밥': '밥',
  // 쌀가루
  '흰쌀가루': '쌀가루',
  '멥쌀가루': '쌀가루',
  // 술
  '맛술': '청주',
  '미림': '청주',
  // 가쓰오부시 (master명: '가쓰오부시', 괄호형은 alias)
  '가쓰오 육수': '가쓰오부시',
  '가쓰오부시(가다랑어포)': '가쓰오부시',
  // 고야두부
  '고야 두부(건조두부)': '고야 두부(건조 두부)',
  // 설탕류
  '정백설탕': '설탕',
  '굵은 설탕': '설탕',
  // 흑설탕은 별도 master 항목
  // 콩
  '콩(대두)': '콩',
  // 숙주
  '숙주나물': '숙주',
  // 겨자
  '연겨자': '겨자',
  // 생강
  '홍생강 절임': '생강',
  '강판 생강': '생강',
  // 다시마
  '다시마 육수': '다시마',
  // 무
  '건무/무말랭이': '무',
  // 죽순
  '삶은 죽순': '죽순',
  // 전분
  '감자전분': '전분',
  // 팥 계열
  '팥소': '팥',
  '매끈한 팥소': '팥',
  '붉은 팥': '팥',
  // 차조기
  '차조기': '차조기 잎(시소)',
  // 콩나물/숙주
  '강낭콩(껍질째)': '강낭콩',
  // 멸치 계열
  '잔멸치(치리멘자코)': '멸치',
  '육수（멸치）': '멸치',
  // 김
  '채썬김': '김',
  // 후추 (오타 포함)
  '후춧가루 약간)': '후추',
  // 설탕 추가형
  '그라뉴 설탕': '설탕',
  // 간장 계열
  '육수 간장': '간장',
  // 닭고기 추가형
  '재래종 닭': '닭고기',
  // 떡 계열
  '둥근 떡': '떡',
  // 메밀 계열 (소바)
  '메밀(소바)': '메밀',
  // ── 추가 aliases (2026-05-10) ──────────────────────────────────
  // 마늘
  '강판에 간마늘': '마늘',
  // 닭고기
  '닭 가슴살': '닭고기',
  '닭 안심살': '닭고기',
  '닭고기(허벅지살)': '닭고기',
  // 달걀
  '달걀 흰자': '달걀',
  '달걀흰자': '달걀',
  '황백지단': '달걀',
  // 생강
  '생강（강판에 간）': '생강',
  '강판에 간 생강': '생강',
  '생강의 즙': '생강',
  '생강의 짜낸즙': '생강',
  '채 썬생강': '생강',
  '토생강': '생강',
  '어린 생강': '생강',
  '홍생강': '생강',
  // 차조기 잎(시소)
  '차조기의 잎': '차조기 잎(시소)',
  '차조기 잎': '차조기 잎(시소)',
  '청차조기': '차조기 잎(시소)',
  '풋차조기': '차조기 잎(시소)',
  // 파
  '풋파': '파',
  '뿌리 깊은 파': '파',
  '쪽파（어슷 편 썬）': '파',
  '쪽파（어슷 썬）': '파',
  // 김
  '잘게 썬 김': '김',
  '다진김': '김',
  '풋김': '김',
  '구운김': '김',
  // 팥
  '팥팥소': '팥',
  '고운 팥소': '팥',
  // 가쓰오부시
  '가쓰오부시 포': '가쓰오부시',
  '가다랑어육수': '가쓰오부시',
  '가쓰오 육수즙': '가쓰오부시',
  '가다랑어': '가쓰오부시',
  '가다랑어다시마육수': '가쓰오부시',
  // 유자
  '유자껍질': '유자',
  // 소금
  '식용소금': '소금',
  '소금 약간)': '소금',
  '천연 소금': '소금',
  '굵은소금': '소금',
  // 완두콩
  '완두콩 꼬투리': '완두콩',
  '스냅 완두콩': '완두콩',
  '스냅완두콩': '완두콩',
  // 밀가루
  '지역 밀가루': '밀가루',
  '밀가루(박력분)': '밀가루',
  // 쑥갓
  '쑥갓(봄국화)': '쑥갓',
  // 유부
  '얇은 유부(우스아게)': '유부',
  // 곤약
  '덩어리 곤약': '곤약',
  '판곤약': '곤약',
  '크기곤약': '곤약',
  // 새우
  '껍질 벗긴 새우': '새우',
  '시바에비(작은 새우)': '새우',
  '벚꽃새우(사쿠라에비)': '새우',
  // 소고기
  '다진 소고기': '소고기',
  '소고기（스키야키용）': '소고기',
  // 돼지고기
  '돼지 등심': '돼지고기',
  // 간장
  '연간장（우스쿠치）': '간장',
  '집간장': '간장',
  '다마리 간장': '간장',
  // 된장
  '쌀된장': '된장',
  '콩된장': '된장',
  '믹스 된장': '된장',
  // 전분
  '녹말': '전분',
  // 청주
  '요리용 청주': '청주',
  '달콤한청주': '청주',
  // 깨
  '검은깨': '깨',
  '볶은깨': '깨',
  '흰간 깨': '깨',
  '깨（검은）': '깨',
  // 산초
  '산초 새잎': '산초',
  '통산초': '산초',
  '가루산초': '산초',
  // 어묵
  '어묵（빨간）': '어묵',
  '튀긴 어묵': '어묵',
  '사쓰마아게(어묵 튀김)': '어묵',
  '생선 어묵(스리미)': '어묵',
  // 밥
  '지은밥': '밥',
  // 떡
  '자른떡': '떡',
  '둥근 떡（마루모치）': '떡',
  // 무
  '무말랭이': '무',
  '얼린무': '무',
  '무의 잎': '무',
  // 쌀가루
  '쌀가루(상신분)': '쌀가루',
  // 미역
  '생미역': '미역',
  // 문어
  '삶은 문어': '문어',
  '문어（생）': '문어',
  // 고등어
  '구운 고등어': '고등어',
  '고등어 절임': '고등어',
  '고등어 수조림 통조림': '고등어',
  // 고춧가루
  '가루고추': '고춧가루',
  // 식용유
  '튀김용 식용유': '식용유',
  '샐러드유': '식용유',
  // 식초
  '곡물식초': '식초',
  '단식초': '식초',
  '매실 식초': '식초',
  // 명란
  '명란(타라코)': '명란',
  // 밤
  '생밤': '밤',
  // 우동
  '삶은우동': '우동',
  // 보리
  '보리밥': '보리',
  // 쌀
  '떡쌀': '쌀',
};

async function main() {
  console.log(`모드: ${DRY_RUN ? '드라이런' : PROD ? 'PROD' : 'DEV'}\n`);

  // 1. ingredients_master 전체 로드 (name → id) — 페이지네이션으로 전체 로드
  console.log('ingredients_master 로드 중...');
  const masters: { id: string; name: string; aliases: string[] | null }[] = [];
  let masterOffset = 0;
  const MASTER_PAGE = 1000;
  while (true) {
    const { data, error: masterError } = await supabase
      .from('ingredients_master')
      .select('id, name, aliases')
      .range(masterOffset, masterOffset + MASTER_PAGE - 1);
    if (masterError) throw masterError;
    if (!data || data.length === 0) break;
    masters.push(...data);
    if (data.length < MASTER_PAGE) break;
    masterOffset += MASTER_PAGE;
  }

  // name → id 인덱스
  const nameToId = new Map<string, string>();
  for (const m of masters ?? []) {
    nameToId.set(m.name, m.id);
    // aliases 배열도 등록
    if (Array.isArray(m.aliases)) {
      for (const alias of m.aliases) {
        if (alias && !nameToId.has(alias)) {
          nameToId.set(alias, m.id);
        }
      }
    }
  }
  // ALIAS_MAP 추가 등록
  for (const [alias, masterName] of Object.entries(ALIAS_MAP)) {
    const id = nameToId.get(masterName);
    if (id && !nameToId.has(alias)) {
      nameToId.set(alias, id);
    }
  }
  console.log(`  인덱스 완성: ${nameToId.size}개 항목\n`);

  // 2. ingredient_id가 없는 recipe_ingredients 조회 (커서 기반 페이지네이션)
  // ID 커서를 사용해 매칭된/미매칭 행 모두 순차적으로 진행 — 무한루프 방지
  console.log('연결 안 된 recipe_ingredients 집계 중...');
  let totalLinked = 0;
  let totalSkipped = 0;
  const PAGE_SIZE = 1000;
  let lastId = '';

  while (true) {
    const query = supabase
      .from('recipe_ingredients')
      .select('id, ingredient_name')
      .is('ingredient_id', null)
      .order('id')
      .limit(PAGE_SIZE);

    if (lastId) query.gt('id', lastId);

    const { data: rows, error: rowError } = await query;
    if (rowError) throw rowError;
    if (!rows || rows.length === 0) break;

    lastId = rows[rows.length - 1].id;

    // 업데이트 배치 준비
    type UpdateItem = { id: string; ingredient_id: string };
    const updates: UpdateItem[] = [];
    for (const row of rows) {
      const masterId = nameToId.get(row.ingredient_name);
      if (masterId) {
        updates.push({ id: row.id, ingredient_id: masterId });
      } else {
        totalSkipped++;
      }
    }

    if (updates.length > 0) {
      if (DRY_RUN) {
        for (const u of updates.slice(0, 5)) {
          const name = rows.find(r => r.id === u.id)?.ingredient_name;
          const masterName = masters?.find(m => m.id === u.ingredient_id)?.name;
          console.log(`  [DRY] "${name}" → "${masterName}"`);
        }
        if (updates.length > 5) console.log(`  [DRY] ... 및 ${updates.length - 5}개 더`);
        totalLinked += updates.length;
      } else {
        // ingredient_id별로 그룹핑해서 IN 쿼리로 일괄 업데이트
        const grouped = new Map<string, string[]>();
        for (const u of updates) {
          const list = grouped.get(u.ingredient_id) ?? [];
          list.push(u.id);
          grouped.set(u.ingredient_id, list);
        }
        for (const [ingredientId, ids] of grouped) {
          const { error: updateError } = await supabase
            .from('recipe_ingredients')
            .update({ ingredient_id: ingredientId })
            .in('id', ids);
          if (updateError) throw updateError;
        }
        totalLinked += updates.length;
        process.stdout.write(`  ${totalLinked}개 연결...\r`);
      }
    }

    if (rows.length < PAGE_SIZE) break;
  }

  console.log(`\n────────────────────────────`);
  console.log(`✅ 연결 완료: ${totalLinked}개`);
  console.log(`⚠️  미매칭: ${totalSkipped}개 (ingredients_master에 없거나 매핑 없음)`);
  console.log(`\n미매칭 비율이 높으면 ALIAS_MAP에 패턴을 추가하세요.`);
}

main().catch(console.error);
