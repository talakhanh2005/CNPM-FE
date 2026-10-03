import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getMeetingHistory, getRoom } from '../api/meetingApi';
import { getMeetingReport } from '../api/reportApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { dominantEmotion, emotionKeys, getEmotionMeta, percentOf } from '../utils/emotions';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '--/--/----';

const formatDuration = (start, end) => {
  if (!start) return '--';
  const seconds = Math.max(0, (new Date(end || Date.now()) - new Date(start)) / 1000);
  return `${Math.round(seconds / 60)} phút`;
};

const formatTimelineTime = (value) => {
  if (typeof value === 'number') {
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  }
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const selectTimelinePoints = (timeline = [], maxPoints = 12) => {
  if (timeline.length <= maxPoints) return timeline;
  const step = (timeline.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => timeline[Math.round(index * step)]);
};

const EmotionReport = () => {
  const location = useLocation();
  const navigationMeeting = location.state?.meeting;
  const requestedMeetingId = new URLSearchParams(location.search).get('meetingId') || '';
  const [meetings, setMeetings] = useState(() => navigationMeeting ? [navigationMeeting] : []);
  const [selectedId, setSelectedId] = useState(navigationMeeting?.id || requestedMeetingId);
  const [meeting, setMeeting] = useState(navigationMeeting || null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    getMeetingHistory({ offset: 0, limit: 100 })
      .then((data) => {
        if (!active) return;
        const items = data?.items || [];
        setMeetings(items);
        setSelectedId((current) => current || items.find((item) => item.status === 'closed')?.id || items[0]?.id || '');
      })
      .catch((historyError) => { if (active) setError(getApiErrorMessage(historyError, 'Không thể tải danh sách phòng.')); })
      .finally(() => { if (active && !navigationMeeting) setLoading(false); });
    return () => { active = false; };
  }, [navigationMeeting]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    Promise.all([
      getRoom(selectedId),
      getMeetingReport(selectedId, { source: 'auto', offset: 0, limit: 2000 }),
    ])
      .then(([nextMeeting, nextReport]) => {
        if (!active) return;
        setMeeting(nextMeeting);
        setReport(nextReport);
        setError('');
      })
      .catch((loadError) => { if (active) setError(getApiErrorMessage(loadError, 'Không thể tải báo cáo meeting.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshTick, selectedId]);

  useEffect(() => {
    const statuses = report?.recording_statuses || {};
    const processing = Number(statuses.pending || 0) > 0 || Number(statuses.processing || 0) > 0;
    if (!processing) return undefined;
    const timer = window.setTimeout(() => setRefreshTick((current) => current + 1), 2500);
    return () => window.clearTimeout(timer);
  }, [report?.recording_statuses]);

  const timeline = useMemo(() => report?.timeline || [], [report?.timeline]);
  const chartPoints = useMemo(() => selectTimelinePoints(timeline), [timeline]);
  const dominant = dominantEmotion(report?.distribution);
  const dominantMeta = getEmotionMeta(dominant?.[0]);
  const participants = useMemo(() => meeting?.participants || [], [meeting?.participants]);

  const studentRows = useMemo(() => {
    const ids = new Set([
      ...(meeting?.studentId ? [meeting.studentId] : []),
      ...timeline.map((point) => point.student_id).filter(Boolean),
    ]);
    return [...ids].map((studentId) => {
      const points = timeline.filter((point) => (point.student_id || meeting?.studentId) === studentId);
      const counts = points.reduce((result, point) => ({ ...result, [point.emotion]: (result[point.emotion] || 0) + 1 }), {});
      const total = points.length;
      const distribution = Object.fromEntries(emotionKeys.map((key) => [key, total ? (counts[key] || 0) * 100 / total : 0]));
      return {
        studentId,
        distribution,
        primary: dominantEmotion(distribution),
        attendance: participants.find((participant) => participant.id === studentId),
        sampleCount: total,
      };
    });
  }, [meeting, participants, timeline]);

  const filteredStudents = studentRows.filter((row) => row.studentId.toLowerCase().includes(search.toLowerCase()));

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

  return (
    <DashboardLayout activeTab="bao-cao-cam-xuc">
      <div className="flex flex-col w-full max-w-7xl mx-auto p-gutter md:p-margin pb-24 font-body">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl border-b-[3px] border-pure-black pb-space-lg">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs flex-wrap">
              <span className="px-2.5 py-0.5 bg-primary text-on-primary text-label-sm font-bold uppercase border border-pure-black">Báo cáo sau buổi học</span>
              <span className={`px-2.5 py-0.5 ${meeting?.analysisMode === 'batch' ? 'bg-royal-blue text-white' : 'bg-bright-yellow text-pure-black'} text-label-sm font-bold border border-pure-black flex items-center gap-1 shadow-[1px_1px_0px_#000000]`}>
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                {meeting?.analysisMode === 'batch' ? 'AI đánh giá sau (Video Recording)' : 'Phân tích Realtime'}
              </span>
              <span className="text-body-sm text-on-surface-variant font-mono font-bold">Ngày {formatDate(meeting?.createdAt)}</span>
            </div>
            <h1 className="text-headline-lg font-headline font-bold text-on-surface tracking-tight">{meeting?.name || 'Báo cáo cảm xúc'}</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Thời lượng: <strong className="text-on-surface">{formatDuration(meeting?.createdAt, meeting?.endedAt)}</strong> | Phòng học: <strong className="font-mono">#{meeting?.code || '--'}</strong></p>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <select value={selectedId} onChange={(event) => { setLoading(true); setError(''); setSelectedId(event.target.value); }} className="max-w-56 px-3 py-2 bg-surface border-[3px] border-pure-black font-mono font-bold shadow-[3px_3px_0px_#000000]">
              {!meetings.length && <option value="">Chưa có meeting</option>}
              {meetings.map((item) => <option key={item.id} value={item.id}>#{item.code} • {formatDate(item.createdAt)}</option>)}
            </select>
            <button type="button" onClick={handleShare} className="px-space-md py-space-sm bg-surface-container border-[3px] border-pure-black font-bold shadow-[4px_4px_0px_#000000] flex items-center gap-space-xs"><span className="material-symbols-outlined text-[20px]">share</span>Chia sẻ</button>
            <button type="button" disabled={!report} onClick={handleExport} className="px-space-md py-space-sm bg-bright-yellow border-[3px] border-pure-black font-bold shadow-[4px_4px_0px_#000000] flex items-center gap-space-xs disabled:opacity-50"><span className="material-symbols-outlined text-[20px]">download</span>Xuất CSV</button>
          </div>
        </div>

        {loading && <div className="border-[3px] border-pure-black bg-off-white p-12 text-center font-bold shadow-[5px_5px_0px_#000000]">Đang tải báo cáo từ backend...</div>}
        {error && <div className="border-[3px] border-pure-black bg-tertiary-container p-6 font-bold shadow-[5px_5px_0px_#000000]">{error}</div>}
        {!loading && !error && !report && <div className="border-[3px] border-pure-black bg-off-white p-12 text-center">Chưa có meeting để xem báo cáo.</div>}

        {!loading && !error && report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
              <MetricCard label="Tổng số học sinh" value={studentRows.length} detail="Theo participant và student_id trong báo cáo." />
              <MetricCard label="Số mẫu AI hợp lệ" value={report.sample_count || 0} detail={`Nguồn: ${report.source || 'none'} • ${report.status || 'empty'}`} />
              <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] relative overflow-hidden">
                <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Cảm xúc chủ đạo</span>
                <div className="flex items-center gap-2 mt-space-xs"><span className={`w-5 h-5 border-[2px] border-pure-black ${dominantMeta.color}`} /><span className="text-headline-md font-headline font-bold">{dominantMeta.label}</span></div>
                <p className="text-body-sm text-on-surface-variant mt-space-sm">{dominant ? `${Number(dominant[1]).toFixed(1)}% tổng số mẫu` : 'Chưa có dữ liệu phân tích'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg mb-space-xl">
              <div className="lg:col-span-2 bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
                <div>
                  <h2 className="text-headline-sm font-headline font-bold">Biểu đồ diễn biến cảm xúc theo thời gian</h2>
                  <p className="text-body-sm text-on-surface-variant">Các điểm đại diện lấy từ timeline backend.</p>
                  <div className="w-full h-64 bg-surface-bright border-[2px] border-pure-black p-4 flex items-end gap-2 mt-space-md overflow-x-auto">
                    {chartPoints.length ? chartPoints.map((point, index) => {
                      const meta = getEmotionMeta(point.emotion);
                      return (
                        <div key={point.sample_id || `${point.timestamp}-${index}`} className="min-w-10 flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${meta.label}: ${percentOf(point.confidence).toFixed(1)}%`}>
                          <div className={`w-full border-[2px] border-pure-black ${meta.color}`} style={{ height: `${Math.max(5, percentOf(point.confidence))}%` }} />
                          <span className="text-[10px] font-mono font-bold whitespace-nowrap">{formatTimelineTime(point.timestamp)}</span>
                        </div>
                      );
                    }) : <div className="m-auto text-body-sm text-on-surface-variant">Chưa có điểm timeline.</div>}
                  </div>
                </div>
                <div className="bg-primary-container p-3 border-[2px] border-pure-black text-body-sm flex items-center gap-space-sm mt-space-md"><span className="material-symbols-outlined text-[24px]">lightbulb</span><span><strong>Nhận xét AI:</strong> {report.summary || 'Chưa có nhận xét.'}</span></div>
              </div>

              <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000]">
                <h2 className="text-headline-sm font-headline font-bold mb-space-xs">Phân bổ cảm xúc tổng thể</h2>
                <p className="text-body-sm text-on-surface-variant mb-space-lg">Tỉ lệ trên toàn bộ mẫu hợp lệ.</p>
                <div className="space-y-space-md">
                  {emotionKeys.map((key) => {
                    const meta = getEmotionMeta(key);
                    const value = Number(report.distribution?.[key] || 0);
                    return <div key={key}><div className="flex justify-between text-label-md font-bold mb-1"><span>{meta.label}</span><span>{value.toFixed(1)}%</span></div><div className="w-full bg-surface-container-highest h-4 border-[2px] border-pure-black p-0.5"><div className={`${meta.color} h-full`} style={{ width: `${value}%` }} /></div></div>;
                  })}
                </div>
              </div>
            </div>

            <StudentReportTable rows={filteredStudents} total={studentRows.length} search={search} onSearch={setSearch} meeting={meeting} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const MetricCard = ({ label, value, detail }) => (
  <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] relative overflow-hidden">
    <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
    <div className="text-headline-xl font-headline font-bold mt-space-xs">{value}</div>
    <p className="text-body-sm text-on-surface-variant mt-space-sm">{detail}</p>
  </div>
);

const StudentReportTable = ({ rows, total, search, onSearch, meeting }) => (
  <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000]">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
      <div><h2 className="text-headline-sm font-headline font-bold">Bảng chi tiết học sinh</h2><p className="text-body-sm text-on-surface-variant">Thống kê theo student_id backend trả về ({total} học sinh)</p></div>
      <input value={search} onChange={(event) => onSearch(event.target.value)} className="px-space-md py-2 bg-surface border-[2px] border-pure-black text-body-sm outline-none focus:bg-bright-yellow shadow-[2px_2px_0px_#000000]" placeholder="Tìm theo student ID..." />
    </div>
    <div className="overflow-x-auto border-[2px] border-pure-black">
      <table className="w-full text-left border-collapse bg-surface-bright">
        <thead><tr className="bg-surface-container border-b-[2px] border-pure-black text-label-md font-bold"><th className="p-space-md border-r border-pure-black">Học sinh</th><th className="p-space-md border-r border-pure-black">Thời gian có mặt</th><th className="p-space-md border-r border-pure-black">Phân bố cảm xúc</th><th className="p-space-md">Kết quả AI</th></tr></thead>
        <tbody className="divide-y divide-pure-black text-body-sm">
          {rows.map((row) => {
            const primaryMeta = getEmotionMeta(row.primary?.[0]);
            return <tr key={row.studentId}><td className="p-space-md border-r border-pure-black font-mono font-bold">{row.studentId}</td><td className="p-space-md border-r border-pure-black font-bold">{row.attendance ? formatDuration(row.attendance.joinedAt, row.attendance.leftAt || meeting?.endedAt) : '--'}</td><td className="p-space-md border-r border-pure-black min-w-[240px]"><div className="w-full bg-surface-container h-4 border border-pure-black flex overflow-hidden">{emotionKeys.map((key) => <div key={key} className={`${getEmotionMeta(key).color} h-full`} style={{ width: `${row.distribution[key]}%` }} title={`${getEmotionMeta(key).label}: ${row.distribution[key].toFixed(1)}%`} />)}</div></td><td className="p-space-md"><strong>{primaryMeta.label}</strong><div className="text-label-sm text-on-surface-variant">{row.sampleCount} mẫu</div></td></tr>;
          })}
          {!rows.length && <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">Chưa có dữ liệu học sinh trong báo cáo.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

export default EmotionReport;
