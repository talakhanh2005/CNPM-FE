import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TeacherHome from '../pages/TeacherHome';
import StudentHome from '../pages/StudentHome';
import Meeting from '../pages/Meeting';
import EmotionReport from '../pages/EmotionReport';
import useAuth from '../hooks/useAuth';

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return user.role === 'teacher'
    ? <Navigate to="/teacher" replace />
    : <Navigate to="/student" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/meeting/:roomId" element={<Meeting />} />
        <Route path="/bao-cao-cam-xuc" element={<EmotionReport />} />
        <Route path="/report" element={<EmotionReport />} />
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
