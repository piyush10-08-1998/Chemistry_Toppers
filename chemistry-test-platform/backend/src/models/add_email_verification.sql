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
