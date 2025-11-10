# Nestify Setup Guide

## Prerequisites
- Node.js (v16+)
- Supabase account
- Razorpay account
- Resend account

## Quick Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Setup

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@nestify.com

BCRYPT_ROUNDS=12
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Database Setup
1. Create Supabase project
2. Run `database/schema.sql`
3. Update NestKey in system_config table

### 4. Start Application
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm start
```

## Default Credentials
- **NestKey**: NEST2025SECURE
- **Admin**: Create account with NestKey
- **Tenant**: Use admin's StayKey

## Payment Setup
1. Get Razorpay credentials
2. Add to admin profile after login
3. Test with sandbox mode

## Email Setup
1. Get Resend API key
2. Configure domain (optional)
3. Test OTP delivery

Visit http://localhost:3000 to access the application.