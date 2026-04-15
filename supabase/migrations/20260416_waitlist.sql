-- 이메일 수집 테이블 (런칭 전/후 초기 유저 유치용)
-- 지인 DM, 유튜브 영상 설명란, 커뮤니티 홍보 등에서 "출시 알림 받기" 폼 용도.

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,              -- "home_page", "landing", "yt_desc" 등 유입 경로 추적
  language text,            -- 수집 시점 유저 locale (ko/en/ja/...)
  user_agent text,          -- 디바이스 파악
  referrer text,            -- 어디서 왔는지
  notified_at timestamptz,  -- 알림 발송 시점 (런칭 시 bulk notify)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email_unique ON public.waitlist (lower(email));
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON public.waitlist (source);

-- RLS: 클라이언트에서 직접 읽기/쓰기 차단. 모든 접근은 /api/waitlist route handler 경유.
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- anon/authenticated 모두 직접 INSERT 불가 — service role만 허용
CREATE POLICY "waitlist_no_select" ON public.waitlist FOR SELECT USING (false);
CREATE POLICY "waitlist_no_insert" ON public.waitlist FOR INSERT WITH CHECK (false);
