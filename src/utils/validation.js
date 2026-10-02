const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_PATTERN.test(String(value || '').trim());

export const utf8ByteLength = (value) => new TextEncoder().encode(String(value || '')).length;

export const validatePassword = (value) => {
  const password = String(value || '');
  if (password.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
  if (password.length > 72 || utf8ByteLength(password) > 72) {
    return 'Mật khẩu không được vượt quá 72 byte.';
  }
  return '';
};

const fieldLabels = {
  email: 'Email',
  password: 'Mật khẩu',
  full_name: 'Họ và tên',
  role: 'Vai trò',
  teacher_registration_key: 'Mã mời giáo viên',
};

const friendlyValidationMessage = (detail) => {
  const field = detail?.loc?.at?.(-1);
  const label = fieldLabels[field] || 'Dữ liệu';
  const type = String(detail?.type || '');
  const message = String(detail?.msg || 'không hợp lệ');

  if (field === 'email') return 'Email không hợp lệ. Ví dụ đúng: ten@example.com.';
  if (type === 'missing') return `${label} là bắt buộc.`;
  if (type.includes('string_too_short')) return `${label} quá ngắn.`;
  if (type.includes('string_too_long')) return `${label} quá dài.`;
  return `${label}: ${message}`;
};

export const apiErrorMessage = (error, fallback = 'Đã có lỗi xảy ra.') => {
  const body = error?.response?.data;
  const details = body?.data?.details;
  if (Array.isArray(details) && details.length) return friendlyValidationMessage(details[0]);
  return body?.message || error?.message || fallback;
};
