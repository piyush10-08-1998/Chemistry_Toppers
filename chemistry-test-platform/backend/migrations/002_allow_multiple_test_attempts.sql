-- Migration: Allow students to retake tests multiple times
-- Remove unique constraint on (test_id, student_id) to allow multiple attempts per test

ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS test_attempts_test_id_student_id_key;

-- Add comment explaining the change
COMMENT ON TABLE test_attempts IS 'Stores student test attempts. Students can have multiple attempts for the same test (retakes allowed).';
