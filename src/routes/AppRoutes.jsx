import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import useAuth from '../hooks/useAuth';

const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const TeacherHome = lazy(() => import('../pages/TeacherHome'));
const StudentHome = lazy(() => import('../pages/StudentHome'));
const Meeting = lazy(() => import('../pages/Meeting'));
const EmotionReport = lazy(() => import('../pages/EmotionReport'));

const PageLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-surface font-bold text-on-surface">
    Đang tải trang...
  </div>
);

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
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/meeting/:roomId" element={<Meeting />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<TeacherHome />} />
          <Route path="/bao-cao-cam-xuc" element={<EmotionReport />} />
          <Route path="/report" element={<EmotionReport />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentHome />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
