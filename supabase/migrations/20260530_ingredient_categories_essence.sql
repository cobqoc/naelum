-- 재료 카테고리 본질 기준 재분류 (2026-05-30)
--
-- 부엌 도감은 참조 정보(사실)다 — 카테고리는 "조리에 어떻게 쓰냐(용도)"가 아니라
-- "이 재료가 본질적으로 무엇이냐"로 분류해야 한다. 웹·식품학 출처로 검증:
--   - 장류(간장·국간장·진간장·된장·고추장)·젓갈류(액젓)·식초류(식초)·주류(맛술)
--     = 전부 발효식품 (한국민족문화대백과 발효식품 분류). 양념은 용도일 뿐.
--   - 굴소스 = 발효 아님 (굴 추출액 가열 농축) → 양념&소스.
--   - 참기름·들기름·식용유 = 유지·기름 (신규 카테고리 oil).
--   - 설탕·백설탕·황설탕·올리고당 = 당류·감미료 (신규 카테고리 sweetener).
--   - 소금 = 기초 조미료의 원형 → 조미료(condiment).
--   - 고춧가루·후추 = 향신료(spice, 변경 없음).
--
-- 신규 카테고리 2개(oil·sweetener)는 코드(i18n 8개국어 + INGREDIENT_CATEGORIES +
-- 도감 hub/all/browse 맵 + picker)에 함께 반영. DB category 컬럼은 free text라 enum 변경 없음.
--
-- 범위: status='approved' (도감·picker에 노출되는 65개). 이름 기준 정확 일치.
-- dev → prod 동일 적용 완료.

UPDATE ingredients_master SET category='fermented' WHERE status='approved' AND name IN ('간장','국간장','진간장','된장','고추장','액젓','식초','맛술');
UPDATE ingredients_master SET category='oil'        WHERE status='approved' AND name IN ('참기름','들기름','식용유');
UPDATE ingredients_master SET category='sweetener'  WHERE status='approved' AND name IN ('설탕','백설탕','황설탕','올리고당');
UPDATE ingredients_master SET category='condiment'  WHERE status='approved' AND name = '소금';
UPDATE ingredients_master SET category='seasoning'  WHERE status='approved' AND name = '굴소스';
