const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we're in demo mode (placeholder URLs)
const isDemoMode = !supabaseUrl || 
                   supabaseUrl === 'https://your-project.supabase.co' || 
                   !supabaseAnonKey || 
                   supabaseAnonKey.startsWith('your-anon-key');

if (isDemoMode) {
  console.warn('Supabase environment variables not configured. Running in demo mode.');
  // Create mock clients for development
  module.exports = {
    supabase: { from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: 'Not configured' }) }) }) }) },
    supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: 'Not configured' }) }) }) }) }
  };
  return;
}

console.log('✅ Supabase configured with URL:', supabaseUrl);

// Client for general operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for privileged operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };