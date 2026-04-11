-- ingredients_master 시드 데이터 (MobileNet 매핑 재료)

-- 채소 (Vegetables)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('파프리카', 'Bell Pepper', '파프리카', 'veggie', '["g", "kg", "개"]'::jsonb),
('브로콜리', 'Broccoli', '브로콜리', 'veggie', '["g", "kg", "송이"]'::jsonb),
('당근', 'Carrot', '당근', 'veggie', '["g", "kg", "개"]'::jsonb),
('오이', 'Cucumber', '오이', 'veggie', '["g", "kg", "개"]'::jsonb),
('버섯', 'Mushroom', '버섯', 'veggie', '["g", "kg", "팩"]'::jsonb),
('양배추', 'Cabbage', '양배추', 'veggie', '["g", "kg", "개"]'::jsonb),
('콜리플라워', 'Cauliflower', '콜리플라워', 'veggie', '["g", "kg", "송이"]'::jsonb),
('가지', 'Eggplant', '가지', 'veggie', '["g", "kg", "개"]'::jsonb),
('양파', 'Onion', '양파', 'veggie', '["g", "kg", "개"]'::jsonb),
('감자', 'Potato', '감자', 'veggie', '["g", "kg", "개"]'::jsonb),
('호박', 'Pumpkin', '호박', 'veggie', '["g", "kg", "개"]'::jsonb),
('토마토', 'Tomato', '토마토', 'veggie', '["g", "kg", "개"]'::jsonb),
('애호박', 'Zucchini', '애호박', 'veggie', '["g", "kg", "개"]'::jsonb),
('옥수수', 'Corn', '옥수수', 'veggie', '["g", "개", "캔"]'::jsonb),
('무', 'Radish', '무', 'veggie', '["g", "kg", "개"]'::jsonb),
('상추', 'Lettuce', '상추', 'veggie', '["g", "봉지", "포기"]'::jsonb),
('시금치', 'Spinach', '시금치', 'veggie', '["g", "봉지", "단"]'::jsonb),
('샐러리', 'Celery', '샐러리', 'veggie', '["g", "대"]'::jsonb),
('녹두', 'Green Bean', '녹두', 'veggie', '["g", "kg"]'::jsonb),
('아티초크', 'Artichoke', '아티초크', 'veggie', '["g", "개"]'::jsonb),
('아스파라거스', 'Asparagus', '아스파라거스', 'veggie', '["g", "개", "단"]'::jsonb),
('비트', 'Beetroot', '비트', 'veggie', '["g", "kg", "개"]'::jsonb),
('순무', 'Turnip', '순무', 'veggie', '["g", "kg", "개"]'::jsonb),
('케일', 'Kale', '케일', 'veggie', '["g", "봉지"]'::jsonb),
('청경채', 'Bok Choy', '청경채', 'veggie', '["g", "개", "단"]'::jsonb),
('숙주', 'Bean Sprout', '숙주', 'veggie', '["g", "봉지"]'::jsonb),
('김', 'Seaweed', '김', 'veggie', '["g", "장"]'::jsonb),
('죽순', 'Bamboo Shoot', '죽순', 'veggie', '["g", "개", "캔"]'::jsonb),
('연근', 'Lotus Root', '연근', 'veggie', '["g", "kg", "개"]'::jsonb),
('표고버섯', 'Shiitake', '표고버섯', 'veggie', '["g", "kg", "개"]'::jsonb),
('팽이버섯', 'Enoki', '팽이버섯', 'veggie', '["g", "팩"]'::jsonb),
('포르토벨로버섯', 'Portobello', '포르토벨로버섯', 'veggie', '["g", "개"]'::jsonb),
('느타리버섯', 'Oyster Mushroom', '느타리버섯', 'veggie', '["g", "kg", "팩"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 과일 (Fruits)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('사과', 'Apple', '사과', 'fruit', '["g", "kg", "개"]'::jsonb),
('바나나', 'Banana', '바나나', 'fruit', '["g", "개"]'::jsonb),
('레몬', 'Lemon', '레몬', 'fruit', '["g", "개"]'::jsonb),
('오렌지', 'Orange', '오렌지', 'fruit', '["g", "kg", "개"]'::jsonb),
('딸기', 'Strawberry', '딸기', 'fruit', '["g", "kg", "팩"]'::jsonb),
('파인애플', 'Pineapple', '파인애플', 'fruit', '["g", "kg", "개"]'::jsonb),
('수박', 'Watermelon', '수박', 'fruit', '["g", "kg", "조각"]'::jsonb),
('포도', 'Grape', '포도', 'fruit', '["g", "kg", "송이"]'::jsonb),
('복숭아', 'Peach', '복숭아', 'fruit', '["g", "kg", "개"]'::jsonb),
('배', 'Pear', '배', 'fruit', '["g", "kg", "개"]'::jsonb),
('체리', 'Cherry', '체리', 'fruit', '["g", "kg"]'::jsonb),
('키위', 'Kiwi', '키위', 'fruit', '["g", "개"]'::jsonb),
('망고', 'Mango', '망고', 'fruit', '["g", "kg", "개"]'::jsonb),
('멜론', 'Melon', '멜론', 'fruit', '["g", "kg", "개"]'::jsonb),
('자두', 'Plum', '자두', 'fruit', '["g", "kg", "개"]'::jsonb),
('아보카도', 'Avocado', '아보카도', 'fruit', '["g", "개"]'::jsonb),
('코코넛', 'Coconut', '코코넛', 'fruit', '["g", "개"]'::jsonb),
('무화과', 'Fig', '무화과', 'fruit', '["g", "개"]'::jsonb),
('구아바', 'Guava', '구아바', 'fruit', '["g", "개"]'::jsonb),
('파파야', 'Papaya', '파파야', 'fruit', '["g", "kg", "개"]'::jsonb),
('석류', 'Pomegranate', '석류', 'fruit', '["g", "개"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 육류 (Meat)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('고기', 'Meat', '고기', 'meat', '["g", "kg"]'::jsonb),
('소고기', 'Beef', '소고기', 'meat', '["g", "kg"]'::jsonb),
('돼지고기', 'Pork', '돼지고기', 'meat', '["g", "kg"]'::jsonb),
('닭고기', 'Chicken', '닭고기', 'meat', '["g", "kg", "마리"]'::jsonb),
('양고기', 'Lamb', '양고기', 'meat', '["g", "kg"]'::jsonb),
('소시지', 'Sausage', '소시지', 'meat', '["g", "개"]'::jsonb),
('베이컨', 'Bacon', '베이컨', 'meat', '["g", "팩"]'::jsonb),
('햄', 'Ham', '햄', 'meat', '["g", "팩"]'::jsonb),
('핫도그', 'Hot Dog', '핫도그', 'meat', '["개"]'::jsonb),
('미트볼', 'Meatball', '미트볼', 'meat', '["g", "개"]'::jsonb),
('바비큐', 'Barbecue', '바비큐', 'meat', '["g", "kg"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 해산물 (Seafood)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('생선', 'Fish', '생선', 'seafood', '["g", "kg", "마리"]'::jsonb),
('연어', 'Salmon', '연어', 'seafood', '["g", "kg"]'::jsonb),
('새우', 'Shrimp', '새우', 'seafood', '["g", "kg", "마리"]'::jsonb),
('참치', 'Tuna', '참치', 'seafood', '["g", "kg", "캔"]'::jsonb),
('게', 'Crab', '게', 'seafood', '["g", "kg", "마리"]'::jsonb),
('랍스터', 'Lobster', '랍스터', 'seafood', '["g", "kg", "마리"]'::jsonb),
('굴', 'Oyster', '굴', 'seafood', '["g", "kg", "개"]'::jsonb),
('조개', 'Clam', '조개', 'seafood', '["g", "kg"]'::jsonb),
('오징어', 'Squid', '오징어', 'seafood', '["g", "kg", "마리"]'::jsonb),
('문어', 'Octopus', '문어', 'seafood', '["g", "kg", "마리"]'::jsonb),
('가리비', 'Scallop', '가리비', 'seafood', '["g", "kg", "개"]'::jsonb),
('홍합', 'Mussel', '홍합', 'seafood', '["g", "kg"]'::jsonb),
('정어리', 'Sardine', '정어리', 'seafood', '["g", "kg", "캔"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 곡물 & 빵류 (Grains & Bread)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('빵', 'Bread', '빵', 'grain', '["g", "개", "조각"]'::jsonb),
('쌀', 'Rice', '쌀', 'grain', '["g", "kg", "컵"]'::jsonb),
('면', 'Noodle', '면', 'grain', '["g", "kg"]'::jsonb),
('스파게티', 'Spaghetti', '스파게티', 'grain', '["g", "kg"]'::jsonb),
('파스타', 'Pasta', '파스타', 'grain', '["g", "kg"]'::jsonb),
('피자', 'Pizza', '피자', 'grain', '["조각", "판"]'::jsonb),
('베이글', 'Bagel', '베이글', 'grain', '["개"]'::jsonb),
('프레첼', 'Pretzel', '프레첼', 'grain', '["g", "개"]'::jsonb),
('크루아상', 'Croissant', '크루아상', 'bakery', '["개"]'::jsonb),
('와플', 'Waffle', '와플', 'bakery', '["개"]'::jsonb),
('팬케이크', 'Pancake', '팬케이크', 'bakery', '["개", "장"]'::jsonb),
('프렌치토스트', 'French Toast', '프렌치토스트', 'bakery', '["개", "조각"]'::jsonb),
('부리또', 'Burrito', '부리또', 'grain', '["개"]'::jsonb),
('타코', 'Taco', '타코', 'grain', '["개"]'::jsonb),
('머핀', 'Muffin', '머핀', 'bakery', '["개"]'::jsonb),
('스콘', 'Scone', '스콘', 'bakery', '["개"]'::jsonb),
('데니시', 'Danish Pastry', '데니시', 'bakery', '["개"]'::jsonb),
('바게트', 'Baguette', '바게트', 'bakery', '["g", "개"]'::jsonb),
('치아바타', 'Ciabatta', '치아바타', 'bakery', '["g", "개"]'::jsonb),
('포카치아', 'Focaccia', '포카치아', 'bakery', '["g", "개"]'::jsonb),
('피타빵', 'Pita Bread', '피타빵', 'bakery', '["개"]'::jsonb),
('또띠야', 'Tortilla', '또띠야', 'grain', '["개", "장"]'::jsonb),
('랩', 'Wrap', '랩', 'grain', '["개"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 유제품 (Dairy)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('치즈', 'Cheese', '치즈', 'dairy', '["g", "kg", "장"]'::jsonb),
('계란', 'Egg', '계란', 'dairy', '["개", "판"]'::jsonb),
('우유', 'Milk', '우유', 'dairy', '["ml", "L"]'::jsonb),
('버터', 'Butter', '버터', 'dairy', '["g", "kg"]'::jsonb),
('요거트', 'Yogurt', '요거트', 'dairy', '["g", "ml", "개"]'::jsonb),
('크림', 'Cream', '크림', 'dairy', '["ml", "L"]'::jsonb),
('아이스크림', 'Ice Cream', '아이스크림', 'dairy', '["g", "ml", "개"]'::jsonb),
('모짜렐라', 'Mozzarella', '모짜렐라', 'dairy', '["g", "kg"]'::jsonb),
('페타치즈', 'Feta', '페타치즈', 'dairy', '["g"]'::jsonb),
('파마산치즈', 'Parmesan', '파마산치즈', 'dairy', '["g", "큰술"]'::jsonb),
('휘핑크림', 'Whipped Cream', '휘핑크림', 'dairy', '["ml", "L"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 양념 & 소스 (Seasoning & Sauces)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('마늘', 'Garlic', '마늘', 'seasoning', '["g", "개", "쪽"]'::jsonb),
('생강', 'Ginger', '생강', 'seasoning', '["g", "개"]'::jsonb),
('후추', 'Pepper', '후추', 'seasoning', '["g", "큰술", "작은술"]'::jsonb),
('소금', 'Salt', '소금', 'seasoning', '["g", "큰술", "작은술"]'::jsonb),
('설탕', 'Sugar', '설탕', 'seasoning', '["g", "kg", "큰술"]'::jsonb),
('꿀', 'Honey', '꿀', 'seasoning', '["g", "ml", "큰술"]'::jsonb),
('올리브유', 'Olive Oil', '올리브유', 'seasoning', '["ml", "L", "큰술"]'::jsonb),
('간장', 'Soy Sauce', '간장', 'seasoning', '["ml", "L", "큰술"]'::jsonb),
('식초', 'Vinegar', '식초', 'seasoning', '["ml", "L", "큰술"]'::jsonb),
('참깨', 'Sesame', '참깨', 'seasoning', '["g", "큰술"]'::jsonb),
('바질', 'Basil', '바질', 'seasoning', '["g", "개"]'::jsonb),
('민트', 'Mint', '민트', 'seasoning', '["g", "개"]'::jsonb),
('로즈마리', 'Rosemary', '로즈마리', 'seasoning', '["g", "개"]'::jsonb),
('타임', 'Thyme', '타임', 'seasoning', '["g"]'::jsonb),
('시나몬', 'Cinnamon', '시나몬', 'seasoning', '["g", "작은술"]'::jsonb),
('쿠민', 'Cumin', '쿠민', 'seasoning', '["g", "작은술"]'::jsonb),
('강황', 'Turmeric', '강황', 'seasoning', '["g", "작은술"]'::jsonb),
('고추', 'Chili', '고추', 'seasoning', '["g", "개"]'::jsonb),
('마요네즈', 'Mayonnaise', '마요네즈', 'seasoning', '["g", "ml", "큰술"]'::jsonb),
('케첩', 'Ketchup', '케첩', 'seasoning', '["g", "ml", "큰술"]'::jsonb),
('머스타드', 'Mustard', '머스타드', 'seasoning', '["g", "ml", "큰술"]'::jsonb),
('핫소스', 'Hot Sauce', '핫소스', 'seasoning', '["ml", "큰술"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 디저트 (Desserts)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('컵케이크', 'Cupcake', '컵케이크', 'dessert', '["개"]'::jsonb),
('초콜릿', 'Chocolate', '초콜릿', 'dessert', '["g", "개"]'::jsonb),
('쿠키', 'Cookie', '쿠키', 'dessert', '["g", "개"]'::jsonb),
('도넛', 'Doughnut', '도넛', 'dessert', '["개"]'::jsonb),
('아이스바', 'Ice Lolly', '아이스바', 'dessert', '["개"]'::jsonb),
('케이크', 'Cake', '케이크', 'dessert', '["g", "조각", "개"]'::jsonb),
('파이', 'Pie', '파이', 'dessert', '["조각", "개"]'::jsonb),
('브라우니', 'Brownie', '브라우니', 'dessert', '["개", "조각"]'::jsonb),
('마카롱', 'Macaron', '마카롱', 'dessert', '["개"]'::jsonb),
('티라미수', 'Tiramisu', '티라미수', 'dessert', '["개", "조각"]'::jsonb),
('치즈케이크', 'Cheesecake', '치즈케이크', 'dessert', '["조각", "개"]'::jsonb),
('푸딩', 'Pudding', '푸딩', 'dessert', '["g", "개"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 음료 (Beverages)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('에스프레소', 'Espresso', '에스프레소', 'beverage', '["ml", "샷"]'::jsonb),
('스무디', 'Smoothie', '스무디', 'beverage', '["ml", "L", "개"]'::jsonb),
('칵테일', 'Cocktail', '칵테일', 'beverage', '["ml", "잔"]'::jsonb),
('라떼', 'Latte', '라떼', 'beverage', '["ml", "잔"]'::jsonb),
('카푸치노', 'Cappuccino', '카푸치노', 'beverage', '["ml", "잔"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 아시아 식재료 (Asian Cuisine)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('초밥', 'Sushi', '초밥', 'asian', '["개", "접시"]'::jsonb),
('라면', 'Ramen', '라면', 'asian', '["개", "봉지"]'::jsonb),
('스프링롤', 'Spring Roll', '스프링롤', 'asian', '["개"]'::jsonb),
('만두', 'Dumpling', '만두', 'asian', '["g", "개"]'::jsonb),
('튀김', 'Tempura', '튀김', 'asian', '["개", "접시"]'::jsonb),
('김치', 'Kimchi', '김치', 'asian', '["g", "kg"]'::jsonb),
('된장국', 'Miso Soup', '된장국', 'asian', '["ml", "L", "그릇"]'::jsonb),
('우동', 'Udon', '우동', 'asian', '["g", "그릇"]'::jsonb),
('쌀국수', 'Pho', '쌀국수', 'asian', '["g", "그릇"]'::jsonb),
('팟타이', 'Pad Thai', '팟타이', 'asian', '["g", "접시"]'::jsonb),
('볶음밥', 'Fried Rice', '볶음밥', 'asian', '["g", "그릇"]'::jsonb),
('카레', 'Curry', '카레', 'asian', '["g", "ml", "그릇"]'::jsonb),
('비빔밥', 'Bibimbap', '비빔밥', 'asian', '["그릇"]'::jsonb),
('불고기', 'Bulgogi', '불고기', 'asian', '["g", "kg"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 스낵 & 패스트푸드 (Snacks & Fast Food)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('햄버거', 'Hamburger', '햄버거', 'snack', '["개"]'::jsonb),
('샌드위치', 'Sandwich', '샌드위치', 'snack', '["개"]'::jsonb),
('감자튀김', 'French Fries', '감자튀김', 'snack', '["g"]'::jsonb),
('나초', 'Nachos', '나초', 'snack', '["g"]'::jsonb),
('팝콘', 'Popcorn', '팝콘', 'snack', '["g", "봉지"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 견과류 & 씨앗 (Nuts & Seeds)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('아몬드', 'Almond', '아몬드', 'other', '["g", "kg"]'::jsonb),
('호두', 'Walnut', '호두', 'other', '["g", "kg"]'::jsonb),
('땅콩', 'Peanut', '땅콩', 'other', '["g", "kg"]'::jsonb),
('캐슈넛', 'Cashew', '캐슈넛', 'other', '["g", "kg"]'::jsonb),
('피스타치오', 'Pistachio', '피스타치오', 'other', '["g", "kg"]'::jsonb),
('해바라기씨', 'Sunflower Seed', '해바라기씨', 'other', '["g"]'::jsonb),
('호박씨', 'Pumpkin Seed', '호박씨', 'other', '["g"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 기타 식재료 (Other Ingredients)
INSERT INTO ingredients_master (name, name_en, name_ko, category, common_units) VALUES
('두부', 'Tofu', '두부', 'other', '["g", "kg", "모"]'::jsonb),
('템페', 'Tempeh', '템페', 'other', '["g"]'::jsonb),
('잼', 'Jam', '잼', 'other', '["g", "ml", "큰술"]'::jsonb),
('땅콩버터', 'Peanut Butter', '땅콩버터', 'other', '["g", "큰술"]'::jsonb),
('후무스', 'Hummus', '후무스', 'other', '["g", "큰술"]'::jsonb),
('과카몰리', 'Guacamole', '과카몰리', 'other', '["g", "큰술"]'::jsonb),
('살사', 'Salsa', '살사', 'other', '["g", "ml", "큰술"]'::jsonb)
ON CONFLICT (name) DO NOTHING;
