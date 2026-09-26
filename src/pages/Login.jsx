import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import useAuth from '../hooks/useAuth';
import { getApiErrorMessage } from '../api/axiosClient';

const Login = () => {
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (password.length < 4) {
      setError('Mật khẩu cần ít nhất 4 ký tự.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login({ role, username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 w-full min-h-[calc(100vh-73px)]">
        {/* Left Panel: Neo-Bauhaus Branding & Geometric Visuals */}
        <div className="relative bg-surface border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-pure-black p-space-xl lg:p-16 flex flex-col justify-between overflow-hidden">
          {/* Decorative Neo-Bauhaus Geometric Shapes background accent */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-bright-yellow border-[3px] border-pure-black z-0 pointer-events-none" />
          <div className="absolute bottom-12 right-12 w-40 h-40 bg-royal-blue border-[3px] border-pure-black z-0 pointer-events-none transform rotate-12" />
          <div className="absolute top-1/2 right-1/4 w-0 h-0 border-x-[50px] border-x-transparent border-b-[86.6px] border-b-vivid-red z-0 pointer-events-none transform -rotate-12" />

          {/* Top content */}
          <div className="relative z-10">
            <div className="inline-block px-space-sm py-space-xs bg-primary-container border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] mb-space-lg">
              <span className="text-label-sm uppercase tracking-wider font-bold text-on-primary-container">
                Neo-Bauhaus AI Academy
              </span>
            </div>
            <h1 className="text-headline-xl lg:text-[56px] lg:leading-[64px] text-on-surface font-headline font-bold tracking-tight mb-space-md">
              Học tập thông minh cùng AI Cảm xúc.
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-md">
              Nền tảng giáo dục thế hệ mới kết hợp tư duy thiết kế Bauhaus kinh điển và trí tuệ nhân tạo thấu cảm, mang lại trải nghiệm học tập đỉnh cao cho cả giảng viên và học viên.
            </p>
          </div>

          {/* Feature Grid / Bauhaus Monospace details */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-space-md mt-space-xl pt-space-xl border-t-[3px] border-pure-black">
            <div className="bg-surface-container-lowest border-[3px] border-pure-black p-space-md shadow-[4px_4px_0px_#000000]">
              <span
                className="material-symbols-outlined text-[32px] text-royal-blue mb-space-xs block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
              <h3 className="text-headline-sm font-bold text-on-surface mb-1">AI Phân tích</h3>
              <p className="text-body-sm text-on-surface-variant">Thấu hiểu tiến độ và cảm xúc người học theo thời gian thực.</p>
            </div>
            <div className="bg-surface-container-lowest border-[3px] border-pure-black p-space-md shadow-[4px_4px_0px_#000000]">
              <span
                className="material-symbols-outlined text-[32px] text-vivid-red mb-space-xs block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                architecture
              </span>
              <h3 className="text-headline-sm font-bold text-on-surface mb-1">Chuẩn Bauhaus</h3>
              <p className="text-body-sm text-on-surface-variant">Giao diện tối giản, rõ ràng, tối ưu hóa sự tập trung tuyệt đối.</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="bg-surface-bright flex flex-col justify-center items-center p-space-xl lg:p-16">
          <div className="w-full max-w-md bg-surface-container-lowest border-[3px] border-pure-black p-space-xl shadow-[8px_8px_0px_#000000]">
            {/* Header */}
            <div className="mb-space-lg">
              <h2 className="text-headline-lg font-headline font-bold text-on-surface mb-space-xs">
                Đăng nhập hệ thống
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Vui lòng chọn vai trò và điền thông tin truy cập.
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-0 border-[3px] border-pure-black mb-space-lg bg-surface-container overflow-hidden">
              <button
                type="button"
                id="tab-teacher"
                onClick={() => setRole('teacher')}
                className={`py-space-sm px-space-md text-label-lg font-bold border-r-[3px] border-pure-black transition-all flex items-center justify-center gap-space-xs cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-bright-yellow text-on-surface shadow-inner'
                    : 'text-on-surface-variant hover:text-on-surface bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">school</span>
                Giáo viên
              </button>
              <button
                type="button"
                id="tab-student"
                onClick={() => setRole('student')}
                className={`py-space-sm px-space-md text-label-lg font-bold transition-all flex items-center justify-center gap-space-xs cursor-pointer ${
                  role === 'student'
                    ? 'bg-bright-yellow text-on-surface shadow-inner'
                    : 'text-on-surface-variant hover:text-on-surface bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">face</span>
                Học sinh
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-space-md p-space-sm bg-tertiary-container border-[3px] border-pure-black text-on-tertiary-container text-body-sm font-bold shadow-[2px_2px_0px_#000000] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-tertiary">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form
              data-testid="login-form"
              className="flex flex-col gap-space-md"
              onSubmit={handleLogin}
            >
              <div className="flex flex-col gap-space-xs">
                <label className="text-label-md font-bold text-on-surface" htmlFor="username">
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập (vd: giaovien, hocsinh)"
                  required
                  className="w-full px-space-md py-space-sm bg-off-white border-[3px] border-pure-black rounded-none text-body-md text-on-surface focus:bg-bright-yellow focus:outline-none focus:shadow-[4px_4px_0px_#000000] transition-all"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label className="text-label-md font-bold text-on-surface" htmlFor="password">
                    Mật khẩu
                  </label>
                  <span className="text-label-sm text-secondary hover:underline font-semibold cursor-pointer">
                    Quên mật khẩu?
                  </span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-space-md py-space-sm bg-off-white border-[3px] border-pure-black rounded-none text-body-md text-on-surface focus:bg-bright-yellow focus:outline-none focus:shadow-[4px_4px_0px_#000000] transition-all"
                />
              </div>

              <div className="flex items-center gap-space-sm mt-space-xs">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-5 h-5 accent-royal-blue border-[3px] border-pure-black rounded-none cursor-pointer"
                />
                <label htmlFor="remember" className="text-body-sm text-on-surface select-none cursor-pointer">
                  Ghi nhớ phiên đăng nhập
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-space-sm py-space-md px-space-lg bg-bright-yellow text-on-surface text-label-lg font-bold border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-space-sm cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'Vào lớp học'}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </form>

            {/* Footer Register Link */}
            <div className="mt-space-lg pt-space-md border-t-[3px] border-pure-black text-center">
              <p className="text-body-sm text-on-surface-variant">
                Chưa có tài khoản hệ thống?{' '}
                <Link to="/register" className="font-bold text-secondary hover:underline ml-space-xs">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
