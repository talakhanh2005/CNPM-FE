import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getMeetingHistory } from '../api/meetingApi';
import { getMeetingReport } from '../api/reportApi';
import { getApiErrorMessage } from '../api/axiosClient';

const emotionLabels = {
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
  angry: 'Angry',
  surprised: 'Surprised',
  fearful: 'Fearful',
  disgusted: 'Disgusted',
  fail_detection: 'Không nhận diện được',
};

const emotionColors = {
  happy: 'bg-emerald-500',
  neutral: 'bg-royal-blue',
  sad: 'bg-blue-300',
  angry: 'bg-vivid-red',
  surprised: 'bg-bright-yellow',
  fearful: 'bg-purple-400',
  disgusted: 'bg-lime-600',
};

const formatTimestamp = (value, timeBasis) => {
  if (timeBasis === 'recording_seconds' || typeof value === 'number') {
    const total = Math.max(0, Number(value) || 0);
    const minutes = Math.floor(total / 60);
    const seconds = Math.floor(total % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
};

const EmotionReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMeeting = location.state?.meeting || null;
  const [meetings, setMeetings] = useState(initialMeeting ? [initialMeeting] : []);
  const [selectedMeetingId, setSelectedMeetingId] = useState(initialMeeting?.id || '');
  const [report, setReport] = useState(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMeetingHistory({ offset: 0, limit: 100 })
      .then((result) => {
        if (!active) return;
        const items = result?.items || [];
        setMeetings(items);
        setSelectedMeetingId((current) => current || items[0]?.id || '');
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách phòng học.'));
      })
      .finally(() => { if (active) setLoadingMeetings(false); });
    return () => { active = false; };
  }, []);

  const loadReport = useCallback(async () => {
    if (!selectedMeetingId) {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    try {
      const result = await getMeetingReport(selectedMeetingId, {
        source: 'auto',
        offset: 0,
        limit: 500,
      });
      setReport(result);
      setError('');
    } catch (requestError) {
      setReport(null);
      setError(getApiErrorMessage(requestError, 'Không thể tải báo cáo cảm xúc.'));
    } finally {
      setLoadingReport(false);
    }
  }, [selectedMeetingId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadReport(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId) || initialMeeting;
  const distribution = useMemo(
    () => Object.entries(report?.distribution || {}).sort((left, right) => right[1] - left[1]),
    [report?.distribution],
  );
  const dominantEmotion = distribution[0]?.[0] || null;

  return (
    <DashboardLayout activeTab="bao-cao" onTabChange={(tab) => navigate(tab === 'dashboard' ? '/teacher' : '/teacher', { state: { tab } })}>
      <div className="flex w-full flex-col gap-space-lg p-gutter pb-24 md:p-margin">
        <header className="flex flex-col justify-between gap-4 border-[3px] border-pure-black bg-off-white p-5 shadow-[6px_6px_0px_#000000] md:flex-row md:items-end">
          <div>
            <span className="text-label-sm font-bold uppercase text-on-surface-variant">Báo cáo từ backend</span>
            <h1 className="font-headline text-headline-lg font-bold">Phân tích cảm xúc</h1>
            <p className="text-body-sm text-on-surface-variant">Không sử dụng dữ liệu mẫu. Chọn một phòng để xem kết quả đã lưu.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedMeetingId}
              onChange={(event) => setSelectedMeetingId(event.target.value)}
              disabled={loadingMeetings}
              className="min-w-64 border-[3px] border-pure-black bg-surface px-3 py-2 font-bold"
            >
              {!meetings.length && <option value="">Chưa có phòng học</option>}
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>#{meeting.code} · {meeting.analysisMode === 'realtime' ? 'Realtime' : 'Sau buổi học'}</option>
              ))}
            </select>
            <button type="button" onClick={() => void loadReport()} disabled={!selectedMeetingId || loadingReport} className="border-[3px] border-pure-black bg-bright-yellow px-4 py-2 font-bold shadow-[3px_3px_0px_#000000] disabled:opacity-50">
              {loadingReport ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </header>

        {error && <div className="border-[3px] border-pure-black bg-tertiary-container p-4 font-bold text-on-tertiary-container">{error}</div>}

        {!selectedMeetingId ? (
          <div className="border-[3px] border-dashed border-pure-black bg-surface-container-low p-10 text-center">Chưa có phòng học để tạo báo cáo.</div>
        ) : loadingReport && !report ? (
          <div className="border-[3px] border-pure-black bg-surface p-10 text-center font-bold">Đang tải báo cáo...</div>
        ) : report ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Mã phòng', selectedMeeting?.code ? `#${selectedMeeting.code}` : '—'],
                ['Số mẫu', report.sample_count ?? 0],
                ['Cảm xúc chủ đạo', dominantEmotion ? emotionLabels[dominantEmotion] || dominantEmotion : 'Chưa có'],
                ['Nguồn', report.source === 'realtime' ? 'Realtime' : report.source === 'batch' ? 'Recording' : 'Chưa có'],
              ].map(([label, value]) => (
                <div key={label} className="border-[3px] border-pure-black bg-surface-container-lowest p-4 shadow-[4px_4px_0px_#000000]">
                  <span className="text-label-sm font-bold uppercase text-on-surface-variant">{label}</span>
                  <strong className="mt-1 block font-headline text-headline-md">{value}</strong>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="border-[3px] border-pure-black bg-surface p-5 shadow-[4px_4px_0px_#000000]">
                <h2 className="mb-4 font-headline text-headline-sm font-bold">Phân bố cảm xúc</h2>
                {distribution.length === 0 ? (
                  <p className="text-on-surface-variant">Backend chưa có mẫu cảm xúc cho phòng này.</p>
                ) : (
                  <div className="space-y-4">
                    {distribution.map(([emotion, percent]) => (
                      <div key={emotion}>
                        <div className="mb-1 flex justify-between font-bold"><span>{emotionLabels[emotion] || emotion}</span><span>{Number(percent).toFixed(1)}%</span></div>
                        <div className="h-5 overflow-hidden border-[2px] border-pure-black bg-surface-container">
                          <div className={`h-full ${emotionColors[emotion] || 'bg-outline'}`} style={{ width: `${Math.min(100, Math.max(0, Number(percent)))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-[3px] border-pure-black bg-primary-container p-5 shadow-[4px_4px_0px_#000000]">
                <h2 className="font-headline text-headline-sm font-bold">Trạng thái phân tích</h2>
                <dl className="mt-4 space-y-3 text-body-sm">
                  <div className="flex justify-between gap-4"><dt className="font-bold">Trạng thái</dt><dd>{report.status}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="font-bold">Tổng timeline</dt><dd>{report.timeline_total}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="font-bold">Cơ sở thời gian</dt><dd>{report.time_basis}</dd></div>
                </dl>
                <p className="mt-5 border-t-[2px] border-pure-black pt-4 text-body-sm">{report.summary}</p>
              </div>
            </section>

            <section className="border-[3px] border-pure-black bg-surface shadow-[4px_4px_0px_#000000]">
              <div className="border-b-[3px] border-pure-black bg-surface-container p-4"><h2 className="font-headline text-headline-sm font-bold">Timeline cảm xúc</h2></div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-off-white"><tr className="border-b-[2px] border-pure-black"><th className="p-3">Thời gian</th><th className="p-3">Cảm xúc</th><th className="p-3">Độ tin cậy</th><th className="p-3">Trạng thái khuôn mặt</th></tr></thead>
                  <tbody className="divide-y divide-pure-black">
                    {(report.timeline || []).map((point, index) => (
                      <tr key={point.sample_id || point.frame_id || `${point.timestamp}-${index}`}>
                        <td className="p-3 font-mono">{formatTimestamp(point.timestamp, report.time_basis)}</td>
                        <td className="p-3 font-bold">{emotionLabels[point.emotion] || point.emotion}</td>
                        <td className="p-3">{Math.round((point.confidence || 0) * 100)}%</td>
                        <td className="p-3">{point.face_detected ? 'Đã nhận diện' : point.failure_reason || 'Không nhận diện'}</td>
                      </tr>
                    ))}
                    {!report.timeline?.length && <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">Chưa có dữ liệu timeline.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default EmotionReport;
