import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AdminBadge, AdminButton } from '../components/admin/AdminUI';
import '../styles/admin.css';

const navigation = [
  { path: '/admin/users', label: 'Người dùng', icon: 'manage_accounts' },
  { path: '/admin/meetings', label: 'Phòng học', icon: 'school' },
  { path: '/admin/profile', label: 'Hồ sơ của tôi', icon: 'account_circle' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/admin/users">
        <img src="/bauhaus-logo.png" alt="" /><span>NEO-LEARN AI</span>
      </Link>
      <p className="admin-hint mb-4 font-bold uppercase tracking-widest">Không gian quản trị</p>
      <nav className="admin-nav" aria-label="Quản trị">
        {navigation.map((item) => <NavLink to={item.path} key={item.path}>
          <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>{item.label}
        </NavLink>)}
      </nav>
      <div className="admin-sidebar-bottom">
        <div className="admin-account-summary">
          <p className="font-bold">{user.full_name}</p><p className="admin-hint mb-2">{user.email}</p>
          <AdminBadge tone="admin">Quản trị viên</AdminBadge>
        </div>
        <AdminButton icon="logout" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</AdminButton>
      </div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <Link to="/admin/users" className="flex items-center gap-2 font-bold">
          <span className="material-symbols-outlined" aria-hidden="true">admin_panel_settings</span>Quản trị hệ thống
        </Link>
        <div className="hidden lg:block"><AdminBadge tone="admin">ADMIN</AdminBadge></div>
        <div className="lg:hidden"><AdminButton icon="logout" onClick={handleLogout} disabled={loggingOut} aria-label="Đăng xuất" /></div>
      </header>
      <nav className="admin-mobile-nav" aria-label="Quản trị trên thiết bị nhỏ">
        {navigation.map((item) => <NavLink key={item.path} to={item.path}>{item.label}</NavLink>)}
      </nav>
      <main className="admin-content"><Outlet /></main>
    </div>
  </div>;
}
