-- Restrict sensitive columns from anonymous users
-- Anon users should only see: id, username, display_name, avatar_url, bio, created_at, status

REVOKE SELECT (
  email,
  auth_provider,
  birth_date,
  gender,
  email_notifications,
  push_notifications,
  meal_time_notifications,
  last_login_at,
  onboarding_completed,
  onboarding_step,
  role,
  marketing_consent,
  marketing_consent_at,
  search_vector
) ON public.profiles FROM anon;
