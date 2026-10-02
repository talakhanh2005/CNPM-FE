import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import JoinRoom from '../components/JoinRoom';
import useAuth from '../hooks/useAuth';
import { getMeetingHistory } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

const StudentHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'dashboard');
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const [inputCode, setInputCode] = useState('');
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
      setError(getApiErrorMessage(requestError, 'Không thể tải phòng học của bạn.'));
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
  const history = useMemo(
    () => meetings.filter((meeting) => meeting.status !== 'active'),
    [meetings],
  );

  const submitCode = (event) => {
    event.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    setJoinRoomCode(code);
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onJoinRoom={(code) => setJoinRoomCode(code)}
    >
      {joinRoomCode && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pure-black/60 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="teacher-content-enter flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden border-[3px] border-pure-black bg-surface shadow-[8px_8px_0px_#000000] sm:h-[88dvh]">
            <JoinRoom roomCode={joinRoomCode} onClose={() => setJoinRoomCode(null)} />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-space-xl p-gutter pb-24 md:p-margin">
        <section className="relative overflow-hidden border-[3px] border-pure-black bg-bright-yellow p-6 shadow-[6px_6px_0px_#000000]">
          <span className="inline-flex border-[2px] border-pure-black bg-pure-black px-3 py-1 text-label-sm font-bold text-white">PHÒNG HỌC TỪ BACKEND</span>
          <h1 className="mt-3 font-headline text-headline-xl-mobile font-bold md:text-headline-xl">Xin chào, {user?.full_name || user?.email}!</h1>
          <p className="mt-1 max-w-2xl text-body-md">Nhập mã phòng giáo viên cung cấp để tham gia lớp học.</p>
          <form onSubmit={submitCode} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={inputCode}
              onChange={(event) => setInputCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 12))}
              placeholder="Nhập mã phòng"
              className="min-w-0 flex-1 border-[3px] border-pure-black bg-white px-4 py-3 font-mono font-bold uppercase outline-none"
            />
            <button type="submit" disabled={!inputCode.trim()} className="border-[3px] border-pure-black bg-royal-blue px-5 py-3 font-bold text-white shadow-[4px_4px_0px_#000000] disabled:opacity-50">Tham gia</button>
          </form>
        </section>

        {error && <div className="border-[3px] border-pure-black bg-tertiary-container p-4 font-bold text-on-tertiary-container">{error}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['Phòng đang học', activeMeetings.length],
            ['Buổi đã tham gia', history.length],
            ['Tổng cộng', meetings.length],
          ].map(([label, value]) => (
            <div key={label} className="border-[3px] border-pure-black bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#000000]">
              <span className="text-label-sm font-bold uppercase text-on-surface-variant">{label}</span>
              <strong className="mt-1 block font-headline text-headline-lg">{value}</strong>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-headline-md font-bold">Phòng đang diễn ra</h2>
            <button type="button" onClick={() => void loadMeetings()} disabled={loading} className="border-[2px] border-pure-black bg-surface px-3 py-2 font-bold disabled:opacity-50">{loading ? 'Đang tải...' : 'Làm mới'}</button>
          </div>
          {activeMeetings.length === 0 ? (
            <div className="border-[3px] border-dashed border-pure-black bg-surface-container-low p-8 text-center">Bạn chưa tham gia phòng nào đang diễn ra.</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activeMeetings.map((meeting) => (
                <article key={meeting.id} className="flex flex-col gap-4 border-[3px] border-pure-black bg-off-white p-5 shadow-[4px_4px_0px_#000000]">
                  <div className="flex items-center justify-between"><span className="border-[2px] border-pure-black bg-bright-yellow px-2 py-1 font-mono font-bold">#{meeting.code}</span><span className="font-bold text-emerald-700">● LIVE</span></div>
                  <div><h3 className="font-headline text-headline-sm font-bold">{meeting.name}</h3><p className="text-body-sm text-on-surface-variant">{meeting.analysisMode === 'realtime' ? 'AI cảm xúc realtime' : 'AI đánh giá sau'}</p></div>
                  <button type="button" onClick={() => navigate(`/meeting/${meeting.id}`, { state: { room: meeting } })} className="mt-auto border-[2px] border-pure-black bg-royal-blue px-3 py-2 font-bold text-white shadow-[2px_2px_0px_#000000]">Vào lại phòng</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-headline text-headline-md font-bold">Lịch sử tham gia</h2>
          <div className="overflow-x-auto border-[3px] border-pure-black bg-surface shadow-[4px_4px_0px_#000000]">
            <table className="w-full border-collapse text-left">
              <thead className="border-b-[3px] border-pure-black bg-surface-container"><tr><th className="p-3">Mã phòng</th><th className="p-3">Chế độ</th><th className="p-3">Bắt đầu</th><th className="p-3">Kết thúc</th></tr></thead>
              <tbody className="divide-y-2 divide-pure-black">
                {history.map((meeting) => (
                  <tr key={meeting.id}><td className="p-3 font-mono font-bold">#{meeting.code}</td><td className="p-3">{meeting.analysisMode === 'realtime' ? 'Realtime' : 'Sau buổi học'}</td><td className="p-3">{formatDateTime(meeting.createdAt)}</td><td className="p-3">{formatDateTime(meeting.endedAt)}</td></tr>
                ))}
                {!history.length && <tr><td colSpan="4" className="p-6 text-center text-on-surface-variant">Chưa có lịch sử phòng học.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentHome;
