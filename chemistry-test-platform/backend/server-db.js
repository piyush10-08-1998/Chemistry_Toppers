const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { validateEmail } = require('./src/utils/emailValidator');
const questionExtractor = require('./src/services/questionExtractor');
const { sendVerificationEmail } = require('./src/services/emailService');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5001;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chemistry_test_db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully at', res.rows[0].now);
  }
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5001", "http://localhost:5174", "http://localhost:5173"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT utilities
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Routes
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    res.json({
      status: 'OK',
      message: 'Chemistry Test Platform API is running',
      database: 'Connected',
      users: result.rows[0].user_count
    });
  } catch (error) {
    res.json({
      status: 'OK',
      message: 'Chemistry Test Platform API is running',
      database: 'Error'
    });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true
      });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either teacher or student' });
    }

    // Validate email with our validator
    const emailValidation = validateEmail(email, {
      allowAnyDomain: true, // Set to false to only allow specific providers
      requireEducationalEmail: false // Set to true to require .edu emails for students
    });

    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await pool.query(
      'INSERT INTO users (email, password, name, role, email_verification_token, email_verification_expires) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role',
      [cleanEmail, hashedPassword, name, role, verificationToken, verificationExpires]
    );

    const newUser = result.rows[0];

    // Send verification email
    const emailResult = await sendVerificationEmail(cleanEmail, verificationToken, name);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails, just log it
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: newUser,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Email verification endpoint
app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email_verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({ error: 'Verification token has expired. Please register again.' });
    }

    // Check if already verified
    if (user.is_email_verified) {
      return res.status(200).json({ message: 'Email already verified. You can now login.' });
    }

    // Verify the email
    await pool.query(
      'UPDATE users SET is_email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    console.log(`✅ Email verified for user: ${user.email}`);

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test routes
app.post('/api/tests', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { title, description, duration_minutes } = req.body;

    if (!title || !duration_minutes) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }

    const result = await pool.query(
      'INSERT INTO tests (title, description, duration_minutes, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description || '', duration_minutes, req.user.id]
    );

    res.status(201).json({ test: result.rows[0] });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tests', authenticateToken, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'teacher') {
      result = await pool.query('SELECT * FROM tests WHERE created_by = $1 ORDER BY created_at DESC', [req.user.id]);
    } else {
      result = await pool.query(
        'SELECT id, title, description, duration_minutes, total_marks FROM tests WHERE is_active = true ORDER BY created_at DESC'
      );
    }

    res.json({ tests: result.rows });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tests/:id', authenticateToken, async (req, res) => {
  try {
    const testId = parseInt(req.params.id);

    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];

    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let questionsResult;
    if (req.user.role === 'student') {
      questionsResult = await pool.query(
        'SELECT id, question_text, option_a, option_b, option_c, option_d, marks, image_url, option_a_image, option_b_image, option_c_image, option_d_image FROM questions WHERE test_id = $1 ORDER BY question_order',
        [testId]
      );
    } else {
      questionsResult = await pool.query(
        'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
        [testId]
      );
    }

    res.json({ test, questions: questionsResult.rows });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tests/:id/questions', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const testId = parseInt(req.params.id);

    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    if (test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      question_text, option_a, option_b, option_c, option_d,
      correct_answer, marks = 1, image_url,
      option_a_image, option_b_image, option_c_image, option_d_image
    } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ error: 'All question fields are required' });
    }

    if (!['a', 'b', 'c', 'd'].includes(correct_answer)) {
      return res.status(400).json({ error: 'Correct answer must be a, b, c, or d' });
    }

    const orderResult = await pool.query('SELECT COUNT(*) as count FROM questions WHERE test_id = $1', [testId]);
    const questionOrder = parseInt(orderResult.rows[0].count) + 1;

    const questionResult = await pool.query(
      'INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, question_order, image_url, option_a_image, option_b_image, option_c_image, option_d_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [testId, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, questionOrder, image_url || null, option_a_image || null, option_b_image || null, option_c_image || null, option_d_image || null]
    );

    await pool.query('UPDATE tests SET total_marks = total_marks + $1 WHERE id = $2', [marks, testId]);

    res.status(201).json({ question: questionResult.rows[0] });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a question
