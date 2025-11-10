-- Global platform security monitoring
CREATE TABLE IF NOT EXISTS platform_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'admin' or 'tenant'
    user_email VARCHAR(255) NOT NULL,
    hostel_id UUID, -- NULL for super admin
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Global login attempts tracking
CREATE TABLE IF NOT EXISTS platform_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    hostel_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global security events
CREATE TABLE IF NOT EXISTS platform_security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    user_id UUID,
    user_email VARCHAR(255),
    hostel_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform statistics
CREATE TABLE IF NOT EXISTS platform_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    total_active_sessions INTEGER DEFAULT 0,
    total_failed_logins INTEGER DEFAULT 0,
    total_security_events INTEGER DEFAULT 0,
    unique_ips INTEGER DEFAULT 0,
    peak_concurrent_users INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_sessions_active ON platform_sessions(is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_platform_sessions_user ON platform_sessions(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_platform_login_attempts_email ON platform_login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_platform_security_events_type ON platform_security_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(date);

-- Disable RLS for platform monitoring
ALTER TABLE platform_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats DISABLE ROW LEVEL SECURITY;