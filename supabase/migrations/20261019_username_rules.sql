-- 닉네임 규칙을 DB 에서도 강제 (2026-10-19 감사 PAU-52·PAU-37)
-- 온보딩 위저드는 약관 동의 전(온보딩 미완료) 세션에서도 돌아 변경 API 게이트(proxy.ts)를 못 지나므로 지금도
-- 클라이언트가 profiles.username 을 직접 update 한다. 서버 검증(lib/utils/usernameValidator)을 우회한 직접 쓰기에
-- 대비해 DB 가 최소한의 형식·운영진 사칭을 막는다. 욕설 필터 등 나머지는 서버 라우트(PUT /api/users/me·check-username).
--
-- 1) 대소문자만 다른 닉네임 공존 금지 — prod 실측(2026-10-19): lower(username) 중복 0건.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));

-- 2) 닉네임이 *바뀔 때만* 검사 — 기존 행(관리자 'Naelum(낼름)' 등)은 그대로 둔다.
CREATE OR REPLACE FUNCTION public.enforce_username_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  norm text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.username IS NOT DISTINCT FROM OLD.username THEN
    RETURN NEW;
  END IF;
  IF NEW.username IS NULL THEN
    RETURN NEW;
  END IF;

  -- 형식: lib/utils/usernameValidator.ts validateUsernameFormat 과 동일 (2~20자, 한글·영문·숫자·_)
  IF NEW.username !~ '^[a-zA-Z0-9_가-힣ㄱ-ㅎㅏ-ㅣ]{2,20}$' THEN
    RAISE EXCEPTION 'invalid username format' USING ERRCODE = 'check_violation';
  END IF;

  -- 운영진·브랜드 사칭 — 서버 검증 목록(ADMIN_RESERVED·BRAND_RESERVED)의 핵심만. 정규화는 소문자 + '_' 제거.
  norm := replace(lower(NEW.username), '_', '');
  IF norm IN ('admin', 'administrator', 'moderator', 'root', 'system', 'staff', 'support',
              'official', 'verified', 'owner', 'naelum', 'nael',
              '관리자', '운영자', '운영진', '스태프', '공식', '낼름')
     OR norm LIKE '%admin%' OR norm LIKE '%naelum%' OR norm LIKE '%official%'
     OR norm LIKE '%관리자%' OR norm LIKE '%운영자%' OR norm LIKE '%낼름%' THEN
    RAISE EXCEPTION 'reserved username' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_username_rules() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_username_rules ON public.profiles;
CREATE TRIGGER trg_enforce_username_rules
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_username_rules();
