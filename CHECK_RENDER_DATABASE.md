# Check if Render Database is Properly Setup

## Step 1: Connect to Your Render Database

1. Go to Render Dashboard → Your PostgreSQL database
2. Click "Connect" section
3. Copy the PSQL command (looks like):
   ```
   PGPASSWORD=xxxxx psql -h dpg-xxxxx.oregon-postgres.render.com -U chemistry_db_user chemistry_test_db
   ```
4. Open Terminal and paste it

## Step 2: Check if Tables Exist

Once connected (you'll see `chemistry_test_db=>`), run these commands:

### Check if tables exist:
```sql
\dt
```

**You should see:**
- users
- tests
- questions
- test_attempts
- student_answers

### If tables DON'T exist, run this:
```sql
\i /Users/piyushsinghmandavi/Chemistry_Toppers/chemistry-test-platform/backend/src/models/database.sql
```

### Check if admin user exists:
```sql
SELECT email, name, role FROM users WHERE role = 'teacher';
```

**You should see:**
- teacher@chemistry.com | Chemistry Teacher | teacher

## Step 3: Check Render Backend Logs

1. Go to Render Dashboard
2. Click your **backend service** (chemistry-toppers-backend)
3. Click "Logs" tab
4. Try adding a question again on the frontend
5. Watch the logs - you'll see the EXACT error

## Common Errors and Fixes:

### Error: "relation 'questions' does not exist"
**Fix:** Run the database.sql script (Step 2)

### Error: "column 'image_url' does not exist"
**Fix:** Your database has old schema. Drop and recreate:
```sql
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
\i /Users/piyushsinghmandavi/Chemistry_Toppers/chemistry-test-platform/backend/src/models/database.sql
```

### Error: "insert or update on table 'questions' violates foreign key constraint"
**Fix:** The test_id doesn't exist. Create a test first, then add questions.

### Error: "password authentication failed"
**Fix:** Check DB_PASSWORD in Render environment variables

## Step 4: Test Backend API Directly

Test if backend is working by visiting:
```
https://your-backend-url.onrender.com/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Chemistry Test Platform API is running",
  "database": "Connected",
  "users": 1
}
```

If "database": "Error", your database connection is broken.

## Quick Commands Reference

**Exit psql:**
```
\q
```

**List all tables:**
```sql
\dt
```

**See table structure:**
```sql
\d questions
```

**Count rows:**
```sql
SELECT COUNT(*) FROM tests;
SELECT COUNT(*) FROM questions;
```

---

**After checking, tell me what you found in the Render logs!**