app.delete('/api/questions/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    // Get the question to verify ownership and get marks
    const questionResult = await pool.query(
      'SELECT q.*, t.created_by FROM questions q JOIN tests t ON q.test_id = t.id WHERE q.id = $1',
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = questionResult.rows[0];

    // Verify teacher owns the test
    if (question.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the question
    await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);

    // Update test total marks
    await pool.query('UPDATE tests SET total_marks = total_marks - $1 WHERE id = $2', [question.marks, question.test_id]);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Attempt routes (for students taking tests)
app.post('/api/attempts/start/:testId', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);

    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];

    // Check if student already has an incomplete attempt
    const existingAttempt = await pool.query(
      'SELECT * FROM test_attempts WHERE test_id = $1 AND student_id = $2 AND is_submitted = false',
      [testId, req.user.id]
    );

    if (existingAttempt.rows.length > 0) {
      return res.json({ attempt: existingAttempt.rows[0] });
    }

    // Create new attempt
    const attemptResult = await pool.query(
      'INSERT INTO test_attempts (test_id, student_id, total_marks) VALUES ($1, $2, $3) RETURNING *',
      [testId, req.user.id, test.total_marks]
    );

    res.status(201).json({ attempt: attemptResult.rows[0] });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attempts/answer', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { attemptId, questionId, selectedAnswer } = req.body;

    if (!attemptId || !questionId || !selectedAnswer) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const attemptResult = await pool.query('SELECT * FROM test_attempts WHERE id = $1', [attemptId]);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (attempt.is_submitted) {
      return res.status(400).json({ error: 'Test already submitted' });
    }

    // Check if answer already exists
    const existingAnswer = await pool.query(
      'SELECT * FROM student_answers WHERE attempt_id = $1 AND question_id = $2',
      [attemptId, questionId]
    );

    if (existingAnswer.rows.length > 0) {
      // Update existing answer
      await pool.query(
        'UPDATE student_answers SET selected_answer = $1 WHERE attempt_id = $2 AND question_id = $3',
        [selectedAnswer, attemptId, questionId]
      );
    } else {
      // Insert new answer
      await pool.query(
        'INSERT INTO student_answers (attempt_id, question_id, selected_answer) VALUES ($1, $2, $3)',
        [attemptId, questionId, selectedAnswer]
      );
    }

    res.json({ message: 'Answer saved' });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attempts/submit', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { attemptId } = req.body;

    if (!attemptId) {
      return res.status(400).json({ error: 'Attempt ID is required' });
    }

    const attemptResult = await pool.query('SELECT * FROM test_attempts WHERE id = $1', [attemptId]);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    if (attempt.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (attempt.is_submitted) {
      return res.status(400).json({ error: 'Test already submitted' });
    }

    // Calculate score
    const answersResult = await pool.query(`
      SELECT sa.selected_answer, q.correct_answer, q.marks
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.attempt_id = $1
    `, [attemptId]);

    let score = 0;
    answersResult.rows.forEach(answer => {
      if (answer.selected_answer === answer.correct_answer) {
        score += answer.marks;
      }
    });

    // Update attempt
    const endTime = new Date();
    const startTime = new Date(attempt.start_time);
    const timeTaken = Math.round((endTime - startTime) / 60000);

    await pool.query(
      'UPDATE test_attempts SET is_submitted = true, end_time = $1, score = $2, time_taken_minutes = $3 WHERE id = $4',
      [endTime, score, timeTaken, attemptId]
    );

    res.json({
      message: 'Test submitted successfully',
      score,
      total_marks: attempt.total_marks
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/attempts/results/:testId', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);

    const attemptResult = await pool.query(
      'SELECT * FROM test_attempts WHERE test_id = $1 AND student_id = $2 AND is_submitted = true',
      [testId, req.user.id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'No submitted attempt found' });
    }

    const testResult = await pool.query('SELECT title, description FROM tests WHERE id = $1', [testId]);

    res.json({
      attempt: attemptResult.rows[0],
      test: testResult.rows[0]
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics routes (for teachers)
app.get('/api/analytics/students', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const studentsResult = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(DISTINCT ta.id) as tests_taken,
        COUNT(DISTINCT CASE WHEN ta.is_submitted = true THEN ta.id END) as tests_completed,
        COALESCE(AVG(CASE WHEN ta.is_submitted = true THEN (ta.score::numeric / NULLIF(ta.total_marks, 0) * 100) END), 0) as average_percentage
      FROM users u
      LEFT JOIN test_attempts ta ON u.id = ta.student_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json({ students: studentsResult.rows });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/test-results/:testId', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);

    // Verify teacher owns this test
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1 AND created_by = $2', [testId, req.user.id]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    const resultsQuery = await pool.query(`
      SELECT
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        ta.score,
        ta.total_marks,
        ROUND((ta.score::numeric / NULLIF(ta.total_marks, 0) * 100), 2) as percentage,
        ta.time_taken_minutes,
        ta.start_time,
        ta.end_time,
        ta.is_submitted
      FROM test_attempts ta
      JOIN users u ON ta.student_id = u.id
      WHERE ta.test_id = $1 AND ta.is_submitted = true
      ORDER BY ta.end_time DESC
    `, [testId]);

    res.json({
      test: testResult.rows[0],
      results: resultsQuery.rows
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/student/:studentId', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const studentResult = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1 AND role = $2',
      [studentId, 'student']
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const attemptsResult = await pool.query(`
      SELECT
        t.id as test_id,
        t.title as test_name,
        ta.score,
        ta.total_marks,
        ROUND((ta.score::numeric / NULLIF(ta.total_marks, 0) * 100), 2) as percentage,
        ta.time_taken_minutes,
        ta.end_time
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.student_id = $1 AND ta.is_submitted = true
      ORDER BY ta.end_time DESC
    `, [studentId]);

    res.json({
      student: studentResult.rows[0],
      attempts: attemptsResult.rows
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Question extraction from PDF/Images
// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
const questionImagesDir = path.join(__dirname, 'question-images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(questionImagesDir)) {
  fs.mkdirSync(questionImagesDir, { recursive: true });
}

// Serve question images statically
app.use('/question-images', express.static(questionImagesDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, PNG, GIF, WEBP) are allowed'));
    }
  }
});

// Extract questions from uploaded file
app.post('/api/questions/extract', authenticateToken, requireRole(['teacher']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📄 Extracting questions from: ${req.file.originalname}`);

    // Extract questions using AI
    const result = await questionExtractor.extract(req.file.path, req.file.mimetype);

    if (!result.success) {
      // Clean up uploaded file on error
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: result.error });
    }

    // Save image permanently for image files (not PDFs)
    let imageUrl = null;
    if (req.file.mimetype.startsWith('image/')) {
      const permanentFilename = `question-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const permanentPath = path.join(questionImagesDir, permanentFilename);

      // Copy file to permanent location
      fs.copyFileSync(req.file.path, permanentPath);

      // Generate URL (relative to backend URL)
      imageUrl = `/question-images/${permanentFilename}`;

      console.log(`🖼️  Saved question image: ${imageUrl}`);
    }

    // Clean up temporary uploaded file
    fs.unlinkSync(req.file.path);

    // Attach image URL to all extracted questions
    const questionsWithImage = result.questions.map(q => ({
      ...q,
      image_url: imageUrl
    }));

    console.log(`✅ Extracted ${result.count} questions from ${req.file.originalname}`);

    res.json({
      message: `Successfully extracted ${result.count} questions`,
      questions: questionsWithImage,
      count: result.count,
      image_url: imageUrl
    });
  } catch (error) {
    console.error('Question extraction error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to extract questions. Please try again.' });
  }
});

// Upload image for a question (standalone endpoint for manual questions)
app.post('/api/questions/upload-image', authenticateToken, requireRole(['teacher']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Only accept images, not PDFs
    if (!req.file.mimetype.startsWith('image/')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const permanentFilename = `question-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    const permanentPath = path.join(questionImagesDir, permanentFilename);

    // Move file to permanent location
    fs.copyFileSync(req.file.path, permanentPath);
    fs.unlinkSync(req.file.path);

    // Generate URL
    const imageUrl = `/question-images/${permanentFilename}`;

    console.log(`🖼️  Uploaded question image: ${imageUrl}`);

    res.json({
      message: 'Image uploaded successfully',
      image_url: imageUrl
    });
  } catch (error) {
    console.error('Image upload error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to upload image. Please try again.' });
  }
});

