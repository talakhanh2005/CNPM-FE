const captureLabels = {
  idle: 'Camera chưa gửi frame',
  starting: 'Đang chuẩn bị camera',
  sending: 'Đang gửi frame',
  active: 'Đang gửi 1 frame/giây',
  error: 'Gửi frame gặp lỗi',
};

const formatTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const EmotionPanel = ({
  isTeacher,
  samples = [],
  latestSample,
  loading,
  error,
  captureStatus,
  onRefresh,
}) => {
  const recent = [...samples].reverse().slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="bg-primary-container border-[3px] border-pure-black p-4 shadow-[4px_4px_0px_#000000]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-label-sm font-bold uppercase block">Cảm xúc mới nhất</span>
            <span className="mt-1 block font-headline font-bold text-headline-sm">
              {latestSample?.emotion || 'Chưa có dữ liệu'}
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-mono">
          <span>{latestSample ? formatTime(latestSample.received_at || latestSample.timestamp) : 'Chưa nhận dữ liệu'}</span>
          {latestSample?.confidence != null && (
            <span className="font-bold">{Math.round(latestSample.confidence * 100)}%</span>
          )}
        </div>
      </div>

      <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] text-body-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold uppercase text-on-surface-variant">
            {isTeacher ? 'Đồng bộ emotion log' : 'Truyền frame'}
          </span>
          {isTeacher ? (
            <button
              type="button"
              onClick={() => onRefresh?.()}
              disabled={loading}
              className="border-[2px] border-pure-black bg-bright-yellow px-2 py-1 text-xs font-bold shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              {loading ? 'Đang tải...' : 'Tải lại'}
            </button>
          ) : (
            <span className="font-bold text-royal-blue">{captureLabels[captureStatus] || captureLabels.idle}</span>
          )}
        </div>
        {error && <p className="mt-2 font-bold text-tertiary">{error}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-bold uppercase text-on-surface-variant">
            Nhật ký gần đây
          </span>
          <span className="font-mono text-xs">{samples.length} mẫu</span>
        </div>
        {recent.length === 0 ? (
          <div className="border-[2px] border-dashed border-pure-black bg-surface-container-low p-4 text-center text-body-sm text-on-surface-variant">
            Chưa có emotion log. Học sinh cần bật camera trong phòng realtime.
          </div>
        ) : recent.map((sample) => (
            <div
              key={sample.sample_id || sample.id}
              className="flex items-center justify-between gap-3 border-[2px] border-pure-black bg-surface p-2.5 shadow-[2px_2px_0px_#000000]"
            >
              <div className="min-w-0">
                <span className="inline-flex border border-pure-black bg-surface-container px-2 py-0.5 text-xs font-bold">
                  {sample.emotion}
                </span>
                <div className="mt-1 truncate font-mono text-[11px] text-on-surface-variant">
                  {formatTime(sample.received_at || sample.timestamp)}
                  {isTeacher && sample.student_id ? ` · HS ${sample.student_id.slice(0, 8)}` : ''}
                </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionPanel;
