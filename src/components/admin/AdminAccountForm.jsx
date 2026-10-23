import { useState } from 'react';
import { getUserChanges, validateUserDetails } from '../../utils/admin';
import { getAdminError, getAdminFieldErrors } from '../../utils/adminErrors';
import { ROLE_LABELS } from '../../utils/roles';
import { AdminButton, AdminField, AdminNotice } from './AdminUI';

export default function AdminAccountForm({ user, allowRole = false, disabled = false, onSave, onSaved, onBusyChange }) {
  const [values, setValues] = useState({ full_name: user.full_name || '', email: user.email || '', role: user.role });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const changes = getUserChanges(values, user);
  const change = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setError('');
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving || disabled || !Object.keys(changes).length) return;
    const nextErrors = validateUserDetails(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true); onBusyChange?.(true); setError('');
    try {
      const updated = await onSave(changes);
      onSaved(updated);
    } catch (cause) {
      setErrors(getAdminFieldErrors(cause));
      setError(getAdminError(cause, 'Chưa lưu được thay đổi. Vui lòng thử lại.'));
    } finally { setSaving(false); onBusyChange?.(false); }
  };

  return <form className="admin-form" onSubmit={submit} noValidate aria-busy={saving}>
    <AdminNotice>{error}</AdminNotice>
    <fieldset disabled={saving || disabled} className="admin-form">
      <AdminField label="Họ và tên" error={errors.full_name}>
        <input value={values.full_name} maxLength={150} autoComplete="name" onChange={(e) => change('full_name', e.target.value)} />
      </AdminField>
      <AdminField label="Email" error={errors.email}>
        <input type="email" value={values.email} autoComplete="email" onChange={(e) => change('email', e.target.value)} />
      </AdminField>
      {allowRole && <AdminField label="Vai trò" error={errors.role}
        hint={values.role === 'admin' ? 'Quản trị viên có quyền quản lý tài khoản và xem danh sách phòng học.' : undefined}>
        <select value={values.role} onChange={(e) => change('role', e.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </AdminField>}
    </fieldset>
    <div className="admin-form-actions">
      <AdminButton type="submit" variant="primary" icon="save" disabled={saving || disabled || !Object.keys(changes).length}>
        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
      </AdminButton>
    </div>
  </form>;
}
