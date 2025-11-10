-- Enable all security tables without RLS restrictions
ALTER TABLE platform_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all restrictive policies
DROP POLICY IF EXISTS security_logs_policy ON security_logs;
DROP POLICY IF EXISTS login_logs_policy ON login_logs;
DROP POLICY IF EXISTS user_sessions_policy ON user_sessions;

-- Test insert to verify tables work
INSERT INTO platform_security_events (event_type, severity, details) 
VALUES ('SYSTEM_TEST', 'medium', '{"message": "Security logging test"}');

INSERT INTO platform_login_attempts (email, user_type, success) 
VALUES ('test@example.com', 'admin', true);