# Student Analytics Dashboard - User Guide

## ✅ Features Completed

Your Chemistry Test Platform now includes a comprehensive **Student Analytics Dashboard** for teachers!

## 🎯 What You Can See

### 1. **Students Analytics Page** (`/teacher/students`)

Access this page by clicking the **"📊 View Students Analytics"** button on the Teacher Dashboard.

#### Key Metrics Displayed:
- **Total Students**: Total number of registered students
- **Active Students**: Students who have completed at least one test
- **Average Score**: Overall average performance across all students

#### Student Information Table:
For each student, you can see:
- **Name**: Full name of the student
- **Email**: Registered email address
- **Tests Taken**: Total number of tests started
- **Completed**: Number of tests fully submitted
- **Avg Score**: Average percentage across all completed tests
- **Registered**: Date when the student registered

#### Features:
- 🔍 **Search Functionality**: Search students by name or email
- 📊 **Color-Coded Performance**:
  - 🟢 Green: 80%+ (Excellent)
  - 🟠 Orange: 60-79% (Good)
  - 🔴 Red: Below 60% (Needs Improvement)
- 📅 **Sortable Data**: Students shown newest first

## 📍 How to Access

### For Teachers:

1. **Login** at http://localhost:5173
   - Email: teacher@chemistry.com
   - Password: admin123

2. **From Dashboard**, click the green button:
   **"📊 View Students Analytics"**

3. **View Complete Student Data**:
   - See all registered students
   - Check their performance metrics
   - Search for specific students

## 📊 Available Data

### Student Performance Metrics:

```
Total Students: X
├── Active Students: Y (students with completed tests)
├── Average Score: Z% (overall performance)
└── Individual Student Data:
    ├── Tests Taken
    ├── Tests Completed
    ├── Average Percentage
    └── Registration Date
```

## 🔍 Database Queries

### View All Students via Database:
```bash
psql -d chemistry_test_db -c "
SELECT
  u.name,
  u.email,
  u.created_at,
  COUNT(ta.id) as tests_taken,
  AVG(CASE WHEN ta.is_submitted THEN (ta.score::numeric / ta.total_marks * 100) END) as avg_percentage
FROM users u
LEFT JOIN test_attempts ta ON u.id = ta.student_id
WHERE u.role = 'student'
GROUP BY u.id
ORDER BY u.created_at DESC;
"
```

### View Test Results for a Specific Test:
```bash
psql -d chemistry_test_db -c "
SELECT
  u.name as student_name,
  ta.score,
  ta.total_marks,
  ROUND((ta.score::numeric / ta.total_marks * 100), 2) as percentage,
  ta.time_taken_minutes,
  ta.end_time
FROM test_attempts ta
JOIN users u ON ta.student_id = u.id
WHERE ta.test_id = 1 AND ta.is_submitted = true;
"
```

### View Individual Student Performance:
```bash
psql -d chemistry_test_db -c "
SELECT
  t.title as test_name,
  ta.score,
  ta.total_marks,
  ROUND((ta.score::numeric / ta.total_marks * 100), 2) as percentage,
  ta.end_time
FROM test_attempts ta
JOIN tests t ON ta.test_id = t.id
WHERE ta.student_id = 2 AND ta.is_submitted = true
ORDER BY ta.end_time DESC;
"
```

## 🌐 API Endpoints (For Teachers Only)

All analytics endpoints require teacher authentication.

### 1. Get All Students
```http
GET /api/analytics/students
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "students": [
    {
      "id": 2,
      "name": "Student Name",
      "email": "student@gmail.com",
      "created_at": "2025-10-13T01:08:27.418Z",
      "tests_taken": 5,
      "tests_completed": 3,
      "average_percentage": 85.5
    }
  ]
}
```

### 2. Get Test Results (for a specific test)
```http
GET /api/analytics/test-results/:testId
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "test": {
    "id": 1,
    "title": "Chemical Bonding Test",
    "total_marks": 10
  },
  "results": [
    {
      "student_id": 2,
      "student_name": "Student Name",
      "student_email": "student@gmail.com",
      "score": 8,
      "total_marks": 10,
      "percentage": 80.00,
      "time_taken_minutes": 15,
      "start_time": "...",
      "end_time": "..."
    }
  ]
}
```

### 3. Get Individual Student Details
```http
GET /api/analytics/student/:studentId
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "student": {
    "id": 2,
    "name": "Student Name",
    "email": "student@gmail.com",
    "created_at": "..."
  },
  "attempts": [
    {
      "test_id": 1,
      "test_name": "Chemical Bonding Test",
      "score": 8,
      "total_marks": 10,
      "percentage": 80.00,
      "time_taken_minutes": 15,
      "end_time": "..."
    }
  ]
}
```

## 📁 Files Created/Modified

### Backend:
✅ `server-db.js` - Added analytics API endpoints:
- `/api/analytics/students`
- `/api/analytics/test-results/:testId`
- `/api/analytics/student/:studentId`

### Frontend:
✅ `src/pages/Students.tsx` - New analytics page with:
- Student list table
- Search functionality
- Performance metrics
- Color-coded scores

✅ `src/utils/api.ts` - Added API methods:
- `getStudents()`
- `getTestResultsForTeacher(testId)`
- `getStudentDetails(studentId)`

✅ `src/App.tsx` - Added route:
- `/teacher/students` → Students analytics page

✅ `src/pages/TeacherDashboard.tsx` - Added navigation button

## 🎨 Design Features

- **Responsive Table**: Scrollable on small screens
- **Search Bar**: Real-time filtering
- **Color Coding**: Visual performance indicators
- **Hover Effects**: Interactive table rows
- **Stats Cards**: Quick overview metrics
- **Clean UI**: Professional appearance

## 📈 Future Enhancements (Optional)

You could add:
1. **Export to CSV/Excel** - Download student data
2. **Detailed Student View** - Click on student for detailed history
3. **Charts & Graphs** - Visual performance analytics
4. **Filtering Options** - Filter by performance, date, etc.
5. **Email Notifications** - Alert students about scores
6. **Comparison Tools** - Compare student performance
7. **Test-Specific Analytics** - Deep dive into individual tests

## 🧪 Testing the Feature

1. **Register some test students**:
   ```
   Student 1: alice@gmail.com
   Student 2: bob@yahoo.com
   Student 3: charlie@outlook.com
   ```

2. **Have students take tests** and submit them

3. **Login as teacher** and click "📊 View Students Analytics"

4. **Try the search** - Type a student name or email

5. **Observe the metrics**:
   - Total students count
   - Active students (those who completed tests)
   - Average score calculation
   - Individual student performance

## ✨ Benefits

✅ **Track Student Progress**: See who's active and who needs attention
✅ **Identify Struggling Students**: Low scores highlighted in red
✅ **Monitor Engagement**: See test participation rates
✅ **Data-Driven Decisions**: Make informed teaching choices
✅ **Easy Access**: One click from teacher dashboard
✅ **Searchable**: Quickly find any student
✅ **Real-time**: Always up-to-date with latest data

---

**All student data is permanently stored in PostgreSQL and accessible anytime!** 🎉
