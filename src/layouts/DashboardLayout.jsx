import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const DashboardLayout = ({
  children,
  activeTab = 'dashboard',
  onTabChange,
  onJoinRoom,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quickRoomCode, setQuickRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    const code = quickRoomCode.trim();
    if (!code) return;
    onJoinRoom?.(code);
    setShowJoinModal(false);
    setQuickRoomCode('');
  };

  const navItems = isTeacher
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/teacher' },
        { id: 'phong-hoc', label: 'Phòng học', icon: 'school', path: '/teacher' },
        { id: 'lich-su', label: 'Lịch sử', icon: 'history', path: '/teacher' },
        { id: 'bao-cao-cam-xuc', label: 'Báo cáo cảm xúc', icon: 'psychology', path: '/bao-cao-cam-xuc' },
      ]
    : [
        { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard', path: '/student' },
        { id: 'phong-hoc-cua-toi', label: 'Phòng học của tôi', icon: 'school', path: '/student' },
        { id: 'lich-su-hoc-tap', label: 'Lịch sử học tập', icon: 'history', path: '/student' },
        { id: 'bao-cao-cam-xuc', label: 'Báo cáo cảm xúc', icon: 'psychology', path: '/bao-cao-cam-xuc' },
      ];

  const handleNavClick = (item) => {
    if (item.path === '/bao-cao-cam-xuc') {
      navigate('/bao-cao-cam-xuc');
      return;
    }
    if (onTabChange) {
      onTabChange(item.id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      {/* Sidebar for Desktop */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-off-white border-r-[3px] border-pure-black z-50 flex flex-col pt-space-xl pb-space-lg transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-gutter mb-space-xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-space-sm">
            <img
              alt="BauhausEdu Logo"
              className="h-8 w-auto object-contain"
              src="/bauhaus-logo.png"
            />
            <span className="text-headline-sm font-headline font-bold uppercase tracking-tight text-on-surface">
              Neo-Learn AI
            </span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-1 border-[2px] border-pure-black bg-surface-container"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-space-md flex flex-col gap-space-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`flex items-center px-space-md py-space-sm rounded-none text-body-md transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold border-[3px] border-pure-black shadow-[2px_2px_0px_#000000]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined mr-space-md">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Info & Logout */}
        <div className="px-space-md pt-space-md border-t-[3px] border-pure-black mt-auto flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-sm p-space-xs bg-surface-container-low border-[2px] border-pure-black">
            <div className="w-9 h-9 rounded-full bg-bright-yellow border-[2px] border-pure-black flex items-center justify-center font-bold text-pure-black uppercase">
              {user?.username?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-md font-bold text-on-surface truncate">
                {user?.username || 'Người dùng'}
              </p>
              <span className="text-label-sm text-on-surface-variant uppercase font-mono">
                {isTeacher ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 bg-surface-container-lowest hover:bg-tertiary-container hover:text-tertiary text-on-surface font-label-md border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-off-white border-b-[3px] border-pure-black shadow-[4px_4px_0px_#000000] z-40 flex items-center justify-between px-gutter">
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              className="lg:hidden p-2 border-[2px] border-pure-black bg-surface-container"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden sm:inline-block px-3 py-1 bg-surface-container border-[2px] border-pure-black text-label-sm font-bold uppercase">
              Học kỳ II - 2024/2025
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            {/* Quick Join Button / Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="px-3 py-1.5 bg-surface-container-lowest text-on-surface border-[2px] border-pure-black font-label-md font-bold shadow-[2px_2px_0px_#000000] hover:bg-bright-yellow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard</span>
              <span className="hidden sm:inline">Nhập mã phòng</span>
            </button>

            {/* Role indicator */}
            <div className="flex items-center bg-surface-container border-[3px] border-pure-black p-0.5 shadow-[2px_2px_0px_#000000]">
              <span
                className={`px-3 py-1 text-label-sm font-bold border border-pure-black ${
                  isTeacher ? 'bg-primary text-on-primary' : 'bg-transparent text-on-surface-variant'
                }`}
              >
                Giáo viên
              </span>
              <span
                className={`px-3 py-1 text-label-sm font-bold border border-pure-black ${
                  !isTeacher ? 'bg-primary text-on-primary' : 'bg-transparent text-on-surface-variant'
                }`}
              >
                Học sinh
              </span>
            </div>

            {/* Profile Avatar */}
            <div
              onClick={handleLogout}
              title="Nhấn để đăng xuất"
              className="w-10 h-10 rounded-full bg-bright-yellow border-[3px] border-pure-black shadow-[2px_2px_0px_#000000] flex items-center justify-center cursor-pointer hover:opacity-90 font-bold"
            >
              <span className="material-symbols-outlined text-pure-black text-[22px]">person</span>
            </div>
          </div>
        </header>

        {/* Modal: Quick Join Room */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 bg-pure-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-off-white border-[3px] border-pure-black p-space-lg shadow-[8px_8px_0px_#000000] w-full max-w-md">
              <div className="flex items-center justify-between pb-space-sm border-b-[3px] border-pure-black mb-space-md">
                <h3 className="font-headline font-bold text-headline-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-royal-blue">meeting_room</span>
                  Tham gia phòng học
                </h3>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-8 h-8 border-[2px] border-pure-black bg-surface flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleQuickJoin} className="space-y-4">
                <div>
                  <label className="block text-label-md font-bold mb-1">
                    Nhập mã phòng (8-12 ký tự)
                  </label>
                  <input
                    type="text"
                    value={quickRoomCode}
                    onChange={(e) => setQuickRoomCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 12))}
                    placeholder="VD: ABC123XYZ"
                    autoFocus
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border-[3px] border-pure-black text-body-md font-mono font-bold focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2 bg-surface border-[2px] border-pure-black font-label-md font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!quickRoomCode.trim()}
                    className="px-5 py-2 bg-bright-yellow text-pure-black border-[2px] border-pure-black font-label-md font-bold shadow-[2px_2px_0px_#000000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    Tham gia ngay
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="relative pt-20 bg-surface flex-1 min-h-[calc(100vh-5rem)] flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
