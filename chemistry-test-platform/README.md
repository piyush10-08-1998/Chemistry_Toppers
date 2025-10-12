# Chemistry Test Platform

A web-based platform for creating and taking chemistry tests with automatic grading, time limits, and progress tracking.

## Features

- **Teacher Features:**
  - Create and manage tests
  - Add multiple choice questions
  - View student results and analytics
  - Progress tracking dashboard

- **Student Features:**
  - Take tests with timer
  - Automatic grading
  - View scores and progress
  - Resume incomplete tests

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, PostgreSQL
- **Frontend:** React, TypeScript, Vite
- **Authentication:** JWT tokens
- **Database:** PostgreSQL with connection pooling

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Git

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and JWT secret.

4. Set up the database:
   ```bash
   # Create database
   createdb chemistry_test_db
   
   # Run the schema
   psql -d chemistry_test_db -f src/models/database.sql
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   npm install axios react-router-dom @types/react-router-dom tailwindcss @tailwindcss/forms
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:3000

## Default Login Credentials

**Teacher Account:**
- Email: teacher@chemistry.com
- Password: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Tests (Teacher)
- `POST /api/tests` - Create test
- `GET /api/tests` - Get all tests
- `GET /api/tests/:id` - Get specific test
- `POST /api/tests/:id/questions` - Add question to test
- `DELETE /api/tests/:id` - Delete test

### Test Attempts (Student)
- `POST /api/attempts/start/:testId` - Start test
- `POST /api/attempts/answer` - Submit answer
- `POST /api/attempts/submit` - Submit test
- `GET /api/attempts/results/:testId` - Get test results

## Database Schema

The platform uses the following main tables:
- `users` - Teacher and student accounts
- `tests` - Test information
- `questions` - Multiple choice questions
- `test_attempts` - Student test attempts
- `student_answers` - Individual question answers

## Development

- Backend runs on TypeScript with hot reload via nodemon
- Frontend uses Vite for fast development
- Database connection pooling for performance
- JWT authentication with role-based access control
- Automatic test grading system
- Timer functionality with auto-submit

## License

This project is open source and available under the MIT License.