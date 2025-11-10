-- Session Management Table
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('admin', 'tenant')),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get active session count
CREATE OR REPLACE FUNCTION get_active_session_count()
RETURNS INTEGER AS $$
DECLARE
    session_count INTEGER;
BEGIN
    -- Clean expired sessions first
    PERFORM cleanup_expired_sessions();
    
    -- Count active sessions
    SELECT COUNT(*) INTO session_count
    FROM active_sessions 
    WHERE is_active = TRUE AND expires_at > NOW();
    
    RETURN session_count;
END;
$$ LANGUAGE plpgsql;