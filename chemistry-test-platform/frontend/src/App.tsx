import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import AddQuestions from './pages/AddQuestions'
import StudentDashboard from './pages/StudentDashboard'
import TakeTest from './pages/TakeTest'
import Students from './pages/Students'
import VerifyEmail from './pages/VerifyEmail'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/test/:testId" element={<AddQuestions />} />
        <Route path="/teacher/students" element={<Students />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/test/:testId" element={<TakeTest />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
