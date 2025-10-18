-- Migration: Add is_published field to control test visibility
-- Created: 2025-10-19

-- Add is_published column to tests table (default false = draft/private)
ALTER TABLE tests
ADD COLUMN is_published BOOLEAN DEFAULT false;

-- Update existing tests to be published (optional - keeps current behavior)
-- Comment this out if you want existing tests to remain as drafts
UPDATE tests
SET is_published = true
WHERE is_published IS NULL;

-- Create index for faster filtering
CREATE INDEX idx_tests_is_published ON tests(is_published);

-- Add comment to document the column
COMMENT ON COLUMN tests.is_published IS 'Whether test is visible to students (true) or draft/private (false)';
