-- Fix for Render Database Schema
-- This adds the missing image_url columns to the questions table

-- Add image_url column if it doesn't exist
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Add option image columns if they don't exist
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS option_a_image VARCHAR(500);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS option_b_image VARCHAR(500);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS option_c_image VARCHAR(500);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS option_d_image VARCHAR(500);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;
