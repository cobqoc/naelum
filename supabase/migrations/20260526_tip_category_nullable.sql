-- 2026-05-26: tip.category NULL 허용 + 한글 DEFAULT 제거
--
-- 배경: 카테고리 미선택 시 자동 '기타' 저장이 사용자 의도와 무관하게 일어남.
-- 사용자가 능동적으로 '기타' 선택 vs 미선택 구분 불가 → 데이터 품질 저하.
-- 또한 DEFAULT '기타' 가 locale-stable 영문 key (prep/storage/cooking/tools/measuring/other) 와 모순.
-- 2026-05-25 카테고리 키 마이그레이션(한글값 → 영문 key) 의 누락분.
--
-- 변경 후 동작:
--  - 미선택 = NULL 저장 (분류 안 함)
--  - 사용자 능동 선택 = 영문 key 저장 (prep|storage|cooking|tools|measuring|other)
--  - API POST /api/tip 는 빈 입력을 NULL 로 변환 (별도 코드 변경)
--
-- 안전성:
--  - NOT NULL → NULL 완화는 기존 데이터 영향 0 (기존 행은 그대로 영문 key 보유)
--  - DEFAULT 제거 후 INSERT 시 명시값 없으면 NULL — API 가 항상 명시
--  - 표시 코드 (tip/[id]/page.tsx·TipCard.tsx 등) NULL safe `?? fallback` 패턴 전수 확인됨

ALTER TABLE tip ALTER COLUMN category DROP NOT NULL;
ALTER TABLE tip ALTER COLUMN category DROP DEFAULT;
