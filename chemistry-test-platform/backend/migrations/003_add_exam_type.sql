-- Migration: Add exam_type to tests table for NEET/JEE categorization
-- Created: 2025-10-19

-- Add exam_type column to tests table
ALTER TABLE tests
ADD COLUMN exam_type VARCHAR(20) CHECK (exam_type IN ('NEET', 'JEE'));

-- Set default value for existing tests (optional - you can update these manually)
UPDATE tests
SET exam_type = 'NEET'
WHERE exam_type IS NULL;

-- Create index for faster filtering
CREATE INDEX idx_tests_exam_type ON tests(exam_type);

-- Add comment to document the column
COMMENT ON COLUMN tests.exam_type IS 'Type of exam: NEET or JEE';
