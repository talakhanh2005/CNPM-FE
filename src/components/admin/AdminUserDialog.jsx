import { useCallback, useState } from 'react';
import { deleteAdminUser, getAdminUser, updateAdminUser } from '../../api/adminApi';
import useAuth from '../../hooks/useAuth';
import useAdminResource from '../../hooks/useAdminResource';
import { formatAdminDate } from '../../utils/admin';
import { getAdminError } from '../../utils/adminErrors';
import { ROLE_LABELS } from '../../utils/roles';
import AdminAccountForm from './AdminAccountForm';
import AdminPasswordForm from './AdminPasswordForm';
import { AdminBadge, AdminButton, AdminField, AdminLoading, AdminModal, AdminNotice } from './AdminUI';

export default function AdminUserDialog({ userId, onClose, onChanged }) {
  const { user: currentUser, updateCurrentUser } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('details');
  const [confirmation, setConfirmation] = useState('');
  const isSelf = userId === currentUser.id;
  const load = useCallback((signal) => getAdminUser(userId, signal), [userId]);
  const { data: user, loading, error: loadError, refresh } = useAdminResource(load);

  const saved = (updated) => {
    if (isSelf) updateCurrentUser(updated);
    onChanged(mode === 'password' ? 'Đã cập nhật mật khẩu.' : 'Đã lưu thông tin tài khoản.');
  };
  const canDelete = user && !isSelf && confirmation.trim().toLowerCase() === user.email.toLowerCase();
  const remove = async (event) => {
    event.preventDefault();
    if (!canDelete || busy) return;
    setBusy(true); setError('');
    try {
      await deleteAdminUser(userId);
      onChanged('Đã xóa tài khoản.');
    } catch (cause) { setError(getAdminError(cause, 'Chưa xóa được tài khoản. Vui lòng thử lại.')); }
    finally { setBusy(false); }
  };
  const changeMode = (next) => { setMode(next); setError(''); setConfirmation(''); };

  return <AdminModal title={mode === 'delete' ? 'Xóa tài khoản' : mode === 'password' ? 'Đặt lại mật khẩu' : 'Thông tin người dùng'} onClose={onClose} busy={busy}>
    {loading ? <AdminLoading /> : <>
      <AdminNotice>{error || loadError}</AdminNotice>
      {!user ? <AdminButton icon="refresh" onClick={refresh}>Thử lại</AdminButton> : <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 break-words"><p className="text-lg font-bold">{user.full_name || user.email}</p><p className="admin-hint break-all">{user.email}</p></div>
          <AdminBadge tone={user.role}>{ROLE_LABELS[user.role] || 'Chưa xác định'}</AdminBadge>
        </div>
        {mode !== 'details' && <div><AdminButton icon="arrow_back" disabled={busy} onClick={() => changeMode('details')}>Thông tin tài khoản</AdminButton></div>}
        {mode === 'details' && <>
          <p className="admin-hint">Ngày tạo: {formatAdminDate(user.created_at)}</p>
          <AdminAccountForm user={user} allowRole={!isSelf} onSave={(payload) => updateAdminUser(userId, payload)} onSaved={saved} onBusyChange={setBusy} />
          <div className="admin-account-actions">
            <AdminButton icon="lock_reset" disabled={busy} onClick={() => changeMode('password')}>Đặt lại mật khẩu</AdminButton>
            {!isSelf && <AdminButton variant="danger" icon="delete" disabled={busy} onClick={() => changeMode('delete')}>Xóa tài khoản</AdminButton>}
          </div>
        </>}
        {mode === 'password' && <AdminPasswordForm onSave={(payload) => updateAdminUser(userId, payload)} onSaved={saved} onBusyChange={setBusy} />}
        {mode === 'delete' && <form className="admin-form" onSubmit={remove}>
          <p>Tài khoản sẽ bị xóa và không thể đăng nhập. Phòng học và dữ liệu đã tạo trước đó vẫn được giữ lại. Thao tác này không thể hoàn tác.</p>
          <AdminField label="Nhập email tài khoản để xác nhận">
            <input type="email" autoComplete="off" value={confirmation} disabled={busy} onChange={(e) => setConfirmation(e.target.value)} />
          </AdminField>
          <div className="admin-form-actions"><AdminButton type="submit" variant="danger" icon="delete_forever" disabled={!canDelete || busy}>
            {busy ? 'Đang xóa…' : 'Xác nhận xóa'}
          </AdminButton></div>
        </form>}
      </>}
    </>}
  </AdminModal>;
}
