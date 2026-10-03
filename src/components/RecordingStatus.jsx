const labels = {
  uploaded: 'Đã tải lên',
  pending: 'Đang chờ AI',
  processing: 'AI đang phân tích',
  completed: 'Phân tích hoàn tất',
  failed: 'Phân tích thất bại',
};

const RecordingStatus = ({ recording, status, busy, error, onAnalyze, onPlayback }) => {
  if (!recording && !busy && !error) return null;
  const currentStatus = status?.status || recording?.status;
  const processing = ['pending', 'processing'].includes(currentStatus);

  return (
    <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-body-sm">Bản ghi gần nhất</span>
        <span className={`px-2 py-0.5 border border-pure-black text-label-sm font-bold ${processing ? 'bg-orange-400 animate-pulse' : currentStatus === 'completed' ? 'bg-emerald-500 text-white' : currentStatus === 'failed' ? 'bg-vivid-red text-white' : 'bg-bright-yellow'}`}>
          {busy ? 'Đang tải lên...' : labels[currentStatus] || 'Chưa có trạng thái'}
        </span>
      </div>
      {recording && <div className="text-label-sm text-on-surface-variant">{Number(recording.duration || 0).toFixed(1)} giây • {(Number(recording.size_bytes || 0) / (1024 * 1024)).toFixed(1)} MB</div>}
      {(error || status?.error_message) && <div className="text-label-sm font-bold text-vivid-red">{error || status.error_message}</div>}
      {recording && (
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onPlayback} className="flex-1 px-2 py-1.5 border-[2px] border-pure-black bg-surface-container font-bold text-label-sm">Xem bản ghi</button>
          {['uploaded', 'failed'].includes(currentStatus) && (
            <button type="button" onClick={onAnalyze} className="flex-1 px-2 py-1.5 border-[2px] border-pure-black bg-bright-yellow font-bold text-label-sm">{currentStatus === 'failed' ? 'Phân tích lại' : 'Phân tích AI'}</button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingStatus;
