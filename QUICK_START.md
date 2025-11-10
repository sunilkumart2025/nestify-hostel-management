# 🚀 Quick Start Guide

## Immediate Setup (No External Services Required)

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Start the Frontend  
```bash
cd frontend
npm start
```

The application will now run at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## ⚠️ Current Status
- ✅ Frontend and Backend servers running
- ⚠️ Database not connected (need Supabase setup)
- ⚠️ Email service not configured (need Resend setup)
- ⚠️ Payment gateway not configured (need Razorpay setup)

## 🔧 Next Steps for Full Functionality

### 1. Setup Supabase Database
1. Go to https://supabase.com
2. Create new project
3. Copy your project URL and keys
4. Update `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```
5. Run the SQL from `database/schema.sql` in Supabase SQL Editor

### 2. Setup Email Service (Resend)
1. Go to https://resend.com
2. Get API key
3. Update `backend/.env`:
   ```env
   RESEND_API_KEY=your_resend_api_key
   ```

### 3. Setup Payment Gateway (Razorpay)
1. Go to https://razorpay.com
2. Create account and get credentials
3. Configure in admin profile after login

## 🎯 Test the Application
1. Visit http://localhost:3000
2. Click "Get Started as Admin"
3. Use NestKey: `NEST2025SECURE`
4. Complete signup (email verification will fail without Resend)
5. Explore the interface

## 📞 Need Help?
- Check the console for any errors
- Ensure both servers are running
- Verify environment files are created