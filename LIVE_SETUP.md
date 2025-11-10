# 🚀 Live Mode Setup Guide

## Step 1: Setup Supabase Database

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Create new project
4. Wait for setup to complete

### 1.2 Get Credentials
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**
   - **anon public key**
   - **service_role key**

### 1.3 Setup Database
1. Go to SQL Editor in Supabase
2. Copy and paste the entire content from `database/schema.sql`
3. Click "Run" to create all tables

## Step 2: Setup Resend Email Service

### 2.1 Create Resend Account
1. Go to https://resend.com
2. Sign up for free account
3. Go to API Keys
4. Create new API key
5. Copy the API key

## Step 3: Update Environment Variables

Update `backend/.env` with your real credentials:

```env
PORT=5000
NODE_ENV=development

# Replace with your Supabase credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

JWT_SECRET=nestify_super_secret_jwt_key_2025
JWT_EXPIRES_IN=7d

# Replace with your Resend API key
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 4: Restore Live Routes

I'll restore the original routes that connect to the database.

## Step 5: Test Live Mode

1. Restart backend server
2. Try admin signup with real email
3. Check email for OTP
4. Complete verification

## 🔧 Quick Commands

```bash
# 1. Update environment
nano backend/.env

# 2. Restart backend
cd backend && npm run dev

# 3. Test signup
# Use your real email address
```