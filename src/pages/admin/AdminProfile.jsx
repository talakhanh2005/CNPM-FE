import { useCallback, useState } from 'react';
import { getAdminProfile, updateAdminProfile } from '../../api/adminApi';
import AdminAccountForm from '../../components/admin/AdminAccountForm';
import AdminPasswordForm from '../../components/admin/AdminPasswordForm';
import { AdminBadge, AdminButton, AdminHeading, AdminLoading, AdminNotice } from '../../components/admin/AdminUI';
import useAuth from '../../hooks/useAuth';
import useAdminResource from '../../hooks/useAdminResource';
import { formatAdminDate } from '../../utils/admin';

export default function AdminProfile() {
  const { updateCurrentUser } = useAuth();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (signal) => {
    const data = await getAdminProfile(signal);
    if (!signal.aborted) updateCurrentUser(data);
    return data;
  }, [updateCurrentUser]);
  const { data: profile, loading, error, refresh, updateData } = useAdminResource(load);
  const saved = (data, message) => {
    updateCurrentUser(data); updateData(data); setNotice(message);
  };
  return <>
    <AdminHeading title="Hồ sơ của tôi" description="Cập nhật thông tin liên hệ và mật khẩu tài khoản quản trị." />
    <AdminNotice tone="success" onDismiss={() => setNotice('')}>{notice}</AdminNotice>
    <AdminNotice>{error}</AdminNotice>
    {loading ? <AdminLoading /> : error ? <div><AdminButton icon="refresh" onClick={refresh}>Thử lại</AdminButton></div> : profile && <>
      <div className="flex flex-wrap items-center gap-3"><AdminBadge tone="admin">Quản trị viên</AdminBadge><p className="admin-hint">Ngày tạo tài khoản: {formatAdminDate(profile.created_at)}</p></div>
      <div className="admin-profile-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><h2>Thông tin cá nhân</h2></div>
          <div className="admin-panel-body"><AdminAccountForm key={`${profile.full_name}-${profile.email}`} user={profile} onSave={updateAdminProfile}
            disabled={busy} onBusyChange={setBusy} onSaved={(data) => saved(data, 'Đã cập nhật thông tin cá nhân.')} /></div>
        </section>
        <section className="admin-panel"><div className="admin-panel-heading"><h2>Đổi mật khẩu</h2></div>
          <div className="admin-panel-body"><AdminPasswordForm onSave={updateAdminProfile}
            disabled={busy} onBusyChange={setBusy} onSaved={(data) => saved(data, 'Đã đổi mật khẩu. Lần đăng nhập tiếp theo hãy dùng mật khẩu mới.')} /></div>
        </section>
      </div>
    </>}
  </>;
}
