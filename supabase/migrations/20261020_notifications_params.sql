-- 2026-10-20 ICL-40: 앱 내 알림을 사용자 언어로 보여주기 위한 템플릿 값.
-- 지금까지 title·message 에 한국어 완성문만 저장해 비한국어 화면에도 한국어가 떴다.
-- 새 알림은 params(행위자·레시피 제목·별점·재료명·남은 일수)도 함께 저장하고, 웹 화면은
-- lib/notifications/render.ts 가 이 값으로 번역 템플릿을 채운다. title·message 는 KMP 앱·GDPR 내보내기·
-- 옛 행 호환으로 계속 저장한다(params 가 없으면 저장 문구를 그대로 표시).
-- 추가 전용 — 기존 행·RLS(본인 SELECT/UPDATE/DELETE)·삽입 경로(service-role) 변화 없음.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS params jsonb;

COMMENT ON COLUMN public.notifications.params IS
  '알림 문구 번역용 값 (actor·recipe·rating·ingredient·days). NULL 이면 title·message 를 그대로 표시';
