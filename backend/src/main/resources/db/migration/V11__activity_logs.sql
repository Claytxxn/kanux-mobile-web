CREATE TABLE IF NOT EXISTS activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID,
    user_profile_id UUID,
    user_name   TEXT,
    method      VARCHAR(10),
    endpoint    TEXT,
    status      INT,
    action_type VARCHAR(50),
    description TEXT,
    ip_address  VARCHAR(64),
    duration_ms BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id   ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at   ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_profile ON activity_logs(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status       ON activity_logs(status);
