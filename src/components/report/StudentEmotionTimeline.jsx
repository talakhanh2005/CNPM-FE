import { useMemo } from 'react';
import { emotionKeys, getEmotionMeta, percentOf } from '../../utils/emotions';

const MAX_POINTS_PER_STUDENT = 240;

const formatTimelineTime = (value) => {
  const seconds = Math.max(0, Number(value) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const samplePoints = (points) => {
  if (points.length <= MAX_POINTS_PER_STUDENT) return points;
  const step = (points.length - 1) / (MAX_POINTS_PER_STUDENT - 1);
  return Array.from(
    { length: MAX_POINTS_PER_STUDENT },
    (_, index) => points[Math.round(index * step)],
  );
};

const shortId = (value) => {
  if (!value) return 'Không xác định';
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
};

const StudentEmotionTimeline = ({ meeting, report }) => {
  const timeline = useMemo(() => report?.timeline || [], [report?.timeline]);
  const rows = useMemo(() => {
    const participantNames = new Map(
      (meeting?.participants || []).map((participant) => [
        participant.id || participant.user_id,
        participant.fullName || participant.full_name || participant.name || '',
      ]),
    );
    const ids = new Set([
      ...(meeting?.studentIds || []),
      ...(meeting?.studentId ? [meeting.studentId] : []),
      ...timeline.map((point) => point.student_id).filter(Boolean),
    ]);
    if (!ids.size && timeline.length) ids.add('legacy-unknown');

    return [...ids].sort().map((studentId) => {
      const points = timeline
        .filter((point) => (point.student_id || 'legacy-unknown') === studentId)
        .filter((point) => Number.isFinite(Number(point.timestamp)))
        .sort((left, right) => Number(left.timestamp) - Number(right.timestamp));
      return {
        studentId,
        studentName: participantNames.get(studentId) || '',
        points,
        visiblePoints: samplePoints(points),
      };
    });
  }, [meeting, timeline]);

  const maxTimestamp = Math.max(
    1,
    ...rows.flatMap((row) => row.points.map((point) => Number(point.timestamp) || 0)),
  );
  const chartWidth = Math.max(860, Math.min(2600, Math.ceil(maxTimestamp * 5)));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const timelineTotal = Number(report?.timeline_total || timeline.length);

  return (
    <section className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[5px_5px_0px_#000000]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md border-b-[2px] border-pure-black pb-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-royal-blue">timeline</span>
            <h2 className="text-headline-sm font-headline font-bold">Timeline theo từng học sinh</h2>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Mỗi điểm là một kết quả trong recording của học sinh; trục thời gian tính từ đầu từng recording.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          {emotionKeys.map((key) => {
            const meta = getEmotionMeta(key);
            return (
              <span key={key} className="flex items-center gap-1.5 bg-surface-bright border border-pure-black px-2 py-1">
                <span className={`h-2.5 w-2.5 border border-pure-black ${meta.color}`} />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-space-md flex flex-wrap items-center justify-between gap-2 text-label-sm">
        <span className="font-bold">{rows.length} học sinh · {timeline.length}/{timelineTotal} điểm timeline đang tải</span>
        <span className="text-on-surface-variant">Di chuột vào điểm để xem recording và độ tin cậy.</span>
      </div>

      {!rows.length ? (
        <div className="mt-space-lg min-h-48 border-[2px] border-pure-black bg-surface-bright flex items-center justify-center text-body-sm text-on-surface-variant">
          Chưa có timeline học sinh để hiển thị.
        </div>
      ) : (
        <div className="mt-space-lg border-[2px] border-pure-black bg-surface-bright overflow-x-auto">
          <div className="min-w-max">
            <div className="flex border-b-[2px] border-pure-black bg-surface-container">
              <div className="sticky left-0 z-20 w-52 shrink-0 border-r-[2px] border-pure-black bg-surface-container px-3 py-2 font-bold">Học sinh</div>
              <div className="relative h-10 shrink-0" style={{ width: chartWidth }}>
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-2 -translate-x-1/2 font-mono text-[11px] font-bold first:translate-x-0 last:-translate-x-full"
                    style={{ left: `${tick * 100}%` }}
                  >
                    {formatTimelineTime(maxTimestamp * tick)}
                  </span>
                ))}
              </div>
            </div>

            {rows.map((row, index) => (
              <div key={row.studentId} className="flex border-b border-pure-black last:border-b-0">
                <div className={`sticky left-0 z-20 w-52 shrink-0 border-r-[2px] border-pure-black px-3 py-3 ${index % 2 ? 'bg-surface-container-low' : 'bg-surface-bright'}`}>
                  <div className="font-bold">{row.studentName || `Học sinh ${index + 1}`}</div>
                  {!row.studentName && (
                    <div className="font-mono text-[11px] text-on-surface-variant" title={row.studentId}>{shortId(row.studentId)}</div>
                  )}
                  <div className="text-[11px] font-bold mt-1">{row.points.length} điểm</div>
                </div>
                <div className={`relative h-[74px] shrink-0 ${index % 2 ? 'bg-surface-container-low' : 'bg-surface-bright'}`} style={{ width: chartWidth }}>
                  {ticks.map((tick) => (
                    <span key={tick} className="absolute inset-y-0 border-l border-pure-black/20" style={{ left: `${tick * 100}%` }} />
                  ))}
                  <span className="absolute left-0 right-0 top-1/2 border-t border-dashed border-pure-black/40" />
                  {row.visiblePoints.map((point, pointIndex) => {
                    const meta = getEmotionMeta(point.emotion);
                    const position = Math.min(100, (Number(point.timestamp) / maxTimestamp) * 100);
                    const title = [
                      `Học sinh: ${row.studentName || row.studentId}`,
                      `Thời gian: ${formatTimelineTime(point.timestamp)}`,
                      `Cảm xúc: ${meta.label}`,
                      `Độ tin cậy: ${percentOf(point.confidence).toFixed(1)}%`,
                      `Recording: ${point.recording_id || 'Không xác định'}`,
                    ].join('\n');
                    return (
                      <span
                        key={point.sample_id || `${point.recording_id || 'recording'}-${point.timestamp}-${pointIndex}`}
                        title={title}
                        className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-[2px] border-pure-black ${meta.color} cursor-help hover:z-10 hover:scale-150 transition-transform`}
                        style={{ left: `${position}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.some((row) => row.points.length > row.visiblePoints.length) && (
        <p className="mt-2 text-[11px] text-on-surface-variant">
          Timeline dày được lấy mẫu tối đa {MAX_POINTS_PER_STUDENT} điểm mỗi học sinh để giữ hiệu năng hiển thị; số liệu phân bổ phía trên vẫn dùng toàn bộ sample_counts backend.
        </p>
      )}
    </section>
  );
};

export default StudentEmotionTimeline;
