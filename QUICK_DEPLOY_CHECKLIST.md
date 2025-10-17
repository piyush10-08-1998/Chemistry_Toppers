# Quick Deploy Checklist

Print this and check off as you go!

## Pre-Deployment ✅
- [x] Code pushed to GitHub
- [x] Repository: https://github.com/piyush10-08-1998/Chemistry_Toppers

## Render.com Setup

### 1. Database Setup
- [ ] Sign up at render.com
- [ ] Create PostgreSQL database "chemistry-db"
- [ ] Copy connection details:
  - [ ] Internal Database URL: ___________________
  - [ ] Hostname: ___________________
  - [ ] Port: 5432
  - [ ] Database: chemistry_test_db
  - [ ] Username: ___________________
  - [ ] Password: ___________________
- [ ] Connect via PSQL and run schema file
- [ ] Verify tables created: `\dt`

### 2. Backend Deployment
- [ ] Create Web Service on Render
- [ ] Connect GitHub repo: Chemistry_Toppers
- [ ] Configure:
  - Root Directory: `chemistry-test-platform/backend`
  - Build Command: `npm install`
  - Start Command: `node server-db.js`
- [ ] Add all environment variables (see DEPLOY_NOW.md)
- [ ] Generate JWT secret: `openssl rand -base64 32`
- [ ] Deploy and wait for completion
- [ ] Backend URL: ___________________

### 3. Frontend Deployment
- [ ] Create Static Site on Render
- [ ] Connect GitHub repo
- [ ] Configure:
  - Root Directory: `chemistry-test-platform/frontend`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`
- [ ] Add VITE_API_URL environment variable
- [ ] Deploy and wait for completion
- [ ] Frontend URL: ___________________

### 4. CORS Update
- [ ] Go back to Backend service
- [ ] Update FRONTEND_URL with actual frontend URL
- [ ] Save and wait for redeploy

## Testing
- [ ] Visit frontend URL
- [ ] Register test student account
- [ ] Login as student - see dashboard
- [ ] Login as teacher (teacher@chemistry.com / admin123)
- [ ] Create a test
- [ ] Add questions
- [ ] Take test as student
- [ ] Verify score displays

## Share with Students
- [ ] Test on mobile phone
- [ ] Create student instructions
- [ ] Share URL with students
- [ ] Monitor first few student logins

## Important URLs

**Main Platform:**
___________________________________

**Share This with Students:**
___________________________________

**Backend API:**
___________________________________

**Render Dashboard:**
https://dashboard.render.com

---

## Support Files
- Full Guide: `DEPLOY_NOW.md`
- Features: `PLATFORM_FEATURES.md`
- Troubleshooting: `DEPLOYMENT_GUIDE.md`

## Estimated Time
- Total: 15-20 minutes
- Database: 5 min
- Backend: 5 min
- Frontend: 5 min
- Testing: 5 min

Good luck! 🚀
