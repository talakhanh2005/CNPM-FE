import { dominantEmotion, emotionKeys, getEmotionMeta } from '../../utils/emotions';

const EmotionDistributionChart = ({ report }) => {
  const dominant = Number(report?.sample_count || 0) > 0
    ? dominantEmotion(report?.distribution)
    : null;
  const dominantMeta = getEmotionMeta(dominant?.[0]);

  return (
    <section className="h-full bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[5px_5px_0px_#000000]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-md border-b-[2px] border-pure-black pb-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-royal-blue">bar_chart</span>
            <h2 className="text-headline-sm font-headline font-bold">Phân bổ cảm xúc toàn buổi</h2>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Tỉ lệ được tính trên toàn bộ mẫu AI hợp lệ của các recording đã hoàn thành.
          </p>
        </div>

        <div className="shrink-0 bg-surface-bright border-[2px] border-pure-black px-3 py-2 shadow-[2px_2px_0px_#000000]">
          <span className="block text-[11px] font-bold uppercase text-on-surface-variant">Cảm xúc chủ đạo</span>
          <span className="mt-1 flex items-center gap-2 font-headline font-bold">
            <span className={`h-4 w-4 border-[2px] border-pure-black ${dominantMeta.color}`} />
            {dominant ? `${dominantMeta.label} · ${Number(dominant[1]).toFixed(1)}%` : 'Chưa có dữ liệu'}
          </span>
        </div>
      </div>

      <div className="mt-space-lg overflow-x-auto" aria-label="Biểu đồ cột phân bổ cảm xúc toàn buổi">
        <div className="min-w-[760px]">
          <div className="flex">
            <div className="h-72 w-12 shrink-0 flex flex-col justify-between items-end pr-2 pb-px font-mono text-[10px] font-bold text-on-surface-variant">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className="relative h-72 flex-1 border-l-[2px] border-b-[2px] border-pure-black bg-surface-bright">
              {[0, 25, 50, 75, 100].map((value) => (
                <span
                  key={value}
                  className="absolute left-0 right-0 border-t border-pure-black/20"
                  style={{ bottom: `${value}%` }}
                />
              ))}
              <div className="absolute inset-0 grid grid-cols-7 gap-4 px-5">
                {emotionKeys.map((key) => {
                  const meta = getEmotionMeta(key);
                  const value = Number(report?.distribution?.[key] || 0);
                  const count = Number(report?.sample_counts?.[key] || 0);
                  return (
                    <div key={key} className="h-full flex items-end justify-center">
                      <div
                        className={`relative w-full max-w-16 border-x-[2px] border-t-[2px] border-pure-black ${meta.color} transition-[height] duration-300`}
                        style={{ height: `${Math.max(value, value > 0 ? 2 : 0)}%` }}
                        title={`${meta.label}: ${value.toFixed(1)}% · ${count} mẫu`}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-bold text-on-surface">
                          {value.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="ml-12 grid grid-cols-7 gap-4 px-5 pt-2">
            {emotionKeys.map((key) => {
              const meta = getEmotionMeta(key);
              const count = Number(report?.sample_counts?.[key] || 0);
              return (
                <div key={key} className="min-w-0 text-center">
                  <span className="block text-label-sm font-bold truncate" title={meta.label}>{meta.label}</span>
                  <span className="block font-mono text-[10px] text-on-surface-variant">{count} mẫu</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-space-lg bg-primary-container p-3 border-[2px] border-pure-black text-body-sm flex items-start gap-space-sm">
        <span className="material-symbols-outlined text-[24px] shrink-0">lightbulb</span>
        <span><strong>Nhận xét AI:</strong> {report?.summary || 'Chưa có nhận xét.'}</span>
      </div>
    </section>
  );
};

export default EmotionDistributionChart;
