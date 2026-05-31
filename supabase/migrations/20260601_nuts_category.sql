-- 견과류(nuts) 카테고리 신설 — 나무 견과를 legume(콩류)에서 분리 (2026-06-01)
-- 사유: 아몬드·잣·호두는 나무 견과(tree nuts)라 콩과 식물(legume) 아님. 정확성 위해 분리.
--   땅콩(peanut)은 식물학적으로 진짜 콩과 → legume(콩류) 유지(사용자 결정: 식물학적 정확).
--   두부(콩 가공) → legume 유지.
-- legume 라벨 "콩·견과" → "콩류"로 코드(i18n·도감·picker) 정정 동반.
-- ⚠️ dev 대상. prod는 해당 재료(아몬드·잣·호두) 미보유라 영향 없음.
UPDATE ingredients_master SET category = 'nuts'
WHERE name IN ('아몬드', '잣', '호두') AND status = 'approved';
