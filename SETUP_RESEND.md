# 📧 Resend Email Setup

## Step 1: Create Resend Account

1. Go to https://resend.com
2. Click "Get Started"
3. Sign up with your email
4. Verify your email address

## Step 2: Get API Key

1. Go to **API Keys** in dashboard
2. Click "Create API Key"
3. Enter name: "Nestify Hostel"
4. Select permissions: "Sending access"
5. Click "Add"
6. **Copy the API key** (starts with `re_`)

## Step 3: Update Environment

Edit `backend/.env`:

```env
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

**Note**: You can use any email for FROM_EMAIL initially.

## Step 4: Test Email Sending

1. Restart backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Try admin signup with your real email
3. Check your inbox for OTP email
4. Check backend console for email logs

## Step 5: Setup Custom Domain (Optional)

### For Production Use:

1. Go to **Domains** in Resend
2. Click "Add Domain"
3. Enter your domain: `yourdomain.com`
4. Add DNS records as shown
5. Verify domain
6. Update FROM_EMAIL to: `noreply@yourdomain.com`

### For Testing:
You can use the default Resend domain for now.

## 🧪 Test Email Flow

1. **Admin Signup**:
   - Use real email address
   - Check inbox for OTP
   - Enter OTP to verify

2. **Password Reset**:
   - Click "Forgot Password"
   - Enter email
   - Check inbox for reset OTP

## 📊 Monitor Emails

In Resend dashboard:
- **Logs**: See all sent emails
- **Analytics**: Email delivery stats
- **Suppressions**: Bounced emails

## 🚨 Troubleshooting

**No emails received?**
1. Check spam folder
2. Verify API key is correct
3. Check backend console for errors
4. Try different email address

**API Key Issues?**
1. Make sure key starts with `re_`
2. No extra spaces in .env file
3. Restart backend after changes

**Ready for production!** 🎉