-- Rate limiting table for serverless-safe rate limiting
-- Replaces in-memory Map that doesn't persist across Vercel serverless instances

CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT PRIMARY KEY,
  count       INTEGER NOT NULL DEFAULT 1,
  reset_at    TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Atomic check-and-increment to avoid race conditions
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier   TEXT,
  p_window_ms    BIGINT,
  p_max_requests INTEGER
) RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_now           TIMESTAMPTZ := NOW();
  v_reset_at      TIMESTAMPTZ := v_now + (p_window_ms || ' milliseconds')::INTERVAL;
  v_count         INTEGER;
  v_stored_reset  TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limits (identifier, count, reset_at, updated_at)
  VALUES (p_identifier, 1, v_reset_at, v_now)
  ON CONFLICT (identifier) DO UPDATE
    SET
      count      = CASE
                     WHEN rate_limits.reset_at < v_now THEN 1
                     ELSE rate_limits.count + 1
                   END,
      reset_at   = CASE
                     WHEN rate_limits.reset_at < v_now THEN v_reset_at
                     ELSE rate_limits.reset_at
                   END,
      updated_at = v_now
  RETURNING rate_limits.count, rate_limits.reset_at
  INTO v_count, v_stored_reset;

  RETURN QUERY SELECT
    v_count <= p_max_requests,
    v_count,
    v_stored_reset;
END;
$$;

-- Cleanup function (call periodically via cron or Supabase pg_cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- No RLS needed — only accessed via SECURITY DEFINER functions with service role
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;

GRANT EXECUTE ON FUNCTION check_rate_limit  TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO service_role;
