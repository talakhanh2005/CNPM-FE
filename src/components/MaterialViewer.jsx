const isPdf = (material) => material?.content_type === 'application/pdf';
const isImage = (material) => material?.content_type?.startsWith('image/');

const pdfUrlAtPage = (url, page) => {
  if (!url) return '';
  try {
    const next = new URL(url, window.location.origin);
    next.hash = `page=${page}&view=FitH`;
    return next.toString();
  } catch {
    return `${url}#page=${page}&view=FitH`;
  }
};

const MaterialViewer = ({
  material,
  page = 1,
  isTeacher = false,
  loading = false,
  error = '',
  onClose,
}) => {
  if (!material && !loading && !error) return null;
  const url = material?.preview_url || material?.download_url || material?.url || '';
  const pdf = isPdf(material);
  const image = isImage(material);

  return (
    <section className="relative z-20 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-[3px] border-pure-black bg-surface-container-lowest shadow-[5px_5px_0px_#000000]" aria-label="Tài liệu đang trình chiếu">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-[3px] border-pure-black bg-off-white px-3 py-2 shadow-[0_3px_0px_#000000] sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-role-accent">present_to_all</span>
            <strong className="truncate font-headline text-body-md" title={material?.filename}>
              {material?.filename || 'Đang tải tài liệu...'}
            </strong>
          </div>
          <p className="text-xs text-on-surface-variant">
            {isTeacher ? 'Bạn đang trình chiếu cho cả lớp' : 'Giáo viên đang trình chiếu'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center gap-1 border-[2px] border-pure-black bg-vivid-red px-3 font-bold text-on-error shadow-[2px_2px_0px_#000000]"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
            <span className="hidden sm:inline">{isTeacher ? 'Dừng trình chiếu' : 'Ẩn'}</span>
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 bg-neutral-800 p-2 sm:p-4">
        {loading && (
          <div className="flex h-full items-center justify-center text-center font-bold text-white">
            Đang lấy liên kết tài liệu an toàn...
          </div>
        )}
        {error && !loading && (
          <div className="mx-auto mt-10 max-w-lg border-[3px] border-pure-black bg-tertiary-container p-5 text-center font-bold shadow-[5px_5px_0px_#000000]">
            {error}
          </div>
        )}
        {!loading && !error && pdf && (
          <iframe
            key={`${material.id}-${page}-${url}`}
            title={material.filename}
            src={pdfUrlAtPage(url, page)}
            className="h-full w-full border-0 bg-white"
          />
        )}
        {!loading && !error && image && (
          <img src={url} alt={material.filename} className="h-full w-full object-contain" />
        )}
        {!loading && !error && material && !pdf && !image && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-lg border-[3px] border-pure-black bg-off-white p-6 text-center shadow-[6px_6px_0px_#000000]">
              <span className="material-symbols-outlined text-[54px] text-role-accent">draft</span>
              <h2 className="mt-2 font-headline text-headline-sm font-bold">Không thể xem trực tiếp định dạng này</h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Hãy mở tài liệu trong ứng dụng phù hợp, hoặc tải lên bản PDF để trình chiếu đồng bộ.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 border-[2px] border-pure-black bg-role-accent px-4 py-2 font-bold text-role-contrast shadow-[3px_3px_0px_#000000]"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                Mở tài liệu
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MaterialViewer;
