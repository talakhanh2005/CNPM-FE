import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import useAuth from '../hooks/useAuth';
import { getApiErrorMessage } from '../api/axiosClient';

const Register = () => {
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('Tên đăng nhập cần ít nhất 3 ký tự.');
      return;
    }
    if (password.length < 4) {
      setError('Mật khẩu cần ít nhất 4 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!agreed) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        role,
        username: trimmedUsername,
        password,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-73px)] w-full bg-surface">
        {/* Left Panel: Neo-Bauhaus Artistic Geometric Showcase */}
        <div className="lg:col-span-5 bg-primary-container p-8 lg:p-12 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-pure-black flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border-[3px] border-pure-black bg-bright-yellow pointer-events-none" />
          <div className="absolute top-1/3 -right-16 w-48 h-48 border-[3px] border-pure-black bg-vivid-red rotate-45 pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-64 h-64 border-[3px] border-pure-black bg-secondary-container pointer-events-none mix-blend-multiply opacity-80" />

          {/* Top Content */}
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 bg-pure-black text-on-primary text-label-sm font-bold uppercase tracking-wider mb-6 border-[3px] border-pure-black shadow-[2px_2px_0px_#000000]">
              Platform Core Values
            </div>
            <h1 className="text-headline-lg lg:text-headline-xl text-on-primary-container font-headline font-bold tracking-tight mb-4">
              HỌC THUẬT.<br />CẢM XÚC.<br />TRÍ TUỆ NHÂN TẠO.
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-md">
              Nền tảng giáo dục thông minh ứng dụng AI thấu cảm, kết nối học sinh và giáo viên trong không gian hình học chuẩn mực Bauhaus.
            </p>
          </div>

          {/* Center Dynamic Geometric Art */}
          <div className="relative z-10 my-10 flex items-center justify-center">
            <div className="relative w-60 h-60 flex items-center justify-center">
              {/* Outer Square */}
              <div className="absolute inset-0 border-[3px] border-pure-black bg-surface-container-lowest shadow-[6px_6px_0px_#000000]" />
              {/* Intersecting Circle */}
              <div className="absolute w-36 h-36 rounded-full border-[3px] border-pure-black bg-bright-yellow -top-5 -right-5 flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                <span className="material-symbols-outlined text-[44px] text-pure-black">psychology</span>
              </div>
              {/* Rotated box */}
              <div className="absolute w-28 h-28 border-[3px] border-pure-black bg-vivid-red rotate-12 -bottom-4 -left-4 flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                <span className="material-symbols-outlined text-[32px] text-on-error">school</span>
              </div>
              {/* Inner Core Symbol */}
              <div className="relative z-20 w-16 h-16 bg-secondary border-[3px] border-pure-black flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-on-secondary">auto_awesome</span>
              </div>
            </div>
          </div>

          {/* Bottom Metadata */}
          <div className="relative z-10 pt-6 border-t-[3px] border-pure-black flex items-center justify-between text-label-md font-bold text-on-surface-variant">
            <span>NEO-LEARN V2.4</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-vivid-red border-[1.5px] border-pure-black inline-block animate-pulse" />
              AI EMOTION ENGINE ACTIVE
            </span>
          </div>
        </div>

        {/* Right Panel: Registration Form */}
        <div className="lg:col-span-7 bg-surface p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-xl w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-headline-lg lg:text-headline-xl text-on-surface font-headline font-bold mb-2">
                Tạo tài khoản Neo-Learn
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Điền thông tin bên dưới để khởi tạo không gian học tập AI của bạn.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-3 bg-tertiary-container border-[3px] border-pure-black text-on-tertiary-container text-body-sm font-bold shadow-[2px_2px_0px_#000000] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-tertiary">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form
              data-testid="register-form"
              className="space-y-5"
              onSubmit={handleRegister}
            >
              {/* Role Selection Cards */}
              <div>
                <label className="block text-label-lg font-bold text-on-surface mb-2">
                  Chọn vai trò của bạn
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Teacher Role */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="teacher"
                      checked={role === 'teacher'}
                      onChange={() => setRole('teacher')}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 border-[3px] border-pure-black transition-all flex flex-col items-center text-center cursor-pointer ${
                        role === 'teacher'
                          ? 'bg-bright-yellow translate-x-1 translate-y-1 shadow-none font-bold'
                          : 'bg-surface-container-lowest shadow-[4px_4px_0px_#000000] hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[28px] mb-1 text-pure-black">badge</span>
                      <span className="text-label-lg text-pure-black">Tôi là Giáo viên</span>
                    </div>
                  </label>

                  {/* Student Role */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={role === 'student'}
                      onChange={() => setRole('student')}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 border-[3px] border-pure-black transition-all flex flex-col items-center text-center cursor-pointer ${
                        role === 'student'
                          ? 'bg-bright-yellow translate-x-1 translate-y-1 shadow-none font-bold'
                          : 'bg-surface-container-lowest shadow-[4px_4px_0px_#000000] hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[28px] mb-1 text-pure-black">person_outline</span>
                      <span className="text-label-lg text-pure-black">Tôi là Học sinh</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Full Name Field */}
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ..."
                  className="w-full px-4 py-3 bg-surface-container-lowest border-[3px] border-pure-black text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors"
                />
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tên đăng nhập (ít nhất 3 ký tự)..."
                  className="w-full px-4 py-3 bg-surface-container-lowest border-[3px] border-pure-black text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors"
                />
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-surface-container-lowest border-[3px] border-pure-black text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-surface-container-lowest border-[3px] border-pure-black text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-pure-black border-[3px] border-pure-black bg-surface-container-lowest cursor-pointer"
                />
                <label className="text-body-sm text-on-surface cursor-pointer select-none" htmlFor="terms">
                  Tôi đồng ý với{' '}
                  <span className="font-bold underline text-secondary">Điều khoản sử dụng</span>{' '}
                  và{' '}
                  <span className="font-bold underline text-secondary">Chính sách bảo mật</span>{' '}
                  của Neo-Learn AI.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-vivid-red text-on-error font-headline font-bold text-headline-sm uppercase tracking-wide border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0px_0px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>

              {/* Footer / Back to Login */}
              <div className="text-center pt-3">
                <span className="text-body-md text-on-surface-variant">Đã có tài khoản? </span>
                <Link
                  to="/login"
                  className="font-bold text-secondary underline decoration-2 underline-offset-4 hover:text-secondary-container"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
