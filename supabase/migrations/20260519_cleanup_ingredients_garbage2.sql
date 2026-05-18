-- 재료 마스터 2차 정리 (2026-05-19)
-- 1. 조미료 카테고리 채우기 (seasoning/veggie/other → condiment)
-- 2. 추가 garbage pending 처리 (각/각각, 도구, 국물, 제공용어)
-- 3. 기타(other) 잘못 분류된 항목 카테고리 수정

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- PART 1: condiment 카테고리 채우기
-- 소금/설탕/식초/후추/꿀/전분/베이킹/발효제 등 기초 조미료
-- ─────────────────────────────────────────────────────────────

UPDATE ingredients_master
SET category = 'condiment', updated_at = NOW()
WHERE status = 'approved'
  AND name IN (
    -- 소금류
    '소금','굵은소금','꽃소금','천일염','죽염','히말라야소금','맛소금',
    '저염소금','고운소금','암염','저염식염','꽃소금',
    -- 설탕류
    '설탕','백설탕','흑설탕','황설탕','비정제설탕','유기농설탕',
    '슈가파우더','슈거파우더','정백당','원당','마스코바도설탕',
    -- 후추류
    '후추','흑후추','백후추','통후추','후춧가루','흑후춧가루',
    '핑크후추','홀리페퍼','그린페퍼',
    -- 식초류
    '식초','현미식초','사과식초','백식초','발사믹식초','레드와인식초',
    '화이트와인식초','쌀식초','흑초','복숭아식초','감식초',
    -- 감미료/시럽류
    '꿀','물엿','올리고당','조청','아가베시럽','메이플시럽',
    '쌀조청','현미조청',
    -- 대체감미료
    '알룰로스','에리스리톨','스테비아','자일리톨','나한과분말',
    -- 베이킹/발효
    '베이킹파우더','베이킹소다','이스트','드라이이스트','건조이스트',
    '인스턴트이스트',
    -- 전분/녹말류
    '전분','감자전분','옥수수전분','타피오카전분','녹말가루',
    '고구마전분','쌀전분','아라루트전분',
    -- 조미료/다시
    'MSG','미원','다시다','맛가루','감칠맛조미료','육수파우더',
    '치킨파우더','가쓰오부시파우더'
  );

-- ─────────────────────────────────────────────────────────────
-- PART 2: 추가 garbage → pending
-- ─────────────────────────────────────────────────────────────

-- 2-A. "각"/"각각" 접미사 (계량 단위가 이름에 붙은 파싱 오류)
-- 예: 노랑 각, 다릿살 각, 노른자 각각, 홍피망, 청피망 각각
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND (
    name LIKE '% 각' OR name LIKE '% 각각'
    OR name LIKE '%, % 각각'   -- 홍피망, 청피망 각각 패턴
  );

-- 2-B. 조리도구 변형들
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND name IN ('꼬치용 꼬치', '나무 꼬치', '나무막대기', '이쑤시개', '고무줄');

-- 2-C. 제공/장식 용어 (재료가 아닌 요리 지시어)
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND name IN ('고명', '곁들임', '결들임', '고명용');

-- 2-D. 파생 액체 결과물 (브로스/국물)
-- 단, 새우젓국물·김칫국물·동치미국물은 실제 요리 재료로 사용 → 유지
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND name IN (
    '물', '따뜻한물', '다시물', '맛국물', '멸칫국물',
    '물김치국물', '가쓰오브시국물', '다시마국물'
  );

-- 2-E. 복합 compound 항목 (이전에 못 잡은 것들)
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'recipe_extract'
  AND name IN (
    '스테이크반죽 곤약', '머루솔', '부대찌개양념'
  );

-- ─────────────────────────────────────────────────────────────
-- PART 3: other 카테고리 잘못 분류된 항목 → 올바른 카테고리
-- ─────────────────────────────────────────────────────────────

-- seafood로 이동
UPDATE ingredients_master
SET category = 'seafood', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN ('성게알', '숭어', '맛살', '게맛살', '산천어', '민어', '멸치');

-- meat으로 이동
UPDATE ingredients_master
SET category = 'meat', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN ('소가슴살', '선지', '돈민찌', '곱창');

-- veggie로 이동
UPDATE ingredients_master
SET category = 'veggie', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN (
    '알타리', '고수잎', '간생강', '건곤드레', '방아풀',
    '한련화', '홍갓', '청갓'
  );

-- grain으로 이동
UPDATE ingredients_master
SET category = 'grain', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN ('메조', '검은콩가루', '메주콩', '보리순', '귀리순');

-- fruit으로 이동
UPDATE ingredients_master
SET category = 'fruit', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN ('오미자', '오미자청', '레드커런트', '블랙커런트');

-- dairy로 이동
UPDATE ingredients_master
SET category = 'dairy', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN ('호상요구르트', '드링킹요구르트', '가공치즈');

-- beverage로 이동
UPDATE ingredients_master
SET category = 'beverage', updated_at = NOW()
WHERE status = 'approved' AND category = 'other'
  AND name IN ('가루녹차', '말차가루', '코코아파우더', '카카오파우더');

-- ─────────────────────────────────────────────────────────────
-- PART 4: 기타 카테고리 수정 (veggie/grain/fruit에 잘못 있는 것)
-- ─────────────────────────────────────────────────────────────

-- 베이킹파우더/전분 veggie→condiment (이미 PART 1에서 처리됨, 중복 safe)
-- 사과식초 fruit→condiment (이미 PART 1에서 처리됨)

-- 국물용 다시마·멸치는 seafood에서 유지 (실제 재료임)
-- 단, 명칭 자체가 "국물용" 접두사라 혼란스러우면 추후 검토

COMMIT;
