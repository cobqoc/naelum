-- auth.users INSERT 시 public.profiles 행을 자동 생성하는 트리거
--
-- 배경: OAuth 콜백에서 exchangeCodeForSession은 auth.users 행을 즉시 생성하지만,
-- 기존에는 profiles 행 생성을 /auth/terms-agreement 페이지의 "동의" 버튼까지 지연시켰다.
-- 사용자가 약관 동의 전에 뒤로가기로 빠져나오면 auth.users만 존재하고 profiles는 없는
-- 좀비 계정이 남았다. 그러면 로그인 상태인데도 헤더/설정에서 "계정 없음"으로 보이고,
-- 같은 계정으로 재가입 시도도 막혔다.
--
-- 해결: 이 트리거는 auth.users 행이 생성되는 순간 기본값으로 profiles 행을 생성해서
-- 두 테이블의 불변조건을 복원한다. 이메일/유저네임 unique 충돌은 콜백 라우트의
-- 기존 duplicate-email 처리 플로우에 맡기기 위해 조용히 스킵한다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_provider TEXT;
  v_username TEXT;
BEGIN
  -- Supabase는 OAuth 가입 시 raw_app_meta_data.provider에 provider명을 기록한다
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- UUID 앞 12자리로 임시 username 생성 (48비트 = 충돌 확률 무시 가능)
  v_username := 'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12);

  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      username,
      auth_provider,
      onboarding_completed,
      onboarding_step,
      marketing_consent
    ) VALUES (
      NEW.id,
      NEW.email,
      v_username,
      v_provider,
      false,
      0,
      false
    );
  EXCEPTION WHEN unique_violation THEN
    -- email 또는 username 충돌 → 조용히 스킵.
    -- 이메일 중복은 콜백 라우트가 profile IS NULL 분기에서 감지해
    -- duplicate-email 페이지로 라우팅한 뒤 좀비 auth.users를 정리한다.
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 백필: 이미 존재하는 좀비 auth.users (profile 없음, email 충돌 없음) 복구
INSERT INTO public.profiles (
  id,
  email,
  username,
  auth_provider,
  onboarding_completed,
  onboarding_step,
  marketing_consent
)
SELECT
  u.id,
  u.email,
  'user_' || substr(replace(u.id::text, '-', ''), 1, 12),
  COALESCE(u.raw_app_meta_data->>'provider', 'email'),
  false,
  0,
  false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = u.email);
