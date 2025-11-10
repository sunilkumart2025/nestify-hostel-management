-- Security logging tables
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login attempt logging
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_type VARCHAR(20) NOT NULL, -- 'admin' or 'tenant'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password history (prevent password reuse)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Row Level Security (RLS) policies
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access security logs
CREATE POLICY security_logs_policy ON security_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY login_logs_policy ON login_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY user_sessions_policy ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY password_history_policy ON password_history
    FOR ALL USING (auth.role() = 'service_role');

-- Function to clean old security logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_security_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM security_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM login_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Manual cleanup (run periodically via application or admin)
-- To enable automatic cleanup, install pg_cron extension first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then uncomment the line below:
-- SELECT cron.schedule('cleanup-security-logs', '0 2 * * *', 'SELECT cleanup_security_logs();');