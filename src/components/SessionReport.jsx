import { useCallback, useEffect, useRef, useState } from 'react';
import {
  askTimelineChat,
  getApiErrorInfo,
  getEmotionTimeline,
  getRecordingPlayback,
} from '../api/reportApi';

const POLL_MS = 5000;

const EMOTION_STYLE = {
  happy: { label: 'Vui vẻ', color: '#F5C400' },
  neutral: { label: 'Bình thường', color: '#2457D6' },
  sad: { label: 'Buồn', color: '#5B6B8C' },
  angry: { label: 'Tức giận', color: '#D62828' },
  surprised: { label: 'Ngạc nhiên', color: '#F28C28' },
  fearful: { label: 'Sợ hãi', color: '#7B3FA0' },
  disgusted: { label: 'Ghê sợ', color: '#3E8E41' },
  no_face: { label: 'Không thấy mặt', color: '#B8B8B8' },
  unknown: { label: 'Không xác định', color: '#8A8A8A' },
};

const styleOf = (emotion) => EMOTION_STYLE[emotion] || { label: emotion, color: '#8A8A8A' };

const clock = (seconds) => {
  const total = Math.round(Number(seconds) || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const NOT_READY_TEXT = {
  QUEUED: 'Video đã tải lên, đang chờ AI nhận việc.',
  PROCESSING: 'AI đang phân tích video. Báo cáo sẽ hiện khi hoàn tất.',
  FAILED: 'Phân tích video thất bại. Hãy thử phân tích lại từ lịch sử buổi học.',
  NO_RECORDING: 'Buổi học này chưa có video ghi hình nên chưa có báo cáo.',
};

const Notice = ({ tone = 'info', children }) => (
  <div
    className={`p-4 border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] font-bold ${
      tone === 'error' ? 'bg-tertiary-container' : 'bg-bright-yellow'
    }`}
    role={tone === 'error' ? 'alert' : 'status'}
  >
    {children}
  </div>
);

const SummaryCards = ({ timeline }) => {
  const { summary } = timeline;
  const dominant = summary.dominant_emotion ? styleOf(summary.dominant_emotion).label : 'Chưa có dữ liệu';
  const cards = [
    ['Thời lượng video', clock(timeline.duration_seconds)],
    ['Đã phân tích hợp lệ', `${Math.round(summary.coverage * 100)}% (${clock(summary.analyzed_seconds)})`],
    ['Cảm xúc chủ đạo', dominant],
    ['Không thấy khuôn mặt', clock(summary.no_face_seconds + summary.unknown_seconds)],
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
      {cards.map(([title, value]) => (
        <div key={title} className="bg-surface-container-low border-[3px] border-pure-black p-space-md shadow-[4px_4px_0px_#000000]">
          <span className="text-label-sm font-bold uppercase text-on-surface-variant">{title}</span>
          <div className="mt-1 text-headline-sm font-headline font-bold text-on-surface break-words">{value}</div>
        </div>
      ))}
    </div>
  );
};

const Distribution = ({ summary }) => {
  const rows = Object.entries(summary.emotions);
  return (
    <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000]">
      <h3 className="text-headline-sm font-headline font-bold mb-1">Phân bổ cảm xúc</h3>
      <p className="text-body-sm text-on-surface-variant mb-space-md">
        Tính trên thời gian đã phân tích hợp lệ ({clock(summary.analyzed_seconds)}); đoạn không thấy mặt không được tính.
      </p>
      {rows.length === 0 && <p className="font-bold">Chưa có đoạn nào nhận diện được cảm xúc.</p>}
      <div className="space-y-space-sm">
        {rows.map(([emotion, share]) => (
          <div key={emotion}>
            <div className="flex justify-between text-label-md font-bold mb-1">
              <span>{styleOf(emotion).label}</span>
              <span>{share.percent}% · {clock(share.seconds)}</span>
            </div>
            <div className="w-full bg-surface-container-highest h-4 border-[2px] border-pure-black">
              <div className="h-full" style={{ width: `${share.percent}%`, background: styleOf(emotion).color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineBar = ({ timeline, onSeek }) => {
  const total = timeline.duration_seconds || 1;
  const used = [...new Set(timeline.segments.map((s) => s.emotion))];
  return (
    <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000]">
      <h3 className="text-headline-sm font-headline font-bold mb-1">Diễn biến cảm xúc theo thời gian</h3>
      <p className="text-body-sm text-on-surface-variant mb-space-md">
        Bấm vào một đoạn để tua video tới đúng thời điểm.
      </p>
      <div className="flex w-full h-12 border-[3px] border-pure-black overflow-hidden bg-surface" data-testid="timeline-bar">
        {timeline.segments.map((segment) => {
          const info = styleOf(segment.emotion);
          const length = segment.end_seconds - segment.start_seconds;
          const confidence = segment.avg_confidence == null ? '' : ` · ${Math.round(segment.avg_confidence * 100)}%`;
          return (
            <button
              key={`${segment.start_seconds}-${segment.emotion}`}
              type="button"
              onClick={() => onSeek(segment.start_seconds)}
              title={`${clock(segment.start_seconds)}–${clock(segment.end_seconds)} · ${info.label}${confidence}`}
              aria-label={`${info.label} từ ${clock(segment.start_seconds)} đến ${clock(segment.end_seconds)}`}
              className="h-full border-r border-pure-black/40 cursor-pointer hover:brightness-110"
              style={{ width: `${(length / total) * 100}%`, background: info.color }}
            />
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-label-sm font-bold mt-1">
        <span>00:00</span>
        <span>{clock(total)}</span>
      </div>
      <div className="flex flex-wrap gap-3 mt-space-sm text-label-sm font-bold">
        {used.map((emotion) => (
          <span key={emotion} className="flex items-center gap-1">
            <span className="w-3 h-3 inline-block border border-pure-black" style={{ background: styleOf(emotion).color }} />
            {styleOf(emotion).label}
          </span>
        ))}
      </div>
      <p className="mt-space-sm text-label-sm text-on-surface-variant">
        Cảm xúc là kết quả mô hình ước tính từ biểu cảm khuôn mặt (mô hình {timeline.model_version || 'chưa rõ'}),
        không phải chẩn đoán tâm lý.
      </p>
    </div>
  );
};

const VideoPlayer = ({ recordingId, videoRef }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (keepTime) => {
    try {
      const data = await getRecordingPlayback(recordingId);
      const resumeAt = keepTime && videoRef.current ? videoRef.current.currentTime : 0;
      setUrl(data.url);
      setError('');
      if (resumeAt) {
        // The signed URL expires after 5 minutes; resume where the viewer was.
        window.setTimeout(() => {
          if (videoRef.current) videoRef.current.currentTime = resumeAt;
        }, 300);
      }
    } catch (err) {
      setError(getApiErrorInfo(err).message || 'Không thể tải video.');
    }
  }, [recordingId, videoRef]);

  useEffect(() => {
    void load(false);
  }, [load]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!url) return <Notice>Đang tải video...</Notice>;
  return (
    <video
      ref={videoRef}
      src={url}
      controls
      preload="metadata"
      onError={() => void load(true)}
      className="w-full border-[3px] border-pure-black bg-pure-black shadow-[4px_4px_0px_#000000]"
    />
  );
};

const SUGGESTIONS = [
  'Từ 00:00 đến 01:00 học sinh có cảm xúc gì?',
  'Cảm xúc buồn xuất hiện trong khoảng nào?',
];

const ChatPanel = ({ meetingId, recordingId, onSeek }) => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [messages, sending]);

  const ask = async (text) => {
    const value = text.trim();
    if (!value || sending) return;
    setMessages((items) => [...items, { role: 'user', text: value }]);
    setQuestion('');
    setSending(true);
    try {
      const data = await askTimelineChat(meetingId, value, recordingId);
      setMessages((items) => [...items, {
        role: 'bot', text: data.answer, references: data.references || [], intent: data.intent,
      }]);
    } catch (error) {
      const info = getApiErrorInfo(error);
      const text422 = info.status === 422 ? 'Câu hỏi không hợp lệ (1–500 ký tự).' : null;
      setMessages((items) => [...items, {
        role: 'bot', error: true, text: text422 || info.message || 'Không thể trả lời lúc này.',
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] flex flex-col gap-space-sm">
      <h3 className="text-headline-sm font-headline font-bold">Hỏi trợ lý về buổi học</h3>
      <p className="text-body-sm text-on-surface-variant">
        Trợ lý chỉ trả lời từ dữ liệu timeline đã phân tích; bấm vào mốc thời gian để tua video.
      </p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => void ask(text)}
            disabled={sending}
            className="px-2.5 py-1 bg-surface border-[2px] border-pure-black text-label-sm font-bold cursor-pointer hover:bg-bright-yellow disabled:opacity-50"
          >
            {text}
          </button>
        ))}
      </div>
      <div className="min-h-[160px] max-h-[360px] overflow-y-auto border-[2px] border-pure-black bg-surface-bright p-3 flex flex-col gap-3" aria-live="polite">
        {messages.length === 0 && <p className="text-body-sm text-on-surface-variant">Chưa có câu hỏi nào.</p>}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] p-2.5 border-[2px] border-pure-black text-body-sm ${
              message.role === 'user'
                ? 'self-end bg-bright-yellow'
                : message.error ? 'self-start bg-tertiary-container' : 'self-start bg-surface-container'
            }`}
          >
            <p>{message.text}</p>
            {message.references?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {message.references.map((ref) => (
                  <button
                    key={`${ref.start_seconds}-${ref.end_seconds}-${ref.emotion}`}
                    type="button"
                    onClick={() => onSeek(ref.start_seconds)}
                    className="px-2 py-0.5 border-[2px] border-pure-black bg-surface font-mono text-label-sm font-bold cursor-pointer hover:bg-bright-yellow"
                    title={`Tua video tới ${clock(ref.start_seconds)}`}
                  >
                    {clock(ref.start_seconds)}–{clock(ref.end_seconds)} · {styleOf(ref.emotion).label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <p className="text-body-sm font-bold animate-pulse">Đang trả lời...</p>}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => { event.preventDefault(); void ask(question); }}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          placeholder="Ví dụ: Khi nào học sinh buồn?"
          aria-label="Câu hỏi về buổi học"
          className="flex-1 px-3 py-2 bg-surface border-[2px] border-pure-black text-body-sm outline-none focus:bg-bright-yellow"
        />
        <button
          type="submit"
          disabled={sending || !question.trim()}
          className="px-4 py-2 bg-royal-blue text-white border-[2px] border-pure-black font-bold shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

/**
 * Report of an after_session meeting (README 1.2): only shown once the analysis is COMPLETED.
 * Uploading/processing/failed states show the status only, never partial numbers.
 */
const SessionReport = ({ meeting }) => {
  const [state, setState] = useState({ phase: 'loading' });
  const videoRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const timeline = await getEmotionTimeline(meeting.id);
      setState({ phase: 'ready', timeline });
    } catch (error) {
      const info = getApiErrorInfo(error);
      if (info.code === 'ANALYSIS_NOT_READY') {
        setState({ phase: 'pending', dataStatus: info.dataStatus });
      } else if (info.code === 'INVALID_MEETING_MODE') {
        setState({ phase: 'realtime' });
      } else if (info.status === 403) {
        setState({ phase: 'forbidden' });
      } else {
        setState({ phase: 'error', message: info.message || 'Không thể tải báo cáo.' });
      }
    }
  }, [meeting.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const waiting = state.phase === 'pending' && ['QUEUED', 'PROCESSING'].includes(state.dataStatus);
    if (!waiting) return undefined;
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [state, load]);

  const seek = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    void video.play().catch(() => undefined);
    video.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  if (state.phase === 'loading') return <Notice>Đang tải báo cáo...</Notice>;
  if (state.phase === 'realtime') {
    return <Notice>Buổi học Realtime không có Report, timeline hay chatbot (không lưu video).</Notice>;
  }
  if (state.phase === 'forbidden') return <Notice tone="error">Chỉ giáo viên chủ phòng được xem báo cáo.</Notice>;
  if (state.phase === 'error') return <Notice tone="error">{state.message}</Notice>;
  if (state.phase === 'pending') {
    const failed = state.dataStatus === 'FAILED';
    return (
      <Notice tone={failed ? 'error' : 'info'}>
        {NOT_READY_TEXT[state.dataStatus] || 'Báo cáo chưa sẵn sàng.'}
        {!failed && state.dataStatus !== 'NO_RECORDING' && (
          <span className="block mt-1 font-normal text-body-sm">Trang tự cập nhật mỗi vài giây.</span>
        )}
      </Notice>
    );
  }

  const { timeline } = state;
  return (
    <div className="flex flex-col gap-space-lg">
      <SummaryCards timeline={timeline} />
      <VideoPlayer recordingId={timeline.recording_id} videoRef={videoRef} />
      <TimelineBar timeline={timeline} onSeek={seek} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <Distribution summary={timeline.summary} />
        <ChatPanel meetingId={meeting.id} recordingId={timeline.recording_id} onSeek={seek} />
      </div>
    </div>
  );
};

export default SessionReport;
