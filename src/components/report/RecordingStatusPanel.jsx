const statusMeta = {
  completed: { label: 'Hoàn thành', color: 'bg-emerald-600', icon: 'check_circle' },
  processing: { label: 'Đang phân tích', color: 'bg-royal-blue', icon: 'progress_activity' },
  pending: { label: 'Đang chờ', color: 'bg-bright-yellow', icon: 'schedule' },
  uploaded: { label: 'Đã tải lên', color: 'bg-orange-400', icon: 'cloud_upload' },
  failed: { label: 'Thất bại', color: 'bg-vivid-red', icon: 'error' },
};

const reportStatusLabel = {
  completed: 'Đã hoàn thành',
  partial: 'Kết quả một phần',
  empty: 'Chưa có kết quả',
  available: 'Đã có dữ liệu',
};

const RecordingStatusPanel = ({ report }) => {
  const statuses = report?.recording_statuses || {};
  const rows = Object.entries(statusMeta).map(([key, meta]) => ({
    key,
    ...meta,
    count: Number(statuses[key] || 0),
  }));
  const total = rows.reduce((sum, item) => sum + item.count, 0);
  const completed = Number(statuses.completed || 0);
  const completion = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="h-full bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[5px_5px_0px_#000000]">
      <div className="border-b-[2px] border-pure-black pb-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-vivid-red">video_file</span>
          <h2 className="text-headline-sm font-headline font-bold">Trạng thái xử lý recording</h2>
        </div>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Tiến độ upload và phân tích các video học sinh trong meeting.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-space-lg">
        <div className="bg-surface-bright border-[2px] border-pure-black p-3">
          <span className="block text-[11px] font-bold uppercase text-on-surface-variant">Tổng recording</span>
          <strong className="block text-headline-lg font-headline mt-1">{total}</strong>
        </div>
        <div className="bg-surface-bright border-[2px] border-pure-black p-3">
          <span className="block text-[11px] font-bold uppercase text-on-surface-variant">Trạng thái report</span>
          <strong className="block text-label-lg font-headline mt-2">{reportStatusLabel[report?.status] || report?.status || 'Chưa có dữ liệu'}</strong>
        </div>
      </div>

      <div className="mt-space-lg">
        <div className="flex justify-between text-label-sm font-bold mb-1.5">
          <span>Tiến độ hoàn thành</span>
          <span>{completed}/{total || 0} · {completion}%</span>
        </div>
        <div className="h-5 border-[2px] border-pure-black bg-surface-container-highest p-0.5">
          <div className="h-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="space-y-2 mt-space-lg">
        {rows.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 border-[2px] border-pure-black bg-surface-bright px-3 py-2.5">
            <span className="flex items-center gap-2 font-bold text-body-sm">
              <span className={`h-4 w-4 border-[2px] border-pure-black ${item.color}`} />
              {item.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <strong className="font-mono">{item.count}</strong>
            </span>
          </div>
        ))}
      </div>

      {!total && (
        <div className="mt-space-lg border-[2px] border-pure-black bg-bright-yellow p-3 text-body-sm font-bold">
          Chưa có recording nào được backend ghi nhận cho meeting này.
        </div>
      )}
    </section>
  );
};

export default RecordingStatusPanel;
