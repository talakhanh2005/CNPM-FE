import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers } from '../../api/adminApi';
import AdminUserDialog from '../../components/admin/AdminUserDialog';
import { AdminBadge, AdminButton, AdminEmpty, AdminField, AdminHeading, AdminLoading, AdminNotice, AdminPagination } from '../../components/admin/AdminUI';
import useAdminList from '../../hooks/useAdminList';
import useAuth from '../../hooks/useAuth';
import { formatAdminDate, normalizeSearch } from '../../utils/admin';
import { ROLE_LABELS } from '../../utils/roles';

export default function AdminUsers() {
  const list = useAdminList(getAdminUsers);
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const shown = list.items.filter((item) => (!role || item.role === role)
    && normalizeSearch(`${item.full_name} ${item.email}`).includes(normalizeSearch(query)));

  return <>
    <AdminHeading title="Quản lý người dùng" description="Xem tài khoản, cập nhật thông tin và phân quyền sử dụng hệ thống.">
      <AdminButton icon="refresh" onClick={list.refresh} disabled={list.loading}>Làm mới</AdminButton>
    </AdminHeading>
    <AdminNotice tone="success" onDismiss={() => setNotice('')}>{notice}</AdminNotice>
    <AdminNotice>{list.error}</AdminNotice>
    <section className="admin-panel" aria-label="Danh sách người dùng" aria-busy={list.loading}>
      <div className="admin-toolbar">
        <AdminField label="Tìm trong trang này"><input type="search" placeholder="Tên hoặc email" value={query} onChange={(e) => setQuery(e.target.value)} /></AdminField>
        <AdminField label="Vai trò trên trang"><select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></AdminField>
        {(query || role) && <AdminButton onClick={() => { setQuery(''); setRole(''); }}>Bỏ lọc</AdminButton>}
      </div>
      {list.loading ? <AdminLoading /> : list.error ? <AdminEmpty title="Chưa tải được người dùng" description="Chọn Làm mới để thử lại." /> : shown.length ? <>
        <p className="admin-hint px-5 py-3">Hiển thị {shown.length}/{list.items.length} tài khoản trên trang này.</p>
        <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Bảng người dùng">
          <table className="admin-table"><thead><tr><th scope="col">Người dùng</th><th scope="col">Vai trò</th><th scope="col">Ngày tạo</th><th scope="col">Thao tác</th></tr></thead>
            <tbody>{shown.map((item) => <tr key={item.id}>
              <td className="admin-person"><p className="font-bold">{item.full_name || 'Chưa có tên'}{item.id === user.id && <span className="admin-hint"> (Bạn)</span>}</p><p className="admin-hint">{item.email}</p></td>
              <td><AdminBadge tone={item.role}>{ROLE_LABELS[item.role] || 'Chưa xác định'}</AdminBadge></td>
              <td className="whitespace-nowrap">{formatAdminDate(item.created_at)}</td>
              <td className="admin-table-action">{item.id === user.id
                ? <Link className="admin-button" to="/admin/profile">Hồ sơ của tôi</Link>
                : <AdminButton icon="edit_square" aria-label={`Quản lý ${item.full_name || item.email}`} onClick={() => { setNotice(''); setSelected(item.id); }}>Quản lý</AdminButton>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      </> : <AdminEmpty title={list.items.length ? 'Không có kết quả trên trang này' : 'Chưa có người dùng'}
        description={list.items.length ? 'Thử từ khóa khác, bỏ lọc hoặc chuyển sang trang tiếp theo.' : undefined} />}
      <AdminPagination page={list.page} count={list.items.length} hasNext={list.hasNext} loading={list.loading} onChange={list.setPage} />
    </section>
    {selected && <AdminUserDialog key={selected} userId={selected} onClose={() => setSelected(null)} onChanged={(message) => {
      setSelected(null); setNotice(message); list.refresh();
    }} />}
  </>;
}
