# Email Verification Setup Guide

## What Was Implemented

Your Chemistry Toppers platform now has **Email Verification** to prevent fake emails! When users register, they must verify their email before they can login.

## How It Works

1. **User Registers** → System generates verification token
2. **Email Sent** → Beautiful HTML email with verification link
3. **User Clicks Link** → Email is verified
4. **User Can Login** → Only after verification

---

## Setup Instructions (5 Minutes)

### Step 1: Get Gmail App Password (FREE)

1. **Go to your Gmail account settings**
   - Visit: https://myaccount.google.com/apppasswords
   - Or Google: "Gmail App Password"

2. **Enable 2-Step Verification** (if not already enabled)
   - Settings → Security → 2-Step Verification
   - Follow the prompts to enable it

3. **Generate App Password**
   - Go back to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Type "Chemistry Toppers"
   - Click "Generate"
   - **IMPORTANT:** Copy the 16-character password (like: `abcd efgh ijkl mnop`)

### Step 2: Update .env File

Open `/backend/.env` and update these lines:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-actual-email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop  # 16-char password from Step 1 (no spaces)
```

**Example:**
```env
EMAIL_USER=piyush@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

### Step 3: Restart Backend Server

```bash
cd backend
npm run dev
```

---

## Testing Email Verification

### Test 1: Register New User
1. Go to http://localhost:5174
2. Click "Register"
3. Fill in details with a **REAL email** (your email)
4. Click Register
5. Check your email inbox for verification link
6. Click the verification link
7. You should see "Email Verified!" page
8. Now login with your credentials

### Test 2: Try Logging In Before Verification
1. Register with another email
2. Try to login WITHOUT clicking verification link
3. You should see: "Please verify your email before logging in"

---

## What Emails Look Like

### Verification Email
- **Subject:** Verify Your Email - Chemistry Toppers
- **Contains:** Beautiful branded email with verification button
- **Expires:** 24 hours

---

## Important Notes

### Existing Users
- ✅ All existing users (like teacher@chemistry.com) are **already verified**
- ✅ They can login immediately without verification

### New Users
- ❌ Must verify email before login
- ✅ Prevents fake/disposable emails
- ✅ Ensures real, accessible email addresses

### Email Limits (FREE Gmail)
- 500 emails/day (FREE forever)
- Perfect for your use case
- No cost involved

---

## Production Deployment

When deploying to production:

1. **Update .env on your server** with your Gmail credentials
2. **Update FRONTEND_URL** in .env:
   ```env
   FRONTEND_URL=https://your-actual-domain.com
   ```
3. Emails will automatically use the production URL in verification links

---

## Troubleshooting

### "Failed to send verification email"
- **Check:** EMAIL_USER and EMAIL_APP_PASSWORD in .env
- **Check:** 2-Step Verification is enabled on Gmail
- **Check:** App Password is correct (16 characters, no spaces)
- **Try:** Restart backend server after changing .env

### "Email not received"
- **Check spam/junk folder**
- **Wait 1-2 minutes** (sometimes delayed)
- **Try different email** (Gmail, Yahoo, etc.)

### "Invalid verification token"
- Link may have expired (24 hours)
- User needs to register again

---

## Security Features

✅ **Blocks disposable emails** (tempmail.com, etc.)
✅ **Requires real email verification**
✅ **Tokens expire after 24 hours**
✅ **One-time use tokens**
✅ **Existing users not affected**

---

## Cost

**$0 - Completely FREE!**
- Gmail SMTP: FREE (500 emails/day)
- No credit card required
- No monthly fees
- Perfect for starting out

---

## Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your Gmail App Password setup
3. Check backend console for error messages
4. Make sure backend server restarted after .env changes

---

**You're all set! Email verification is now active. 🎉**
