import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import useAuth from '../hooks/useAuth';
import { isValidEmail, mapAuthApiError, utf8Length } from '../utils/authErrors';

const Register = () => {
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [teacherRegistrationKey, setTeacherRegistrationKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedTeacherKey = teacherRegistrationKey.trim();
    const nextErrors = {};
    if (!normalizedName) nextErrors.fullName = 'Vui lòng nhập họ và tên.';
    else if (normalizedName.length > 150) nextErrors.fullName = 'Họ và tên không được vượt quá 150 ký tự.';
    if (!normalizedEmail) nextErrors.email = 'Vui lòng nhập email.';
    else if (!isValidEmail(normalizedEmail)) nextErrors.email = 'Email không đúng định dạng, ví dụ: ten@example.com.';
    if (!password) nextErrors.password = 'Vui lòng nhập mật khẩu.';
    else if (password.length < 8) nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    else if (utf8Length(password) > 72) nextErrors.password = 'Mật khẩu không được vượt quá 72 byte UTF-8.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (role === 'teacher' && normalizedTeacherKey.length > 256) nextErrors.teacherRegistrationKey = 'Mã mời giáo viên không được vượt quá 256 ký tự.';
    if (!agreed) nextErrors.agreed = 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setFormError('');
      return;
    }

    try {
      setLoading(true);
      setFormError('');
      setFieldErrors({});
      await register({
        role,
        email: normalizedEmail,
        full_name: normalizedName,
        password,
        ...(role === 'teacher' && normalizedTeacherKey
          ? { teacher_registration_key: normalizedTeacherKey }
          : {}),
      });
      navigate('/login', { replace: true, state: { notice: 'Đăng ký thành công. Bạn có thể đăng nhập ngay.' } });
    } catch (err) {
      const mapped = mapAuthApiError(err, 'register');
      setFormError(mapped.formError);
      setFieldErrors(mapped.fieldErrors);
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
              Nền tảng giáo dục thông minh ứng dụng AI thấu cảm, kết nối học sinh và giáo viên trong không gian trực tuyến hiện đại, trực quan.
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
            {formError && (
              <div className="mb-6 p-3 bg-tertiary-container border-[3px] border-pure-black text-on-tertiary-container text-body-sm font-bold shadow-[2px_2px_0px_#000000] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-tertiary">error</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Registration Form */}
            <form
              data-testid="register-form"
              noValidate
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
                      onChange={() => {
                        setRole('teacher');
                        setFieldErrors((current) => ({ ...current, role: '', teacherRegistrationKey: '' }));
                        setFormError('');
                      }}
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
                      onChange={() => {
                        setRole('student');
                        setFieldErrors((current) => ({ ...current, role: '', teacherRegistrationKey: '' }));
                        setFormError('');
                      }}
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
                {fieldErrors.role && <p className="mt-2 text-label-sm font-bold text-vivid-red">{fieldErrors.role}</p>}
              </div>

              {/* Full Name Field */}
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setFieldErrors((current) => ({ ...current, fullName: '' }));
                    setFormError('');
                  }}
                  placeholder="Nhập họ và tên đầy đủ..."
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'register-name-error' : undefined}
                  className={`w-full px-4 py-3 bg-surface-container-lowest border-[3px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors ${fieldErrors.fullName ? 'border-vivid-red' : 'border-pure-black'}`}
                />
                {fieldErrors.fullName && <p id="register-name-error" className="mt-1 text-label-sm font-bold text-vivid-red">{fieldErrors.fullName}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((current) => ({ ...current, email: '' }));
                    setFormError('');
                  }}
                  placeholder="email@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                  className={`w-full px-4 py-3 bg-surface-container-lowest border-[3px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors ${fieldErrors.email ? 'border-vivid-red' : 'border-pure-black'}`}
                />
                {fieldErrors.email && <p id="register-email-error" className="mt-1 text-label-sm font-bold text-vivid-red">{fieldErrors.email}</p>}
              </div>

              {role === 'teacher' && (
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">
                    Mã mời giáo viên
                  </label>
                  <input
                    type="password"
                    maxLength={256}
                    value={teacherRegistrationKey}
                    onChange={(e) => {
                      setTeacherRegistrationKey(e.target.value);
                      setFieldErrors((current) => ({ ...current, teacherRegistrationKey: '' }));
                      setFormError('');
                    }}
                    placeholder="Nhập mã mời do quản trị viên cung cấp"
                    aria-invalid={Boolean(fieldErrors.teacherRegistrationKey)}
                    aria-describedby={fieldErrors.teacherRegistrationKey ? 'register-teacher-key-error' : undefined}
                    className={`w-full px-4 py-3 bg-surface-container-lowest border-[3px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors ${fieldErrors.teacherRegistrationKey ? 'border-vivid-red' : 'border-pure-black'}`}
                  />
                  {fieldErrors.teacherRegistrationKey && <p id="register-teacher-key-error" className="mt-1 text-label-sm font-bold text-vivid-red">{fieldErrors.teacherRegistrationKey}</p>}
                </div>
              )}

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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((current) => ({ ...current, password: '', confirmPassword: '' }));
                      setFormError('');
                    }}
                    placeholder="••••••••"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
                    className={`w-full px-4 py-3 bg-surface-container-lowest border-[3px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors ${fieldErrors.password ? 'border-vivid-red' : 'border-pure-black'}`}
                  />
                  {fieldErrors.password && <p id="register-password-error" className="mt-1 text-label-sm font-bold text-vivid-red">{fieldErrors.password}</p>}
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
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors((current) => ({ ...current, confirmPassword: '' }));
                      setFormError('');
                    }}
                    placeholder="••••••••"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-error' : undefined}
                    className={`w-full px-4 py-3 bg-surface-container-lowest border-[3px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-bright-yellow shadow-[4px_4px_0px_#000000] transition-colors ${fieldErrors.confirmPassword ? 'border-vivid-red' : 'border-pure-black'}`}
                  />
                  {fieldErrors.confirmPassword && <p id="register-confirm-error" className="mt-1 text-label-sm font-bold text-vivid-red">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setFieldErrors((current) => ({ ...current, agreed: '' }));
                    setFormError('');
                  }}
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
              {fieldErrors.agreed && <p className="-mt-3 text-label-sm font-bold text-vivid-red">{fieldErrors.agreed}</p>}

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
