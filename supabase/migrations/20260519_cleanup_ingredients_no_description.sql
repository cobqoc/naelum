-- recipe_extract 출처 중 description 없는 항목 전부 pending
-- 검토되지 않은 자동 추출 garbage 제거 (188개 prod 기준)
UPDATE ingredients_master
SET status = 'pending', updated_at = NOW()
WHERE status = 'approved'
  AND data_source = 'recipe_extract'
  AND description IS NULL;
