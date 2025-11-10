# 🗄️ Supabase Database Setup

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name**: nestify-hostel
   - **Database Password**: Create strong password
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for setup

## Step 2: Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://your-project-id.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Update Environment File

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Database Tables

1. Go to **SQL Editor** in Supabase
2. Click "New query"
3. Copy the entire content from `database/schema.sql`
4. Paste it in the editor
5. Click **"Run"**
6. You should see: "Success. No rows returned"

## Step 5: Verify Tables Created

Go to **Table Editor** and verify these tables exist:
- ✅ system_config
- ✅ admins  
- ✅ tenants
- ✅ rooms
- ✅ bills
- ✅ transactions
- ✅ otp_verifications

## Step 6: Test Connection

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. You should see:
   ```
   ✅ All routes loaded successfully
   🚀 Nestify server running on port 5000
   ```

3. Try admin signup with real email
4. Check if OTP is stored in `otp_verifications` table

## 🎯 Quick Test

1. Go to admin signup
2. Use **NestKey**: `NEST2025SECURE`
3. Enter your real email
4. Check Supabase → Table Editor → otp_verifications
5. You should see the OTP record

**Next**: Setup Resend for email delivery!