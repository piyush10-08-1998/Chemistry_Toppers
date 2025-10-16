-- Update questions table to store images as TEXT (base64) instead of VARCHAR (URLs)
-- This allows images to persist across Render deployments

-- Change image_url column to TEXT to store base64 data
ALTER TABLE questions ALTER COLUMN image_url TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_a_image TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_b_image TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_c_image TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_d_image TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'questions'
AND column_name LIKE '%image%'
ORDER BY ordinal_position;
