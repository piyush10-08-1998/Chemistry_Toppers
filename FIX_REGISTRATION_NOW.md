# Fix Registration Error - RUN THIS NOW

## Problem
Students getting "Internal server error" when trying to register because the production database is missing email verification columns.

## Solution - Run This SQL Script

### Step 1: Connect to Your Render Database

1. Go to https://dashboard.render.com
2. Click on your **PostgreSQL database** (`chemistry-db`)
3. Click **"Connect"** button (top right)
4. Copy the **PSQL Command** (looks like):
   ```
   PGPASSWORD=xxxxx psql -h dpg-xxxxx.oregon-postgres.render.com -U chemistry_db_user chemistry_test_db
   ```

### Step 2: Open Terminal and Connect

1. Open **Terminal** on your Mac
2. Paste the PSQL command and press Enter
3. You should see: `chemistry_test_db=>`

### Step 3: Run the Migration Script

Copy and paste this ENTIRE script into the terminal:

```sql
-- Add email verification columns to users table if they don't exist
-- This is safe to run multiple times

-- Add is_email_verified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_email_verified column';
    ELSE
        RAISE NOTICE 'is_email_verified column already exists';
    END IF;
END $$;

-- Add email_verification_token column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verification_token'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
        RAISE NOTICE 'Added email_verification_token column';
    ELSE
        RAISE NOTICE 'email_verification_token column already exists';
    END IF;
END $$;

-- Add email_verification_expires column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verification_expires'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP;
        RAISE NOTICE 'Added email_verification_expires column';
    ELSE
        RAISE NOTICE 'email_verification_expires column already exists';
    END IF;
END $$;

-- Set existing users (like teacher) to verified
UPDATE users
SET is_email_verified = true
WHERE is_email_verified IS NULL OR email = 'teacher@chemistry.com';

-- Display current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### Step 4: Verify It Worked

After running the script, you should see output showing the columns were added:
- `is_email_verified`
- `email_verification_token`
- `email_verification_expires`

### Step 5: Exit Database

Type `\q` and press Enter to exit.

### Step 6: Test Registration

1. Go to https://chemistry-toppers-frontend.onrender.com
2. Click "Register"
3. Register a new student
4. Should work now! ✅

---

## Quick Alternative: Use the SQL File

If you prefer, you can also run:

```bash
\i /Users/piyushsinghmandavi/Chemistry_Toppers/chemistry-test-platform/backend/src/models/add_email_verification.sql
```

While connected to the database.

---

## After This Works

To enable email verification (students must verify email before login):

1. Go to Render Dashboard → Backend Service → Environment
2. Change `EMAIL_VERIFICATION_ENABLED` from `false` to `true`
3. Save (backend will redeploy)
4. Done! Students will now need to verify their email ✅