// Bulk add extracted questions to a test
app.post('/api/tests/:id/questions/bulk', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Verify test exists and belongs to teacher
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1 AND created_by = $2', [testId, req.user.id]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Get current question count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM questions WHERE test_id = $1', [testId]);
    let questionOrder = parseInt(countResult.rows[0].count);

    const addedQuestions = [];
    let totalMarks = 0;

    // Add each question
    for (const q of questions) {
      questionOrder++;

      // Default correct_answer to 'a' if not provided (teacher can edit later)
      const correctAnswer = q.correct_answer || 'a';

      const questionResult = await pool.query(
        'INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, question_order, image_url, option_a_image, option_b_image, option_c_image, option_d_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
        [testId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, correctAnswer, q.marks || 1, questionOrder, q.image_url || null, q.option_a_image || null, q.option_b_image || null, q.option_c_image || null, q.option_d_image || null]
      );

      addedQuestions.push(questionResult.rows[0]);
      totalMarks += q.marks || 1;
    }

    // Update test total marks
    await pool.query('UPDATE tests SET total_marks = total_marks + $1 WHERE id = $2', [totalMarks, testId]);

    res.status(201).json({
      message: `Successfully added ${addedQuestions.length} questions to test`,
      questions: addedQuestions,
      count: addedQuestions.length
    });
  } catch (error) {
    console.error('Bulk add questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Chemistry Test Platform API running on port ${PORT}`);
  console.log(`📚 Ready to serve chemistry tests!`);
  console.log(`🔐 Default login: teacher@chemistry.com / admin123`);
  console.log(`📧 Email validation: Enabled (blocking disposable emails)`);
});
