const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory data store for demo (replace with real database)
let users = [
  {
    id: 1,
    email: 'teacher@chemistry.com',
    password: '$2b$12$sE5yryoMdoxRdR6CL7vc5u5DUAUN.i.kdYqk5x5CDoJORXutvvW62', // admin123
    name: 'Chemistry Teacher',
    role: 'teacher'
  }
];

let tests = [];
let questions = [];
let attempts = [];
let answers = [];

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chemistry Test Platform API is running' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error FULL:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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

    const userExists = users.find(u => u.email === email);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name,
      role
    };

    users.push(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Test routes
app.post('/api/tests', authenticateToken, requireRole(['teacher']), (req, res) => {
  const { title, description, duration_minutes } = req.body;
  
  if (!title || !duration_minutes) {
    return res.status(400).json({ error: 'Title and duration are required' });
  }

  const newTest = {
    id: tests.length + 1,
    title,
    description: description || '',
    duration_minutes,
    total_marks: 0,
    is_active: true,
    created_by: req.user.id,
    created_at: new Date()
  };

  tests.push(newTest);
  res.status(201).json({ test: newTest });
});

app.get('/api/tests', authenticateToken, (req, res) => {
  const { role, id } = req.user;
  
  let userTests;
  if (role === 'teacher') {
    userTests = tests.filter(t => t.created_by === id);
  } else {
    userTests = tests.filter(t => t.is_active).map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      duration_minutes: t.duration_minutes,
      total_marks: t.total_marks
    }));
  }

  res.json({ tests: userTests });
});

app.get('/api/tests/:id', authenticateToken, (req, res) => {
  const testId = parseInt(req.params.id);
  const test = tests.find(t => t.id === testId);
  
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const testQuestions = questions.filter(q => q.test_id === testId);
  
  let responseData = { test, questions: testQuestions };
  
  if (req.user.role === 'student') {
    responseData.questions = testQuestions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      marks: q.marks
    }));
  }

  res.json(responseData);
});

app.post('/api/tests/:id/questions', authenticateToken, requireRole(['teacher']), (req, res) => {
  const testId = parseInt(req.params.id);
  const test = tests.find(t => t.id === testId);
  
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  if (test.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    marks = 1
  } = req.body;

  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
    return res.status(400).json({ error: 'All question fields are required' });
  }

  if (!['a', 'b', 'c', 'd'].includes(correct_answer)) {
    return res.status(400).json({ error: 'Correct answer must be a, b, c, or d' });
  }

  const newQuestion = {
    id: questions.length + 1,
    test_id: testId,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    marks,
    question_order: questions.filter(q => q.test_id === testId).length + 1,
    created_at: new Date()
  };

  questions.push(newQuestion);
  
  // Update test total marks
  const testIndex = tests.findIndex(t => t.id === testId);
  tests[testIndex].total_marks += marks;

  res.status(201).json({ question: newQuestion });
});

// Attempt routes (for students taking tests)
app.post('/api/attempts/start/:testId', authenticateToken, requireRole(['student']), (req, res) => {
  const testId = parseInt(req.params.testId);
  const test = tests.find(t => t.id === testId);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  // Check if student already has an incomplete attempt
  const existingAttempt = attempts.find(
    a => a.test_id === testId && a.student_id === req.user.id && !a.is_submitted
  );

  if (existingAttempt) {
    return res.json({ attempt: existingAttempt });
  }

  // Create new attempt
  const newAttempt = {
    id: attempts.length + 1,
    test_id: testId,
    student_id: req.user.id,
    start_time: new Date(),
    is_submitted: false,
    score: 0,
    total_marks: test.total_marks
  };

  attempts.push(newAttempt);
  res.status(201).json({ attempt: newAttempt });
});

app.post('/api/attempts/answer', authenticateToken, requireRole(['student']), (req, res) => {
  const { attemptId, questionId, selectedAnswer } = req.body;

  if (!attemptId || !questionId || !selectedAnswer) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const attempt = attempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.student_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (attempt.is_submitted) {
    return res.status(400).json({ error: 'Test already submitted' });
  }

  // Check if answer already exists
  const existingAnswer = answers.find(
    a => a.attempt_id === attemptId && a.question_id === questionId
  );

  if (existingAnswer) {
    // Update existing answer
    existingAnswer.selected_answer = selectedAnswer;
    existingAnswer.updated_at = new Date();
  } else {
    // Create new answer
    const newAnswer = {
      id: answers.length + 1,
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      created_at: new Date()
    };
    answers.push(newAnswer);
  }

  res.json({ message: 'Answer saved' });
});

app.post('/api/attempts/submit', authenticateToken, requireRole(['student']), (req, res) => {
  const { attemptId } = req.body;

  if (!attemptId) {
    return res.status(400).json({ error: 'Attempt ID is required' });
  }

  const attempt = attempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.student_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (attempt.is_submitted) {
    return res.status(400).json({ error: 'Test already submitted' });
  }

  // Calculate score
  const studentAnswers = answers.filter(a => a.attempt_id === attemptId);
  let score = 0;

  studentAnswers.forEach(answer => {
    const question = questions.find(q => q.id === answer.question_id);
    if (question && question.correct_answer === answer.selected_answer) {
      score += question.marks;
    }
  });

  // Update attempt
  attempt.is_submitted = true;
  attempt.end_time = new Date();
  attempt.score = score;
  attempt.time_taken_minutes = Math.round(
    (attempt.end_time - new Date(attempt.start_time)) / 60000
  );

  res.json({
    message: 'Test submitted successfully',
    score,
    total_marks: attempt.total_marks
  });
});

app.get('/api/attempts/results/:testId', authenticateToken, requireRole(['student']), (req, res) => {
  const testId = parseInt(req.params.testId);

  const attempt = attempts.find(
    a => a.test_id === testId && a.student_id === req.user.id && a.is_submitted
  );

  if (!attempt) {
    return res.status(404).json({ error: 'No submitted attempt found' });
  }

  const test = tests.find(t => t.id === testId);

  res.json({
    attempt,
    test: {
      title: test.title,
      description: test.description
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Chemistry Test Platform API running on port ${PORT}`);
  console.log(`📚 Ready to serve chemistry tests!`);
  console.log(`🔐 Default login: teacher@chemistry.com / admin123`);
});