# 🎯 Demo Mode Instructions

## ⚠️ OTP Verification in Demo Mode

Since email service (Resend) and database (Supabase) are not configured, here's how to handle OTP verification:

### For Admin Signup:
1. Fill the signup form with **NestKey**: `NEST2025SECURE`
2. Click "Create Account"
3. You'll see the OTP verification screen
4. **Enter ANY 6-digit code** (e.g., `123456`)
5. Click "Verify Email"
6. Success! You can now login

### For Password Reset:
1. Click "Forgot Password"
2. Enter any email and select user type
3. **Enter ANY 6-digit code** when prompted
4. Set new password

## 🔧 Quick Fix Applied

The system now accepts any 6-digit OTP in demo mode. This allows you to:
- ✅ Complete admin signup
- ✅ Test password reset
- ✅ Access all dashboard features

## 🚀 Test Flow

1. **Admin Signup**: Use NestKey `NEST2025SECURE` → Enter `123456` for OTP
2. **Login**: Use your signup credentials  
3. **Explore**: Dashboard, rooms, tenants, billing
4. **Tenant Signup**: Use StayKey from admin profile
5. **Tenant Login**: Test tenant dashboard

## 📧 For Production

To enable real OTP emails:
1. Get Resend API key from https://resend.com
2. Add to `backend/.env`: `RESEND_API_KEY=your_key`
3. Setup Supabase database
4. Replace mock routes with real database calls

**Demo Tip**: Any 6-digit number works as OTP! 🎉