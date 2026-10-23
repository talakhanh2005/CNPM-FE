import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TeacherHome from '../pages/TeacherHome';
import StudentHome from '../pages/StudentHome';
import Meeting from '../pages/Meeting';
import EmotionReport from '../pages/EmotionReport';
import useAuth from '../hooks/useAuth';
import LoadingPage from '../components/LoadingPage';
import { getRoleHome } from '../utils/roles';

const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminMeetings = lazy(() => import('../pages/admin/AdminMeetings'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingPage message="Đang kiểm tra phiên đăng nhập..." />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getRoleHome(user.role)} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute allowedRoles={['teacher', 'student']} />}>
        <Route path="/meeting/:roomId" element={<Meeting />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher" element={<TeacherHome />} />
        <Route path="/report" element={<EmotionReport />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentHome />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<Suspense fallback={<LoadingPage message="Đang mở trang quản trị..." />}><AdminLayout /></Suspense>}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="meetings" element={<AdminMeetings />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="*" element={<Navigate to="/admin/users" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
