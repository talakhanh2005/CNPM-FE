import { useCallback, useMemo } from 'react';
import { getAdminUser } from '../api/adminApi';
import useAdminResource from './useAdminResource';

export default function useAdminTeacherNames(meetings) {
  const known = useMemo(() => {
    const names = {};
    meetings.forEach((meeting) => {
      const teacher = meeting.participants?.find((person) => person.user_id === meeting.teacher_id);
      if (teacher?.full_name) names[meeting.teacher_id] = teacher.full_name;
    });
    return names;
  }, [meetings]);
  const load = useCallback(async (signal) => {
    const missing = [...new Set(meetings.map((meeting) => meeting.teacher_id))].filter((id) => id && !known[id]);
    const results = await Promise.allSettled(missing.map(async (id) => {
      try {
        const user = await getAdminUser(id, signal);
        return [id, user.full_name || user.email];
      } catch (error) {
        return [id, error.response?.status === 404 ? 'Tài khoản không còn tồn tại' : 'Chưa tải được tên'];
      }
    }));
    const entries = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    return { ...known, ...Object.fromEntries(entries) };
  }, [known, meetings]);
  const { data } = useAdminResource(load);
  return data || known;
}
