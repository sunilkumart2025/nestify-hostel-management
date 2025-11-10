-- Disable RLS temporarily to allow logging
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS security_logs_policy ON security_logs;
DROP POLICY IF EXISTS login_logs_policy ON login_logs;

-- Create more permissive policies
CREATE POLICY security_logs_policy ON security_logs
    FOR ALL USING (true);

CREATE POLICY login_logs_policy ON login_logs
    FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;