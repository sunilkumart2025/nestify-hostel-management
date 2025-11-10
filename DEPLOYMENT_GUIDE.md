# 🚀 Nestify Deployment Guide

## Prerequisites
- GitHub account
- Railway account (railway.app)
- Vercel account (vercel.com)
- Supabase project setup
- Resend account for emails

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository
```bash
cd nestify-hostel-management
git init
git add .
git commit -m "Initial commit - Nestify Hostel Management System"
```

### 1.2 Create GitHub Repository
1. Go to GitHub.com
2. Click "New Repository"
3. Name: `nestify-hostel-management`
4. Make it Public
5. Don't initialize with README (we already have files)
6. Click "Create Repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/nestify-hostel-management.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Railway

### 2.1 Connect GitHub to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `nestify-hostel-management`
6. Select the **root directory** (not backend folder)

### 2.2 Configure Railway Settings
1. In Railway dashboard, click your project
2. Go to "Settings" tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start`
5. Set **Build Command**: `npm install`

### 2.3 Add Environment Variables
In Railway project settings → Variables, add:
```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=https://your-app-name.vercel.app
```

### 2.4 Deploy Backend
1. Railway will auto-deploy after adding variables
2. Note your Railway URL: `https://your-app-name.railway.app`
3. Test: `https://your-app-name.railway.app/health`

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import `nestify-hostel-management`
5. Set **Root Directory**: `frontend`

### 3.2 Configure Vercel Settings
1. Framework Preset: **Create React App**
2. Root Directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `build`
5. Install Command: `npm install`

### 3.3 Add Environment Variables
In Vercel project settings → Environment Variables:
```
REACT_APP_API_URL=https://your-backend-name.railway.app
```

### 3.4 Deploy Frontend
1. Click "Deploy"
2. Vercel will build and deploy
3. Note your Vercel URL: `https://your-app-name.vercel.app`

## Step 4: Update CORS Settings

### 4.1 Update Railway Environment
1. Go back to Railway project
2. Update `FRONTEND_URL` variable with your actual Vercel URL:
```
FRONTEND_URL=https://your-actual-app-name.vercel.app
```

### 4.2 Redeploy Backend
1. Railway will auto-redeploy with new CORS settings

## Step 5: Test Your Live Application

### 5.1 Test Backend
- Health check: `https://your-backend.railway.app/health`
- Should return: `{"status":"OK","timestamp":"..."}`

### 5.2 Test Frontend
- Open: `https://your-frontend.vercel.app`
- Try admin signup with NestKey: `NEST2025SECURE`
- Test login functionality

## Step 6: Custom Domain (Optional)

### 6.1 Frontend Domain
1. In Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 6.2 Backend Domain
1. In Railway project → Settings → Domains
2. Add custom domain
3. Update `REACT_APP_API_URL` in Vercel

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check `FRONTEND_URL` in Railway matches Vercel URL exactly
   - Ensure no trailing slashes

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies in package.json

3. **Environment Variables**
   - Double-check all required variables are set
   - Ensure no spaces in variable names/values

4. **Database Connection**
   - Verify Supabase URL and keys
   - Check database schema is properly set up

### Support Commands:
```bash
# Check Railway logs
railway logs

# Redeploy Vercel
vercel --prod

# Test local build
npm run build
```

## Security Checklist
- [ ] All environment variables set correctly
- [ ] JWT_SECRET is strong and unique
- [ ] Database RLS policies enabled
- [ ] CORS configured properly
- [ ] No sensitive data in repository

## Post-Deployment
1. Test all functionality thoroughly
2. Set up monitoring/alerts
3. Configure backup strategies
4. Document admin credentials securely

---

🎉 **Congratulations!** Your Nestify Hostel Management System is now live!

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-api.railway.app