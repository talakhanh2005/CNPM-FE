import { isValidEmail, utf8Length } from './validation.js';
import { ROLE_LABELS } from './roles.js';

export const ADMIN_PAGE_SIZE = 20;
export const MEETING_STATUSES = { scheduled: 'Chưa bắt đầu', ongoing: 'Đang diễn ra', ended: 'Đã kết thúc' };
export const MEETING_MODES = { realtime: 'Cảm xúc realtime', after_session: 'AI đánh giá sau' };
export const RECORDING_STATUSES = {
  none: 'Chưa có bản ghi', uploaded: 'Đã tải lên', pending: 'Chờ xử lý',
  processing: 'Đang xử lý', completed: 'Hoàn tất', failed: 'Xử lý thất bại',
};
export const PARTICIPANT_STATUSES = { joined: 'Trong phòng', left: 'Đã rời phòng', disconnected: 'Mất kết nối' };

export const formatAdminDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const normalizeSearch = (value) => String(value || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export const parseAdminPage = (value) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && Number.isSafeInteger(page * ADMIN_PAGE_SIZE) ? page : 1;
};

// One extra row tells us whether a next page exists without inventing a total.
export const selectAdminPage = (items, size = ADMIN_PAGE_SIZE) => ({
  items: items.slice(0, size), hasNext: items.length > size,
});

export const validateUserDetails = (values) => {
  const errors = {};
  if (!values.full_name.trim() || values.full_name.trim().length > 150) errors.full_name = 'Họ và tên phải từ 1 đến 150 ký tự.';
  if (!isValidEmail(values.email.trim())) errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
  if (!Object.hasOwn(ROLE_LABELS, values.role)) errors.role = 'Vui lòng chọn vai trò hợp lệ.';
  return errors;
};

export const getUserChanges = (values, user) => {
  const normalized = { full_name: values.full_name.trim(), email: values.email.trim().toLowerCase(), role: values.role };
  return Object.fromEntries(Object.entries(normalized).filter(([key, value]) => value !== user[key]));
};

export const validateNewPassword = (password, confirmation) => {
  const errors = {};
  if ([...password].length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
  else if (utf8Length(password) > 72) errors.password = 'Mật khẩu quá dài. Vui lòng dùng mật khẩu ngắn hơn.';
  if (!confirmation) errors.confirmation = 'Vui lòng nhập lại mật khẩu mới.';
  else if (confirmation !== password) errors.confirmation = 'Mật khẩu xác nhận không khớp.';
  return errors;
};

export const getMeetingStudentCount = (meeting) => {
  const ids = [
    ...(meeting.student_ids || []), meeting.student_id,
    ...(meeting.participants || []).filter((person) => person.role === 'student').map((person) => person.user_id),
  ];
  return new Set(ids.filter((id) => id && id !== meeting.teacher_id)).size;
};
