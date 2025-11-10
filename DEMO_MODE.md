# 🎯 Demo Mode - Test the Application

## Current Status: DEMO MODE ACTIVE ✅

The application is now running in **demo mode** with mock data. You can test all features without setting up external services.

## 🚀 How to Test

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

### 2. Test Admin Flow
1. Go to http://localhost:3000
2. Click **"Get Started as Admin"**
3. Fill the signup form with:
   - **NestKey**: `NEST2025SECURE`
   - Any other details you want
4. Click **"Create Account"**
5. You'll see a success message (email verification is mocked)
6. Go to **Admin Login** and login with your email/password
7. Explore the admin dashboard with sample data

### 3. Test Tenant Flow  
1. Click **"Join as Tenant"**
2. Fill the signup form with:
   - **StayKey**: `STAY12345678` (from admin profile)
   - Any other details you want
3. Login and explore tenant dashboard

## 🎮 What You Can Test

### ✅ Working Features (Demo Mode)
- Landing page with premium design
- Admin/Tenant signup and login
- Dashboard with sample data
- Room management interface
- Tenant management interface
- Billing interface
- Payment interface (mock)
- Profile management
- Navigation and UI components

### ⚠️ Limited Features (Need Real Services)
- Email OTP verification
- Real payment processing
- PDF invoice generation
- Data persistence

## 🔧 Upgrade to Full Mode

When ready for production:
1. Setup Supabase database
2. Configure Resend for emails  
3. Add Razorpay credentials
4. Replace mock routes with real database calls

## 🎯 Demo Credentials

- **Admin NestKey**: `NEST2025SECURE`
- **Tenant StayKey**: `STAY12345678`
- **Any email/password**: Works in demo mode

Enjoy testing the complete Nestify experience! 🏠