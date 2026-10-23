import { useState } from 'react';
import { validateNewPassword } from '../../utils/admin';
import { getAdminError, getAdminFieldErrors } from '../../utils/adminErrors';
import { AdminButton, AdminField, AdminNotice } from './AdminUI';

export default function AdminPasswordForm({ disabled = false, onSave, onSaved, onBusyChange }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (saving || disabled) return;
    const nextErrors = validateNewPassword(password, confirmation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true); onBusyChange?.(true); setError('');
    try {
      const updated = await onSave({ password });
      setPassword(''); setConfirmation('');
      onSaved(updated);
    } catch (cause) {
      setErrors(getAdminFieldErrors(cause));
      setError(getAdminError(cause, 'Chưa đổi được mật khẩu. Vui lòng thử lại.'));
    } finally { setSaving(false); onBusyChange?.(false); }
  };
  return <form onSubmit={submit} noValidate className="admin-form" aria-busy={saving}>
    <AdminNotice>{error}</AdminNotice>
    <fieldset disabled={saving || disabled} className="admin-form">
      <AdminField label="Mật khẩu mới" error={errors.password} hint="Dùng ít nhất 8 ký tự.">
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => {
          setPassword(e.target.value); setErrors({}); setError('');
        }} />
      </AdminField>
      <AdminField label="Xác nhận mật khẩu mới" error={errors.confirmation}>
        <input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => {
          setConfirmation(e.target.value); setErrors((current) => ({ ...current, confirmation: '' })); setError('');
        }} />
      </AdminField>
    </fieldset>
    <div className="admin-form-actions">
      <AdminButton type="submit" variant="primary" icon="lock_reset" disabled={saving || disabled}>
        {saving ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
      </AdminButton>
    </div>
  </form>;
}
