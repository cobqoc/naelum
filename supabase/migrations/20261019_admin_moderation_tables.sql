-- ================================================
-- 관리자 차단·활동 로그·대시보드 통계 테이블 (20260209_add_admin_role 의 미적용분 재작성)
-- ================================================
-- 20260209_add_admin_role.sql·20260209_enhance_admin_security.sql 은 dev·prod 어디에도 적용되지 않았다
-- (2026-10-18 실측: banned_users·admin_actions·admin_dashboard_stats·reports.action_taken 없음,
-- profiles.role 은 다른 경로로 이미 존재). 그래서 관리자 차단은 항상 저장 실패, 활동 로그·대시보드
-- 통계·신고 처리(action_taken 갱신)는 실패하거나 빈 값이었다. 코드가 기대하는 모양을 현재 스키마에 맞춰 만든다.
--
-- 옛 파일과 다른 점:
--   · admin_id·banned_by 는 NULL 허용 — ON DELETE SET NULL 과 NOT NULL 이 충돌하던 정의를 바로잡음
--   · 통계 뷰는 is_published(없는 컬럼)·recipe_comments(폐기) 대신 status='published'·recipe_posts 를 센다
--   · 통계 뷰는 security_invoker + service_role 전용 — 관리자 API 가 관리자 확인 후 service-role 로 읽는다
--   · 사용자 본인은 자기 차단 행(만료 전)만 읽을 수 있다 — proxy.ts 가 사용자 컨텍스트로 차단 여부를 확인하기 때문
--   · is_admin()·is_user_banned() 함수는 만들지 않는다(코드가 쓰지 않음. prod 에는 is_user_banned(check_user_id) 가
--     이미 있어 이 테이블이 생기면서 정상 동작하게 됐고, 그대로 둔다)
-- ✅ 2026-10-19 적용: dev → 검증(e2e 488 passed) → prod

-- 1. 신고 처리 내용
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS action_taken VARCHAR(50);

-- 2. 관리자 활동 로그
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- 3. 차단된 사용자
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  ban_type VARCHAR(20) NOT NULL DEFAULT 'permanent' CHECK (ban_type IN ('permanent', 'temporary')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by ON public.banned_users(banned_by);

-- 4. RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can insert own admin actions" ON public.admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    admin_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins or the banned user can view bans" ON public.banned_users
  FOR SELECT TO authenticated
  USING (
    (user_id = (SELECT auth.uid()) AND (ban_type = 'permanent' OR expires_at IS NULL OR expires_at > NOW()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can insert bans" ON public.banned_users
  FOR INSERT TO authenticated
  WITH CHECK (
    banned_by = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete bans" ON public.banned_users
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- 5. 대시보드 통계 뷰 — service_role 전용 (app/api/admin/dashboard 가 관리자 확인 후 읽음)
CREATE OR REPLACE VIEW public.admin_dashboard_stats
WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_week,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_month,
  (SELECT COUNT(*) FROM public.recipes WHERE status = 'published') AS total_recipes,
  (SELECT COUNT(*) FROM public.recipes WHERE created_at >= NOW() - INTERVAL '7 days') AS new_recipes_week,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'pending') AS pending_reports,
  (SELECT COUNT(*) FROM public.banned_users) AS banned_users_count,
  (SELECT COUNT(*) FROM public.recipe_views WHERE created_at >= NOW() - INTERVAL '24 hours') AS views_today,
  (SELECT COUNT(*) FROM public.recipe_posts WHERE created_at >= NOW() - INTERVAL '7 days') AS comments_week;

REVOKE ALL ON public.admin_dashboard_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_dashboard_stats TO service_role;

COMMENT ON TABLE public.admin_actions IS '관리자 활동 로그';
COMMENT ON TABLE public.banned_users IS '차단된 사용자 (본인은 만료 전 자기 행만 조회 — proxy.ts 차단 확인)';
