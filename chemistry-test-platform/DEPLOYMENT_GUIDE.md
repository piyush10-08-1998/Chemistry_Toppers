# Deployment Guide - Chemistry Test Platform

This guide will help you deploy the Chemistry Test Platform so students can access it from their phones and laptops from anywhere.

## Deployment Options

You have several options to deploy your application:

### Option 1: Render.com (Recommended - FREE)
**Best for: Simple deployment with free PostgreSQL database**

#### Backend Deployment on Render
1. **Create a Render Account**: Go to https://render.com and sign up
2. **Create PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `chemistry-test-db`
   - Copy the "Internal Database URL" (you'll need this)

3. **Deploy Backend**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `chemistry-backend`
     - **Root Directory**: `chemistry-test-platform/backend`
     - **Build Command**: `npm install`
     - **Start Command**: `node server-db.js`
     - **Environment Variables**:
       ```
       PORT=5001
       NODE_ENV=production
       DATABASE_URL=[paste your database URL from step 2]
       DB_HOST=[from database URL]
       DB_PORT=5432
       DB_NAME=chemistry_test_db
       DB_USER=[from database URL]
       DB_PASSWORD=[from database URL]
       JWT_SECRET=[generate using: openssl rand -base64 32]
       JWT_EXPIRES_IN=7d
       FRONTEND_URL=[will add after frontend is deployed]
       ADMIN_EMAIL=teacher@chemistry.com
       ADMIN_PASSWORD=admin123
       ```
   - Click "Create Web Service"
   - Copy your backend URL (e.g., `https://chemistry-backend.onrender.com`)

4. **Setup Database Tables**:
   - In Render Dashboard → Your Database → "Connect"
   - Use the provided connection command
   - Run: `psql [your-database-url] -f src/models/database.sql`

#### Frontend Deployment on Render
1. **Deploy Frontend**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `chemistry-frontend`
     - **Root Directory**: `chemistry-test-platform/frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
     - **Environment Variables**:
       ```
       VITE_API_URL=https://chemistry-backend.onrender.com/api
       ```
   - Click "Create Static Site"

2. **Update Backend CORS**:
   - Go back to your backend service
   - Update `FRONTEND_URL` environment variable with your frontend URL
   - Example: `https://chemistry-frontend.onrender.com`

---

### Option 2: Vercel (Frontend) + Railway (Backend)
**Best for: Fast deployment with good free tiers**

#### Backend on Railway.app
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Add PostgreSQL from the marketplace
4. Configure environment variables similar to Render
5. Copy your backend URL

#### Frontend on Vercel
1. Go to https://vercel.com
2. Import your GitHub repository
3. Framework Preset: Vite
4. Root Directory: `chemistry-test-platform/frontend`
5. Add environment variable: `VITE_API_URL=https://your-railway-backend-url.com/api`
6. Deploy

---

### Option 3: Self-Hosting (VPS)
**Best for: Full control, requires technical knowledge**

Use services like:
- **DigitalOcean**: $5/month droplet
- **AWS EC2**: Free tier available
- **Linode**: $5/month
- **Hetzner**: €4/month

#### Steps:
1. Set up Ubuntu server
2. Install Node.js, PostgreSQL, Nginx
3. Clone your repository
4. Setup database and run migrations
5. Configure Nginx as reverse proxy
6. Use PM2 to keep backend running
7. Setup SSL certificate (Let's Encrypt)

---

## Important Configuration Changes

### 1. Update CORS Settings
In `backend/server-db.js:40-43`, update the CORS configuration with your deployed frontend URL:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-url.com',
  credentials: true
}));
```

### 2. Secure Your JWT Secret
Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

### 3. Change Admin Password
After first login, change the default admin password!

---

## Mobile Access

Once deployed, students can access the platform by:

1. **On Mobile Phones**:
   - Open any web browser (Chrome, Safari, Firefox)
   - Navigate to your deployed URL
   - Login with their credentials
   - Works on iOS and Android

2. **On Laptops**:
   - Open any modern web browser
   - Navigate to your deployed URL
   - Full desktop experience

3. **Add to Home Screen** (Mobile):
   - iOS: Safari → Share → "Add to Home Screen"
   - Android: Chrome → Menu → "Add to Home Screen"
   - Works like a native app!

---

## Post-Deployment Checklist

- [ ] Database is accessible and tables are created
- [ ] Backend is running and accessible
- [ ] Frontend can connect to backend API
- [ ] CORS is configured correctly
- [ ] JWT secret is secure and not the default
- [ ] Admin can login with default credentials
- [ ] Students can register and login
- [ ] Tests can be created and taken
- [ ] SSL certificate is installed (HTTPS)
- [ ] Default admin password has been changed

---

## Testing Your Deployment

1. **Test Backend**:
   - Visit: `https://your-backend-url.com/api/health`
   - Should return: `{"status":"OK","message":"Chemistry Test Platform API is running"}`

2. **Test Frontend**:
   - Visit: `https://your-frontend-url.com`
   - Login page should load
   - Try logging in as teacher

3. **Test Full Flow**:
   - Teacher: Create a test and add questions
   - Student: Register, take test, view results
   - Teacher: View student analytics

---

## Sharing with Students

Once deployed, share:
- **URL**: `https://your-frontend-url.com`
- **Registration**: Students should register as "Student" role
- **Instructions**: First-time users need to create an account

You can create a QR code for easy mobile access:
- Use https://qr-code-generator.com
- Enter your deployed URL
- Print or share the QR code

---

## Cost Breakdown

### Free Option (Render):
- PostgreSQL: Free (1GB storage)
- Backend: Free (750 hours/month)
- Frontend: Free
- **Total: $0/month** ✅

### Paid Option (Better Performance):
- Render Starter Plan: $7/month
- PostgreSQL: $7/month
- **Total: $14/month**

---

## Troubleshooting

**Students can't access the site**:
- Check if URL is correct and HTTPS
- Verify backend is running
- Check browser console for errors

**Database connection errors**:
- Verify DATABASE_URL is correct
- Check if database tables are created
- Ensure database is running

**CORS errors**:
- Update FRONTEND_URL in backend environment variables
- Redeploy backend after changes

**Students can't login**:
- Verify they're registering as "student" role
- Check if backend API is accessible
- Look at backend logs for errors

---

## Support

For issues:
1. Check backend logs in your hosting platform
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test the `/api/health` endpoint

---

## Next Steps

1. Choose your deployment platform (Render recommended for beginners)
2. Follow the deployment steps above
3. Test thoroughly before sharing with students
4. Share the URL with your students
5. Monitor usage and performance

Good luck with your deployment! 🚀
