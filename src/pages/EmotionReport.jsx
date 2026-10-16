import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmotionDistributionChart from '../components/report/EmotionDistributionChart';
import RecordingStatusPanel from '../components/report/RecordingStatusPanel';
import StudentEmotionTimeline from '../components/report/StudentEmotionTimeline';
import ReportChatBox from '../components/ReportChatBox';
import { getMeetingHistory, getRoom } from '../api/meetingApi';
import { getMeetingReport } from '../api/reportApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { emotionKeys } from '../utils/emotions';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '--/--/----';

const formatDuration = (start, end) => {
  if (!start) return '--';
  const seconds = Math.max(0, (new Date(end || Date.now()) - new Date(start)) / 1000);
  return `${Math.round(seconds / 60)} phút`;
};

const EmotionReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationMeeting = location.state?.meeting;
  const initialMeeting = navigationMeeting?.analysisMode === 'after_session' ? navigationMeeting : null;
  const requestedMeetingId = new URLSearchParams(location.search).get('meetingId') || '';
  const [meetings, setMeetings] = useState(() => initialMeeting ? [initialMeeting] : []);
  const [selectedId, setSelectedId] = useState(initialMeeting?.id || requestedMeetingId);
  const [meeting, setMeeting] = useState(initialMeeting);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMeetingHistory({ mode: 'after_session', offset: 0, limit: 100 })
      .then((data) => {
        if (!active) return;
        const items = data?.items || [];
        setMeetings(items);
        setSelectedId((current) => current || items.find((item) => item.status === 'closed')?.id || items[0]?.id || '');
      })
      .catch((historyError) => { if (active) setError(getApiErrorMessage(historyError, 'Không thể tải danh sách phòng.')); })
      .finally(() => { if (active && !initialMeeting) setLoading(false); });
    return () => { active = false; };
  }, [initialMeeting]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    const loadReport = async () => {
      try {
        const nextMeeting = await getRoom(selectedId);
        if (nextMeeting.analysisMode !== 'after_session') {
          throw new Error('Meeting realtime không có báo cáo sau buổi học.');
        }
        const nextReport = await getMeetingReport(selectedId, {
          source: 'batch',
          offset: 0,
          limit: 2000,
        }, {
          studentIds: nextMeeting.studentIds,
        });
        if (!active) return;
        setMeeting(nextMeeting);
        setReport(nextReport);
        setError('');
      } catch (loadError) {
        if (!active) return;
        setMeeting(null);
        setReport(null);
        setError(getApiErrorMessage(loadError, 'Không thể tải báo cáo meeting.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadReport();
    return () => { active = false; };
  }, [refreshTick, selectedId]);

  useEffect(() => {
    const statuses = report?.recording_statuses || {};
    const processing = Number(statuses.pending || 0) > 0 || Number(statuses.processing || 0) > 0;
    if (!processing) return undefined;
    const timer = window.setTimeout(() => setRefreshTick((current) => current + 1), 2500);
    return () => window.clearTimeout(timer);
  }, [report?.recording_statuses]);

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('meetingId', selectedId);
      await navigator.clipboard.writeText(url.toString());
      window.alert('Đã sao chép liên kết báo cáo.');
    } catch {
      window.alert('Không thể sao chép liên kết trên trình duyệt này.');
    }
  };

  const handleExport = () => {
    if (!report) return;
    const rows = [
      ['emotion', 'percentage', 'sample_count'],
      ...emotionKeys.map((key) => [key, report.distribution?.[key] || 0, report.sample_counts?.[key] || 0]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bao-cao-${meeting?.code || selectedId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectMeeting = (event) => {
    setLoading(true);
    setError('');
    setChatOpen(false);
    setSelectedId(event.target.value);
  };

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface pb-24">
      <header className="sticky top-0 z-30 border-b-[3px] border-pure-black bg-off-white shadow-[0_4px_0px_#000000]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-gutter py-3 lg:flex-row lg:items-center lg:justify-between lg:px-margin">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/teacher')}
              className="shrink-0 h-11 w-11 border-[3px] border-pure-black bg-surface-container shadow-[3px_3px_0px_#000000] flex items-center justify-center hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000] transition-all"
              aria-label="Quay lại trang giáo viên"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-royal-blue text-white text-[11px] font-bold uppercase border border-pure-black">Báo cáo sau buổi học</span>
                <span className="font-mono text-[11px] font-bold text-on-surface-variant">#{meeting?.code || '--'}</span>
              </div>
              <h1 className="font-headline text-headline-md font-bold truncate">{meeting?.name || 'Báo cáo cảm xúc'}</h1>
              <p className="text-label-sm text-on-surface-variant">
                {formatDate(meeting?.createdAt)} · {formatDuration(meeting?.createdAt, meeting?.endedAt)} · {report?.sample_count || 0} mẫu AI hợp lệ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedId} onChange={selectMeeting} className="max-w-60 px-3 py-2 bg-surface border-[3px] border-pure-black font-mono font-bold shadow-[3px_3px_0px_#000000]">
              {!meetings.length && <option value="">Chưa có meeting</option>}
              {meetings.map((item) => <option key={item.id} value={item.id}>#{item.code} · {formatDate(item.createdAt)}</option>)}
            </select>
            <button type="button" onClick={() => { setLoading(true); setRefreshTick((current) => current + 1); }} className="h-11 px-3 bg-surface-container border-[3px] border-pure-black font-bold shadow-[3px_3px_0px_#000000] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[19px]">refresh</span>
              Làm mới
            </button>
            <button type="button" onClick={handleShare} className="h-11 px-3 bg-surface-container border-[3px] border-pure-black font-bold shadow-[3px_3px_0px_#000000] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[19px]">share</span>
              Chia sẻ
            </button>
            <button type="button" disabled={!report} onClick={handleExport} className="h-11 px-3 bg-bright-yellow border-[3px] border-pure-black font-bold shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 disabled:opacity-50">
              <span className="material-symbols-outlined text-[19px]">download</span>
              Xuất CSV
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-gutter py-space-xl lg:px-margin">
        {loading && <div className="border-[3px] border-pure-black bg-off-white p-12 text-center font-bold shadow-[5px_5px_0px_#000000]">Đang tải báo cáo từ backend...</div>}
        {error && <div className="border-[3px] border-pure-black bg-tertiary-container p-6 font-bold shadow-[5px_5px_0px_#000000]">{error}</div>}
        {!loading && !error && !report && <div className="border-[3px] border-pure-black bg-off-white p-12 text-center">Chưa có meeting để xem báo cáo.</div>}

        {!loading && !error && report && (
          <div className="space-y-space-xl">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] gap-space-xl items-stretch">
              <EmotionDistributionChart report={report} />
              <RecordingStatusPanel report={report} />
            </div>
            <StudentEmotionTimeline meeting={meeting} report={report} />
          </div>
        )}
      </div>

      <ReportChatBox
        meetingId={selectedId}
        isOpen={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
      />
    </main>
  );
};

export default EmotionReport;
