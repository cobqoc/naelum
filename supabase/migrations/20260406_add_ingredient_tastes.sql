-- ingredients_master에 tastes JSONB 컬럼 추가
-- 형식: { "sweet": 0-5, "salty": 0-5, "spicy": 0-5, "sour": 0-5, "bitter": 0-5, "umami": 0-5 }

ALTER TABLE ingredients_master ADD COLUMN IF NOT EXISTS tastes JSONB;

-- ============================================================
-- 채소 (veggie)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":1}' WHERE name = '파프리카';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":2,"umami":1}' WHERE name = '브로콜리';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '당근';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '오이';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":2}' WHERE name = '버섯';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":1}' WHERE name = '양파';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '감자';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":0}' WHERE name = '시금치';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '고구마';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":4,"sour":0,"bitter":0,"umami":1}' WHERE name = '고추';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":5,"sour":0,"bitter":0,"umami":1}' WHERE name = '청양고추';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":4,"sour":0,"bitter":0,"umami":2}' WHERE name = '마늘';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":3,"sour":1,"bitter":1,"umami":1}' WHERE name = '생강';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":1,"sour":0,"bitter":2,"umami":1}' WHERE name = '대파';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":1,"sour":0,"bitter":1,"umami":1}' WHERE name = '쪽파';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '옥수수';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":1,"bitter":2,"umami":0}' WHERE name = '토마토';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":1,"bitter":2,"umami":0}' WHERE name = '방울토마토';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '단호박';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":2}' WHERE name = '가지';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":1}' WHERE name = '양배추';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":2,"umami":1}' WHERE name = '상추';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":3,"umami":1}' WHERE name = '깻잎';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":1,"bitter":1,"umami":0}' WHERE name = '무';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":1,"spicy":0,"sour":1,"bitter":1,"umami":3}' WHERE name = '김치';

-- ============================================================
-- 과일 (fruit)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '사과';
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '바나나';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":5,"bitter":1,"umami":0}' WHERE name = '레몬';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":3,"bitter":1,"umami":0}' WHERE name = '오렌지';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":2,"bitter":0,"umami":0}' WHERE name = '딸기';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '포도';
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '망고';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '복숭아';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '배';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":4,"bitter":1,"umami":0}' WHERE name = '라임';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":2,"bitter":2,"umami":0}' WHERE name = '자몽';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '수박';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '멜론';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":2,"bitter":0,"umami":0}' WHERE name = '키위';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":0}' WHERE name = '파인애플';

-- ============================================================
-- 육류 (meat)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":4}' WHERE name = '소고기';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":3}' WHERE name = '돼지고기';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":3}' WHERE name = '닭고기';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":2}' WHERE name = '소시지';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":2,"spicy":0,"sour":0,"bitter":0,"umami":3}' WHERE name = '베이컨';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":2,"spicy":0,"sour":0,"bitter":0,"umami":3}' WHERE name = '햄';

-- ============================================================
-- 해산물 (seafood)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":4}' WHERE name = '연어';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":3}' WHERE name = '새우';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":2,"spicy":0,"sour":0,"bitter":0,"umami":4}' WHERE name = '참치';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":2,"spicy":0,"sour":0,"bitter":0,"umami":4}' WHERE name = '게';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":2,"spicy":0,"sour":0,"bitter":1,"umami":3}' WHERE name = '오징어';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":2,"spicy":0,"sour":0,"bitter":0,"umami":4}' WHERE name = '조개';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":2,"spicy":0,"sour":0,"bitter":0,"umami":5}' WHERE name = '멸치';

-- ============================================================
-- 양념/소스 (seasoning)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":5,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '소금';
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '설탕';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":4,"spicy":0,"sour":2,"bitter":0,"umami":3}' WHERE name = '간장';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":2,"spicy":0,"sour":1,"bitter":0,"umami":4}' WHERE name = '된장';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":2,"spicy":3,"sour":0,"bitter":0,"umami":3}' WHERE name = '고추장';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":3,"spicy":0,"sour":0,"bitter":0,"umami":5}' WHERE name = '굴소스';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":4,"spicy":0,"sour":1,"bitter":0,"umami":4}' WHERE name = '피시소스';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":3,"spicy":0,"sour":1,"bitter":0,"umami":4}' WHERE name = '우스터소스';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":2,"spicy":0,"sour":3,"bitter":0,"umami":2}' WHERE name = '케첩';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":2,"spicy":3,"sour":2,"bitter":0,"umami":2}' WHERE name = '스리라차';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":3,"sour":0,"bitter":0,"umami":0}' WHERE name = '후추';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":2,"sour":0,"bitter":2,"umami":0}' WHERE name = '고춧가루';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":1,"spicy":0,"sour":3,"bitter":0,"umami":1}' WHERE name = '식초';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":1,"spicy":0,"sour":3,"bitter":0,"umami":1}' WHERE name = '발사믹 식초';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":0}' WHERE name = '올리브오일';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '꿀';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":0}' WHERE name = '메이플 시럽';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":1,"spicy":0,"sour":1,"bitter":0,"umami":3}' WHERE name = '미소';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":4,"spicy":0,"sour":0,"bitter":0,"umami":5}' WHERE name = '멸치액젓';

-- ============================================================
-- 유제품 (dairy)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":1,"spicy":0,"sour":1,"bitter":0,"umami":2}' WHERE name = '치즈';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '우유';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '버터';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":2,"bitter":0,"umami":0}' WHERE name = '요거트';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":1,"bitter":0,"umami":1}' WHERE name = '크림치즈';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '계란';

-- ============================================================
-- 곡물 (grain)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '쌀';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":1}' WHERE name = '현미';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":1}' WHERE name = '귀리';

-- ============================================================
-- 기타 (other)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":3}' WHERE name = '두부';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":2}' WHERE name = '아몬드';
UPDATE ingredients_master SET tastes = '{"sweet":1,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":2}' WHERE name = '호두';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":1,"spicy":0,"sour":0,"bitter":1,"umami":2}' WHERE name = '땅콩';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":0,"bitter":1,"umami":0}' WHERE name = '잼';
UPDATE ingredients_master SET tastes = '{"sweet":3,"salty":1,"spicy":0,"sour":0,"bitter":2,"umami":1}' WHERE name = '땅콩버터';

-- ============================================================
-- 디저트 (dessert)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":2,"umami":0}' WHERE name = '초콜릿';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":1,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '쿠키';
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '케이크';
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '도넛';
UPDATE ingredients_master SET tastes = '{"sweet":4,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '아이스크림';
UPDATE ingredients_master SET tastes = '{"sweet":5,"salty":0,"spicy":0,"sour":0,"bitter":0,"umami":0}' WHERE name = '캐러멜';

-- ============================================================
-- 음료 (beverage)
-- ============================================================
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":4,"umami":0}' WHERE name = '에스프레소';
UPDATE ingredients_master SET tastes = '{"sweet":2,"salty":0,"spicy":0,"sour":0,"bitter":3,"umami":0}' WHERE name = '라떼';
UPDATE ingredients_master SET tastes = '{"sweet":0,"salty":0,"spicy":0,"sour":0,"bitter":3,"umami":0}' WHERE name = '카푸치노';
