-- Chemistry Test Platform Database Schema

-- Users table (teachers and students)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tests table
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  marks INTEGER DEFAULT 1,
  question_order INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  option_a_image VARCHAR(500),
  option_b_image VARCHAR(500),
  option_c_image VARCHAR(500),
  option_d_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test attempts table
CREATE TABLE test_attempts (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  is_submitted BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  time_taken_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_id, student_id)
);

-- Student answers table
CREATE TABLE student_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer CHAR(1) CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN DEFAULT false,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id, question_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tests_created_by ON tests(created_by);
CREATE INDEX idx_tests_active ON tests(is_active);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_test_attempts_student ON test_attempts(student_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);
CREATE INDEX idx_student_answers_attempt ON student_answers(attempt_id);

-- Insert default admin/teacher user (email already verified)
INSERT INTO users (email, password, name, role, is_email_verified) VALUES
('teacher@chemistry.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGjgOZ8BgvCtGQG', 'Chemistry Teacher', 'teacher', true);
-- Password is: admin123