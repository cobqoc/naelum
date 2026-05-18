-- 재료 마스터 데이터 정리 (2026-05-19)
-- 1. 이상한 재료(방언/복합추출/도구 등) → status=pending (browse 칩에서 숨김)
-- 2. 카테고리 오분류 수정
-- 3. 이모지 명백 불일치 수정

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- PART 1: status → pending (재료 브라우저 칩에서 숨김)
-- ─────────────────────────────────────────────────────────────

-- 1-A. hansik_api 방언/고어 항목 (괄호 안에 현대 이름)
-- 예: 홍당무우(당근), 부루(상추), 분탕(당면), 농마(녹말) 등
-- 예외: 천엽(책갑) — 천엽은 실제 사용되는 이름
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'hansik_api'
  AND name ~ '\('
  AND name != '천엽(책갑)';

-- 1-B. recipe_extract 깨진 괄호 (파싱 잔재)
-- 예: 닭고기(가슴살, 달걀지단(흰자, 파프리카(빨강
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'recipe_extract'
  AND name ~ '\('
  AND name !~ '\)';

-- 1-C. recipe_extract 콜론 포함 복합 추출
-- 예: 느타리버섯 육수: 쇠고기(양지, 저나트륨 볶음고추장:고추장
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'recipe_extract'
  AND name LIKE '%:%';

-- 1-D. 조리도구, 색상/형태 단어, 결과물 액체
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND name IN (
    '꼬치', '무명실', '대꼬치', '산적꼬치',   -- 조리도구
    '노랑', '정사각형',                        -- 색상/형태
    '야채국물', '채소국물',                    -- 결과물 액체
    '육수 물', '육수용 물', '육수 재료 물'     -- 육수 액체
  );

-- 1-E. OR/혹은 패턴 (대안 재료 나열)
-- 예: 부추 또는 실파, 새우젓 또는 액젓
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND (name LIKE '%또는%' OR name LIKE '%혹은%');

-- 1-F. recipe_extract 브랜드명
-- 예: 청정원맛선생, 청정원순창쌈장, 르네디종 홀그레인머스터
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'recipe_extract'
  AND (
    name LIKE '청정원%'
    OR name LIKE 'CJ %'
    OR name LIKE '르네디종%'
  );

-- 1-G. recipe_extract 복합 재료명 (description 없는 것만)
-- 예: 육수용 무, 닭고기 삶는 재료 된장, 밥 밑간 참기름
-- "양념 X" 패턴은 양념장/양념간장 제외 (이건 실재 상품)
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'recipe_extract'
  AND description IS NULL
  AND (
    name ~ '^육수용? '                          -- 육수용 무, 육수 닭가슴살 등
    OR name ~ ' 삶는 재료 '                     -- 닭고기 삶는 재료 된장
    OR name ~ '^[^ ]+ 밑간 '                    -- 밥 밑간 참기름
    OR name ~ '^[^ ]+밑간 '                     -- 닭밑간양념 다진 마늘
    OR name ~ '^[^ ]+완자양념 '                 -- 고기완자양념 생강즙
    OR name LIKE '%드레싱 %'                    -- 허브오일드레싱 저염소금
    OR (
      name LIKE '양념 %'
      AND name NOT IN ('양념장', '양념간장', '양념고추장', '양념초고추장', '양념초장')
    )
    OR name LIKE '양념장 %'                     -- 양념장 설탕
    OR name LIKE '된장양념 %'                   -- 된장양념 콩가루
    OR name LIKE '저염간장양념 %'               -- 저염간장양념 저염간장
    OR name LIKE '해초 밑간 %'                  -- 해초 밑간 설탕
    OR name LIKE '고기 밑간 %'                  -- 고기 밑간 설탕
    OR name LIKE '%통조림 국물'                 -- 파인애플 통조림 국물
    OR name ~ '\d+x\d+'                         -- 다시마 사방 10x10cm (측정값 포함)
    OR name LIKE '%육수 다시마'                 -- 다시마육수 다시마
    OR name LIKE '%간장소스 %'                  -- 유자청간장소스 유자청
    OR name LIKE '황설탕 호떡소%'              -- 황설탕 호떡소: 검정깨
    OR name LIKE '저나트륨 두부%'               -- 저나트륨 두부 된장소스
    OR name LIKE '반죽양념 %'                   -- 반죽양념 다진 파
    OR name LIKE '%타르타르%양파'               -- 허브타르타르드레싱 양파
  );

-- ─────────────────────────────────────────────────────────────
-- PART 2: 카테고리 오분류 수정
-- ─────────────────────────────────────────────────────────────

-- 2-A. 치즈류 veggie → dairy
UPDATE ingredients_master
SET category = 'dairy', updated_at = NOW()
WHERE status = 'approved'
  AND category = 'veggie'
  AND (name LIKE '%치즈%' OR name = '마스카르포네');

-- 2-B. 양념/소스류가 meat에 잘못 분류된 것 → seasoning
UPDATE ingredients_master
SET category = 'seasoning', updated_at = NOW()
WHERE status = 'approved'
  AND category = 'meat'
  AND name IN ('국간장', '양념간장', '양념고추장', '양념장', '양념초고추장', '초간장');

-- 2-C. 채소류가 meat에 잘못 분류된 것 → veggie
UPDATE ingredients_master
SET category = 'veggie', updated_at = NOW()
WHERE status = 'approved'
  AND category = 'meat'
  AND name IN ('청양고추', '빨간무우');

-- 2-D. 진간장 meat → seasoning (rda_manual)
UPDATE ingredients_master
SET category = 'seasoning', updated_at = NOW()
WHERE name = '진간장' AND category = 'meat';

-- 2-E. 짜파게티 veggie → grain (라면 제품)
UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE name = '짜파게티' AND category = 'veggie';

-- ─────────────────────────────────────────────────────────────
-- PART 3: 이모지 명백 불일치 수정
-- ─────────────────────────────────────────────────────────────

-- 🦀 (게) 이모지를 잘못 가진 비-게 재료들
UPDATE ingredients_master SET emoji = '🥩', updated_at = NOW()
  WHERE name = '등심얇게썬것' AND emoji = '🦀';   -- 소 등심

UPDATE ingredients_master SET emoji = '🥖', updated_at = NOW()
  WHERE name = '바게트빵' AND emoji = '🦀';         -- 바게트빵

UPDATE ingredients_master SET emoji = '🍝', updated_at = NOW()
  WHERE name = '스파게티면' AND emoji = '🦀';       -- 스파게티

UPDATE ingredients_master SET emoji = '🍝', updated_at = NOW()
  WHERE name = '짜파게티' AND emoji = '🦀';         -- 라면

-- 기타 명백 불일치
UPDATE ingredients_master SET emoji = '🧀', updated_at = NOW()
  WHERE name = '피자치즈' AND emoji = '🍕';         -- 치즈 (피자 아님)

UPDATE ingredients_master SET emoji = '🥛', updated_at = NOW()
  WHERE name = '아몬드밀크' AND emoji = '🥜';       -- 밀크류 (견과류 아님)

COMMIT;
