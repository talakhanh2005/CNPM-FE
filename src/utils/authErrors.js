import { getApiErrorPayload } from '../api/axiosClient';

const fieldNames = {
  email: 'email',
  password: 'password',
  full_name: 'fullName',
  role: 'role',
  teacher_registration_key: 'teacherRegistrationKey',
};

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const utf8Length = (value) => new TextEncoder().encode(value).length;

const validationMessage = (field, detail) => {
  const type = String(detail?.type || '');
  if (field === 'email') return 'Email không đúng định dạng, ví dụ: ten@example.com.';
  if (field === 'password') {
    if (type.includes('too_short')) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (type.includes('too_long') || type.includes('value_error')) return 'Mật khẩu không được vượt quá 72 byte UTF-8.';
    return 'Mật khẩu không hợp lệ.';
  }
  if (field === 'fullName') return 'Họ và tên phải từ 1 đến 150 ký tự và không được để trống.';
  if (field === 'role') return 'Vai trò tài khoản không hợp lệ.';
  if (field === 'teacherRegistrationKey') return 'Mã mời giáo viên không hợp lệ.';
  return detail?.msg || 'Dữ liệu không hợp lệ.';
};

export const mapAuthApiError = (error, action) => {
  const payload = getApiErrorPayload(error);
  const result = { formError: '', fieldErrors: {} };

  if (payload.isNetworkError) {
    result.formError = 'Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy và thử lại.';
    return result;
  }

  if (payload.code === 'INVALID_CREDENTIALS') {
    result.formError = 'Email hoặc mật khẩu không chính xác.';
    return result;
  }
  if (payload.code === 'EMAIL_EXISTS' || payload.code === 'CONFLICT') {
    result.fieldErrors.email = 'Email này đã được đăng ký. Hãy dùng email khác hoặc đăng nhập.';
    return result;
  }
  if (payload.code === 'TEACHER_INVITE_REQUIRED') {
    result.fieldErrors.teacherRegistrationKey = 'Mã mời giáo viên bị thiếu hoặc không chính xác.';
    return result;
  }
  if (payload.code === 'VALIDATION_ERROR') {
    payload.details.forEach((detail) => {
      const location = detail?.loc || [];
      const backendField = location[location.length - 1];
      const field = fieldNames[backendField];
      if (field && !result.fieldErrors[field]) result.fieldErrors[field] = validationMessage(field, detail);
    });
    if (!Object.keys(result.fieldErrors).length) result.formError = 'Thông tin gửi lên chưa đúng định dạng.';
    return result;
  }
  if (payload.status === 429 || payload.code === 'RATE_LIMITED') {
    result.formError = 'Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.';
    return result;
  }
  if (payload.status >= 500) {
    result.formError = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    return result;
  }
  if (payload.status === 403) {
    result.formError = action === 'register'
      ? 'Bạn không có quyền đăng ký loại tài khoản này.'
      : 'Tài khoản không có quyền đăng nhập vào hệ thống.';
    return result;
  }

  result.formError = action === 'login'
    ? 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.'
    : 'Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại.';
  return result;
};
