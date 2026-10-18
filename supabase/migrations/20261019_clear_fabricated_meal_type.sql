-- 레시피 meal_type 의 가짜 'lunch' 값 정리 (2026-10-04 감사 PHR-05 후속)
-- 레시피 작성·수정 폼에 식사 시간 입력이 없는데 저장 코드가 항상 'lunch' 를 넣었다(7924bf2 에서 제거).
-- prod 실측(2026-10-19): meal_type 값은 NULL 1,452 · 'lunch' 13 뿐 — 임포트 스크립트는 NULL 을 넣으므로
-- 'lunch' 13건은 전부 폼이 지은 값. CLAUDE.md 데이터 무결성 규칙대로 확인 안 된 값은 NULL 로 되돌린다.
-- 식사 시간 추천(app/api/recommendations type=meal_time)은 현재 UI 가 없어 화면 변화 없음.
UPDATE public.recipes SET meal_type = NULL WHERE meal_type = 'lunch';
