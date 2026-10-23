import { getApiErrorMessage, getApiErrorPayload } from '../api/axiosClient';

export const getAdminError = (error, fallback = 'Không thể hoàn tất thao tác. Vui lòng thử lại.') => {
  const { code, status } = getApiErrorPayload(error);
  const messages = {
    EMAIL_EXISTS: 'Email này đã được sử dụng bởi tài khoản khác.',
    SELF_DELETE: 'Bạn không thể xóa tài khoản đang đăng nhập.',
    SELF_DEMOTION: 'Bạn không thể tự thay đổi vai trò quản trị viên của mình.',
    USER_NOT_FOUND: 'Tài khoản không còn tồn tại. Hãy làm mới danh sách.',
    USER_IN_USE: 'Tài khoản còn dữ liệu liên quan nên chưa thể xóa.',
    VALIDATION_ERROR: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.',
  };
  if (messages[code]) return messages[code];
  if (status === 404) return 'Không tìm thấy thông tin yêu cầu. Vui lòng làm mới và thử lại.';
  return getApiErrorMessage(error, fallback);
};

export const getAdminFieldErrors = (error) => {
  const { code, details } = getApiErrorPayload(error);
  if (code === 'EMAIL_EXISTS') return { email: 'Email này đã được sử dụng bởi tài khoản khác.' };
  const messages = {
    email: 'Vui lòng nhập địa chỉ email hợp lệ.',
    full_name: 'Họ và tên phải từ 1 đến 150 ký tự.',
    role: 'Vai trò tài khoản không hợp lệ.',
    password: 'Mật khẩu chưa hợp lệ. Vui lòng kiểm tra độ dài và thử lại.',
  };
  return Object.fromEntries((Array.isArray(details) ? details : []).flatMap((detail) => {
    const field = detail.loc?.at(-1);
    return messages[field] ? [[field, messages[field]]] : [];
  }));
};
