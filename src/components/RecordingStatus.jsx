const labels = {
  uploaded: 'Đã tải lên',
  pending: 'Đang chờ AI',
  processing: 'AI đang phân tích',
  completed: 'Phân tích hoàn tất',
  failed: 'Phân tích thất bại',
};

const RecordingStatus = ({
  recordings = [],
  statuses = {},
  participants = [],
  busy,
  error,
  needsUpload,
  onAnalyze,
  onPlayback,
  onRetryUpload,
  onDownloadPending,
}) => {
  if (!recordings.length && !busy && !error && !needsUpload) return null;
  const participantNames = new Map(participants.map((participant) => [
    participant.id || participant.user_id,
    participant.fullName || participant.full_name || participant.name || '',
  ]));
  const completedCount = recordings.filter((recording) => (
    (statuses[recording.id]?.status || recording.status) === 'completed'
  )).length;

  return (
    <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-body-sm">Các bản ghi học sinh</span>
        <span className="px-2 py-0.5 border border-pure-black bg-bright-yellow text-label-sm font-bold">
          {busy
            ? 'Đang tải lên...'
            : needsUpload
              ? 'Còn bản ghi chưa tải'
              : `${completedCount}/${recordings.length} hoàn tất`}
        </span>
      </div>
      {error && <div className="text-label-sm font-bold text-vivid-red">{error}</div>}
      {needsUpload && (
        <div className="space-y-2">
          <p className="text-label-sm text-on-surface-variant">
            Các bản ghi chưa tải lên vẫn được giữ tạm trong tab này để thử lại hoặc tải về máy.
          </p>
          <div className="flex gap-2 pt-1">
            <button type="button" disabled={busy} onClick={onRetryUpload} className="flex-1 px-2 py-1.5 border-[2px] border-pure-black bg-role-accent text-role-contrast font-bold text-label-sm disabled:opacity-50">Tải lên lại</button>
            <button type="button" disabled={busy} onClick={onDownloadPending} className="flex-1 px-2 py-1.5 border-[2px] border-pure-black bg-surface-container font-bold text-label-sm disabled:opacity-50">Tải về máy</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {recordings.map((recording, index) => {
          const status = statuses[recording.id] || {};
          const currentStatus = status.status || recording.status;
          const processing = ['pending', 'processing'].includes(currentStatus);
          const resolvedName = participantNames.get(recording.student_id);
          const studentName = resolvedName === 'Người tham gia' ? '' : resolvedName;
          const studentLabel = studentName || recording.student_id || `Học sinh ${index + 1}`;

          return (
            <div key={recording.id} className="border-[2px] border-pure-black bg-surface-container-low p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold text-body-sm" title={studentLabel}>{studentLabel}</div>
                  <div className="text-label-sm text-on-surface-variant">
                    {Number(recording.duration || 0).toFixed(1)} giây • {(Number(recording.size_bytes || 0) / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 border border-pure-black text-[11px] font-bold ${processing ? 'bg-orange-400 animate-pulse' : currentStatus === 'completed' ? 'bg-emerald-500 text-white' : currentStatus === 'failed' ? 'bg-vivid-red text-white' : 'bg-bright-yellow'}`}>
                  {labels[currentStatus] || 'Chưa có trạng thái'}
                </span>
              </div>
              {status.error_message && <div className="text-label-sm font-bold text-vivid-red">Không thể phân tích bản ghi này. Vui lòng thử lại.</div>}
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => onPlayback(recording.id)} className="flex-1 px-2 py-1.5 border-[2px] border-pure-black bg-surface-container font-bold text-label-sm disabled:opacity-50">Xem bản ghi</button>
                {['uploaded', 'failed'].includes(currentStatus) && (
                  <button type="button" disabled={busy} onClick={() => onAnalyze(recording.id)} className="flex-1 px-2 py-1.5 border-[2px] border-pure-black bg-role-accent text-role-contrast font-bold text-label-sm disabled:opacity-50">{currentStatus === 'failed' ? 'Phân tích lại' : 'Phân tích AI'}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecordingStatus;
