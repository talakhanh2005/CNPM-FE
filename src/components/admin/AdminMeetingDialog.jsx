import { formatAdminDate, getMeetingStudentCount, MEETING_MODES, MEETING_STATUSES, PARTICIPANT_STATUSES, RECORDING_STATUSES } from '../../utils/admin';
import { ROLE_LABELS } from '../../utils/roles';
import { AdminBadge, AdminEmpty, AdminModal } from './AdminUI';

export default function AdminMeetingDialog({ meeting, teacherName, onClose }) {
  const details = [
    ['Mã phòng', meeting.code], ['Giáo viên', teacherName],
    ['Chế độ', MEETING_MODES[meeting.mode] || 'Chưa xác định'], ['Trạng thái', MEETING_STATUSES[meeting.status] || 'Chưa xác định'],
    ['Ngày tạo', formatAdminDate(meeting.created_at)], ['Kết thúc lúc', formatAdminDate(meeting.ended_at)],
    ['Thời lượng dự kiến', meeting.duration_minutes ? `${meeting.duration_minutes} phút` : '—'],
    ['Tham gia phòng', meeting.participant_mode === 'approval' ? 'Cần phê duyệt' : meeting.participant_mode === 'free' ? 'Tự do' : 'Chưa xác định'],
    ['Học sinh đã tham gia', getMeetingStudentCount(meeting)], ['Xử lý bản ghi', RECORDING_STATUSES[meeting.recording_status] || 'Chưa xác định'],
  ];
  return <AdminModal title="Thông tin phòng học" onClose={onClose} wide>
    <div><h3 className="text-xl font-bold break-words">{meeting.name || 'Phòng học chưa đặt tên'}</h3>
      {meeting.description && <p className="mt-2 whitespace-pre-wrap break-words">{meeting.description}</p>}
      {meeting.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{[...new Set(meeting.tags)].map((tag) => <AdminBadge key={tag}>{tag}</AdminBadge>)}</div>}
    </div>
    <dl className="admin-detail-grid">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
    {meeting.recording_status === 'failed' && <p className="admin-hint">Có bản ghi chưa xử lý thành công.</p>}
    <section className="admin-detail-section">
      <h3>Người tham gia ({meeting.participants?.length || 0})</h3>
      {meeting.participants?.length ? <div className="admin-table-scroll" role="region" tabIndex={0} aria-label="Bảng người tham gia">
        <table className="admin-table"><thead><tr><th scope="col">Họ và tên</th><th scope="col">Vai trò</th><th scope="col">Trạng thái</th><th scope="col">Vào phòng</th><th scope="col">Rời / mất kết nối</th></tr></thead>
          <tbody>{meeting.participants.map((person) => {
            const role = person.user_id === meeting.teacher_id ? 'teacher' : person.role;
            const lastEvent = person.status === 'disconnected' ? person.disconnected_at : person.status === 'left' ? person.left_at : null;
            return <tr key={person.user_id}>
              <td className="admin-person">{person.full_name || 'Không còn thông tin tên'}</td>
              <td><AdminBadge tone={role || 'neutral'}>{ROLE_LABELS[role] || 'Chưa xác định'}</AdminBadge></td>
              <td>{PARTICIPANT_STATUSES[person.status] || 'Chưa xác định'}</td>
              <td className="whitespace-nowrap">{formatAdminDate(person.joined_at)}</td>
              <td className="whitespace-nowrap">{formatAdminDate(lastEvent)}</td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <AdminEmpty title="Chưa có người tham gia" />}
    </section>
  </AdminModal>;
}
