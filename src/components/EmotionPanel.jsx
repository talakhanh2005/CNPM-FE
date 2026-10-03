import { useEffect, useMemo, useState } from 'react';
import { getEmotionLogs } from '../api/emotionApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { emotionKeys, getEmotionMeta, percentOf } from '../utils/emotions';

const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : '--:--:--';

const EmotionPanel = ({ meetingId, isTeacher, latestEmotion, monitoringStatus }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(Boolean(isTeacher));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isTeacher || !meetingId) return undefined;
    let active = true;

    const loadLogs = async () => {
      try {
        const data = await getEmotionLogs(meetingId, { offset: 0, limit: 100 });
        if (!active) return;
        setLogs(data?.items || []);
        setError('');
      } catch (loadError) {
        if (active) setError(getApiErrorMessage(loadError, 'Không thể tải nhật ký cảm xúc.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLogs();
    const timer = window.setInterval(loadLogs, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isTeacher, meetingId]);

  const mergedLogs = useMemo(() => {
    if (!latestEmotion?.sample_id) return logs;
    return [latestEmotion, ...logs.filter((item) => item.id !== latestEmotion.sample_id)].slice(0, 100);
  }, [latestEmotion, logs]);
  const current = latestEmotion || mergedLogs[0];
  const meta = getEmotionMeta(current?.emotion);

  return (
    <div className="space-y-4">
      <div className="bg-primary-container border-[3px] border-pure-black p-4 shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label-sm font-bold uppercase">Trạng thái AI hiện tại</span>
          <span className={`px-2 py-1 border-[2px] border-pure-black font-bold text-label-sm ${meta.color} ${meta.text}`}>
            {meta.label}
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-label-sm text-on-surface-variant">Độ tin cậy</div>
            <div className="font-headline font-bold text-headline-md">{current ? percentOf(current.confidence).toFixed(1) : '0.0'}%</div>
          </div>
          <span className="material-symbols-outlined text-[42px]">{meta.icon}</span>
        </div>
        <div className="w-full bg-surface-container border-[2px] border-pure-black h-3.5 mt-2 overflow-hidden">
          <div className={`${meta.color} h-full`} style={{ width: `${current ? percentOf(current.confidence) : 0}%` }} />
        </div>
      </div>

      {!isTeacher && (
        <div className="bg-surface border-[2px] border-pure-black p-3 text-body-sm shadow-[2px_2px_0px_#000000]">
          <div className="flex justify-between gap-3">
            <span className="font-bold">Gửi frame realtime</span>
            <span className="font-mono text-secondary font-bold">{monitoringStatus === 'active' || monitoringStatus === 'sending' ? 'Đang hoạt động' : 'Đang chờ camera'}</span>
          </div>
        </div>
      )}

      {current?.probabilities && (
        <div className="bg-surface border-[2px] border-pure-black p-3.5 shadow-[2px_2px_0px_#000000] space-y-2">
          <span className="text-label-sm font-bold uppercase text-on-surface-variant block">Xác suất 7 cảm xúc</span>
          {emotionKeys.map((emotion) => {
            const item = getEmotionMeta(emotion);
            const value = percentOf(current.probabilities[emotion]);
            return (
              <div key={emotion}>
                <div className="flex justify-between text-label-sm font-bold"><span>{item.label}</span><span>{value.toFixed(1)}%</span></div>
                <div className="h-2 border border-pure-black bg-surface-container overflow-hidden"><div className={`${item.color} h-full`} style={{ width: `${value}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}

      {isTeacher && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold uppercase">Nhật ký realtime</span>
            <span className="text-label-sm text-on-surface-variant">{mergedLogs.length} mục</span>
          </div>
          {loading && <div className="border-[2px] border-pure-black bg-surface p-3 text-body-sm">Đang tải nhật ký...</div>}
          {error && <div className="border-[2px] border-pure-black bg-tertiary-container p-3 text-body-sm font-bold">{error}</div>}
          {!loading && !error && !mergedLogs.length && <div className="border-[2px] border-pure-black bg-surface p-3 text-body-sm">Chưa có mẫu cảm xúc.</div>}
          {mergedLogs.slice(0, 20).map((log) => {
            const item = getEmotionMeta(log.emotion);
            return (
              <div key={log.id || log.sample_id || `${log.timestamp}-${log.emotion}`} className="border-[2px] border-pure-black bg-surface p-3 shadow-[2px_2px_0px_#000000]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-body-sm">{item.label}</span>
                  <span className="font-mono text-xs text-outline">{formatTime(log.received_at || log.timestamp)}</span>
                </div>
                <div className="text-label-sm text-on-surface-variant mt-1">Tin cậy {percentOf(log.confidence).toFixed(1)}%{log.face_detected === false ? ' • Không tìm thấy khuôn mặt' : ''}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmotionPanel;
