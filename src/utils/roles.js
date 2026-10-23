export const ROLE_LABELS = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học sinh' };

export const getRoleHome = (role) => ({
  admin: '/admin/users',
  teacher: '/teacher',
  student: '/student',
}[role] || '/login');
