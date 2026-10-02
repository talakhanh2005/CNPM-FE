import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import NewRoom from '../components/NewRoom';
import History from '../components/HistoryRoom';
import JoinRoom from '../components/JoinRoom';
import useAuth from '../hooks/useAuth';
import { getMeetingHistory } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';

const formatDateTime = (value) => {
  if (!value) return 'Chưa có thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

const TeacherHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'dashboard');
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(location.state?.tab === 'phong-hoc');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMeetingHistory({ offset: 0, limit: 100 });
      setMeetings(result?.items || []);
      setError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách phòng học.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadMeetings(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMeetings]);

  const activeMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.status === 'active'),
    [meetings],
  );
  const completedMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.status !== 'active').slice(0, 6),
    [meetings],
  );
  const realtimeCount = meetings.filter((meeting) => meeting.analysisMode === 'realtime').length;
  const batchCount = meetings.filter((meeting) => meeting.analysisMode === 'batch').length;

  const openMeeting = (meeting) => {
    navigate(`/meeting/${meeting.id}`, { state: { room: meeting } });
  };

  const openReport = (meeting) => {
    navigate('/bao-cao-cam-xuc', { state: meeting ? { meeting } : undefined });
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab === 'phong-hoc') setIsCreatingRoom(true);
      }}
      onJoinRoom={(code) => setJoinRoomCode(code)}
    >
      {isCreatingRoom && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pure-black/60 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="teacher-content-enter flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden border-[3px] border-pure-black bg-surface shadow-[8px_8px_0px_#000000] sm:h-[88dvh]">
            <NewRoom onClose={() => { setIsCreatingRoom(false); setActiveTab('dashboard'); }} />
          </div>
        </div>
      )}

      {joinRoomCode && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pure-black/60 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="teacher-content-enter flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden border-[3px] border-pure-black bg-surface shadow-[8px_8px_0px_#000000] sm:h-[88dvh]">
            <JoinRoom roomCode={joinRoomCode} onClose={() => setJoinRoomCode(null)} />
          </div>
        </div>
      )}

      {activeTab === 'lich-su' ? (
        <div className="flex-1 p-gutter md:p-margin">
          <div className="mb-6 flex items-center justify-between border-b-[3px] border-pure-black pb-4">
            <h2 className="font-headline text-headline-lg font-bold">Lịch sử phòng học</h2>
            <button type="button" onClick={() => setActiveTab('dashboard')} className="border-[2px] border-pure-black bg-surface-container px-4 py-2 font-bold">
              Quay lại Dashboard
            </button>
          </div>
          <History />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-space-xl p-gutter pb-24 md:p-margin">
          <section className="relative flex flex-col items-start justify-between gap-space-md overflow-hidden border-[3px] border-pure-black bg-off-white p-space-lg shadow-[6px_6px_0px_#000000] md:flex-row md:items-center">
            <div>
              <span className="inline-flex border-[2px] border-pure-black bg-royal-blue px-3 py-1 text-label-sm font-bold text-white">DỮ LIỆU BACKEND THẬT</span>
              <h1 className="mt-2 font-headline text-headline-xl-mobile font-bold md:text-headline-xl">
                Xin chào, {user?.full_name || user?.email}!
              </h1>
              <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
                Quản lý phòng học, ghi hình học sinh và xem báo cáo cảm xúc từ backend.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setIsCreatingRoom(true)} className="border-[3px] border-pure-black bg-royal-blue px-4 py-3 font-bold text-white shadow-[4px_4px_0px_#000000]">+ Tạo phòng</button>
              <button type="button" onClick={() => openReport()} className="border-[3px] border-pure-black bg-bright-yellow px-4 py-3 font-bold shadow-[4px_4px_0px_#000000]">Báo cáo cảm xúc</button>
              <button type="button" onClick={() => void loadMeetings()} disabled={loading} className="border-[3px] border-pure-black bg-surface px-4 py-3 font-bold disabled:opacity-50">{loading ? 'Đang tải...' : 'Làm mới'}</button>
            </div>
          </section>

          {error && <div className="border-[3px] border-pure-black bg-tertiary-container p-4 font-bold text-on-tertiary-container">{error}</div>}

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Tổng phòng', meetings.length],
              ['Đang diễn ra', activeMeetings.length],
              ['Realtime', realtimeCount],
              ['Phân tích sau', batchCount],
            ].map(([label, value]) => (
              <div key={label} className="border-[3px] border-pure-black bg-surface-container-lowest p-4 shadow-[4px_4px_0px_#000000]">
                <span className="text-label-sm font-bold uppercase text-on-surface-variant">{label}</span>
                <strong className="mt-1 block font-headline text-headline-lg">{value}</strong>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-headline-md font-bold">Phòng đang diễn ra</h2>
              <span className="font-mono text-sm">{activeMeetings.length} phòng</span>
            </div>
            {loading ? (
              <div className="border-[3px] border-pure-black bg-surface p-8 text-center font-bold">Đang tải dữ liệu...</div>
            ) : activeMeetings.length === 0 ? (
              <div className="border-[3px] border-dashed border-pure-black bg-surface-container-low p-8 text-center">Chưa có phòng nào đang diễn ra.</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {activeMeetings.map((meeting) => (
                  <article key={meeting.id} className="flex flex-col gap-4 border-[3px] border-pure-black bg-off-white p-5 shadow-[4px_4px_0px_#000000]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="border-[2px] border-pure-black bg-bright-yellow px-2 py-1 font-mono font-bold">#{meeting.code}</span>
                      <span className="font-bold text-emerald-700">● TRỰC TUYẾN</span>
                    </div>
                    <div>
                      <h3 className="font-headline text-headline-sm font-bold">{meeting.name}</h3>
                      <p className="text-body-sm text-on-surface-variant">{meeting.analysisMode === 'realtime' ? 'AI cảm xúc realtime' : 'AI đánh giá sau buổi học'}</p>
                    </div>
                    <button type="button" onClick={() => openMeeting(meeting)} className="mt-auto border-[2px] border-pure-black bg-royal-blue px-3 py-2 font-bold text-white shadow-[2px_2px_0px_#000000]">Vào phòng</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-headline-md font-bold">Phòng gần đây</h2>
              <button type="button" onClick={() => setActiveTab('lich-su')} className="font-bold text-secondary underline">Xem toàn bộ</button>
            </div>
            <div className="overflow-x-auto border-[3px] border-pure-black bg-surface shadow-[4px_4px_0px_#000000]">
              <table className="w-full border-collapse text-left">
                <thead className="border-b-[3px] border-pure-black bg-surface-container"><tr><th className="p-3">Mã phòng</th><th className="p-3">Chế độ</th><th className="p-3">Thời gian</th><th className="p-3">Báo cáo</th></tr></thead>
                <tbody className="divide-y-2 divide-pure-black">
                  {completedMeetings.map((meeting) => (
                    <tr key={meeting.id}>
                      <td className="p-3 font-mono font-bold">#{meeting.code}</td>
                      <td className="p-3">{meeting.analysisMode === 'realtime' ? 'Realtime' : 'Sau buổi học'}</td>
                      <td className="p-3">{formatDateTime(meeting.endedAt || meeting.createdAt)}</td>
                      <td className="p-3"><button type="button" onClick={() => openReport(meeting)} className="font-bold text-secondary underline">Xem</button></td>
                    </tr>
                  ))}
                  {!completedMeetings.length && <tr><td colSpan="4" className="p-6 text-center text-on-surface-variant">Chưa có phòng đã kết thúc.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherHome;
