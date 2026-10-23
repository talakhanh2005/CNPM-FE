import { useState } from 'react';
import { getAdminMeetings } from '../../api/adminApi';
import AdminMeetingDialog from '../../components/admin/AdminMeetingDialog';
import { AdminBadge, AdminButton, AdminEmpty, AdminField, AdminHeading, AdminLoading, AdminNotice, AdminPagination } from '../../components/admin/AdminUI';
import useAdminList from '../../hooks/useAdminList';
import useAdminTeacherNames from '../../hooks/useAdminTeacherNames';
import { formatAdminDate, getMeetingStudentCount, MEETING_MODES, MEETING_STATUSES, normalizeSearch, RECORDING_STATUSES } from '../../utils/admin';

export default function AdminMeetings() {
  const list = useAdminList(getAdminMeetings);
  const teacherNames = useAdminTeacherNames(list.items);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [selected, setSelected] = useState(null);
  const nameOf = (meeting) => teacherNames[meeting.teacher_id] || 'Đang tải tên…';
  const shown = list.items.filter((item) => (!status || item.status === status) && (!mode || item.mode === mode)
    && normalizeSearch(`${item.name} ${item.code} ${teacherNames[item.teacher_id] || ''}`).includes(normalizeSearch(query)));
  return <>
    <AdminHeading title="Theo dõi phòng học" description="Tra cứu thông tin phòng, người tham gia và tình trạng xử lý bản ghi.">
      <AdminButton icon="refresh" disabled={list.loading} onClick={list.refresh}>Làm mới</AdminButton>
    </AdminHeading>
    <AdminNotice>{list.error}</AdminNotice>
    <section className="admin-panel" aria-label="Danh sách phòng học" aria-busy={list.loading}>
      <div className="admin-toolbar">
        <AdminField label="Tìm trong trang này"><input type="search" placeholder="Tên phòng, mã hoặc giáo viên" value={query} onChange={(e) => setQuery(e.target.value)} /></AdminField>
        <AdminField label="Trạng thái trên trang"><select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>{Object.entries(MEETING_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></AdminField>
        <AdminField label="Chế độ trên trang"><select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">Tất cả chế độ</option>{Object.entries(MEETING_MODES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></AdminField>
        {(query || status || mode) && <AdminButton onClick={() => { setQuery(''); setStatus(''); setMode(''); }}>Bỏ lọc</AdminButton>}
      </div>
      {list.loading ? <AdminLoading /> : list.error ? <AdminEmpty title="Chưa tải được phòng học" description="Chọn Làm mới để thử lại." /> : shown.length ? <>
        <p className="admin-hint px-5 py-3">Hiển thị {shown.length}/{list.items.length} phòng trên trang này.</p>
        <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Bảng phòng học">
          <table className="admin-table"><thead><tr><th scope="col">Phòng học</th><th scope="col">Giáo viên</th><th scope="col">Trạng thái</th><th scope="col">HS đã tham gia</th><th scope="col">Bản ghi</th><th scope="col">Thao tác</th></tr></thead>
            <tbody>{shown.map((item) => <tr key={item.id}>
              <td className="admin-person"><p className="font-bold">{item.name || 'Phòng học chưa đặt tên'}</p><p className="font-mono mt-1">#{item.code}</p>
                <p className="admin-hint mt-1">{MEETING_MODES[item.mode] || 'Chưa xác định'}</p><p className="admin-hint">Tạo: {formatAdminDate(item.created_at)}</p>
              </td>
              <td className="admin-person">{nameOf(item)}</td>
              <td><AdminBadge tone={item.status === 'ongoing' ? 'success' : item.status === 'scheduled' ? 'info' : 'neutral'}>{MEETING_STATUSES[item.status] || 'Chưa xác định'}</AdminBadge></td>
              <td>{getMeetingStudentCount(item)}</td>
              <td><AdminBadge tone={item.recording_status === 'failed' ? 'danger' : item.recording_status === 'completed' ? 'success' : 'neutral'}>{RECORDING_STATUSES[item.recording_status] || 'Chưa xác định'}</AdminBadge></td>
              <td className="admin-table-action"><AdminButton icon="visibility" aria-label={`Xem phòng ${item.code}`} onClick={() => setSelected(item)}>Chi tiết</AdminButton></td>
            </tr>)}</tbody>
          </table>
        </div>
      </> : <AdminEmpty title={list.items.length ? 'Không có kết quả trên trang này' : 'Chưa có phòng học'} description={list.items.length ? 'Thử bỏ lọc hoặc chuyển sang trang tiếp theo.' : undefined} />}
      <AdminPagination page={list.page} count={list.items.length} hasNext={list.hasNext} loading={list.loading} onChange={list.setPage} />
    </section>
    {selected && <AdminMeetingDialog meeting={selected} teacherName={nameOf(selected)} onClose={() => setSelected(null)} />}
  </>;
}
