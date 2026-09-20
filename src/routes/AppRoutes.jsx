import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TeacherHome from '../pages/TeacherHome';
import StudentHome from '../pages/StudentHome';
import Meeting from '../pages/Meeting';

const HomeRedirect = () => {
  const userString = localStorage.getItem('user');
  if (!userString) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userString);
    return user.role === 'teacher' 
      ? <Navigate to="/teacher" replace /> 
      : <Navigate to="/student" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/meeting/:roomId" element={<Meeting />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher" element={<TeacherHome />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentHome />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
