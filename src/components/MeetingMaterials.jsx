import { useEffect, useRef, useState } from 'react';
import { getMaterialDownload, getMeetingMaterials, uploadMaterial } from '../api/materialApi';
import { getApiErrorMessage, getApiErrorPayload } from '../api/axiosClient';

const ACCEPTED_DOCUMENTS = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt';
const ACCEPTED_EXTENSIONS = new Set(ACCEPTED_DOCUMENTS.split(','));
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const MATERIAL_PAGE_SIZE = 20;

const materialErrorMessages = {
  DOCUMENT_TOO_LARGE: 'Tài liệu vượt quá giới hạn 20 MB.',
  EMPTY_DOCUMENT: 'Tài liệu đang trống.',
  INVALID_FILENAME: 'Tên tài liệu không hợp lệ.',
  UNSUPPORTED_DOCUMENT: 'Định dạng tài liệu không được hỗ trợ.',
  INVALID_DOCUMENT: 'Nội dung tài liệu không đúng với định dạng tệp.',
  UPLOAD_BUSY: 'Hệ thống đang xử lý một tệp khác. Vui lòng thử lại sau.',
  UPLOAD_TIMEOUT: 'Tải tài liệu lên quá thời gian cho phép. Vui lòng thử lại.',
  MATERIAL_NOT_FOUND: 'Tài liệu không còn tồn tại.',
};

const getMaterialErrorMessage = (error, fallback) => {
  const payload = getApiErrorPayload(error);
  return materialErrorMessages[payload.code] || getApiErrorMessage(error, fallback);
};

const validateDocument = (file) => {
  const extensionIndex = file.name.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? file.name.slice(extensionIndex).toLowerCase() : '';
  if (!file.name || file.name.length > 255 || /[/\\\r\n\0]/.test(file.name)) {
    return 'Tên tài liệu không hợp lệ hoặc dài quá 255 ký tự.';
  }
  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    return 'Chỉ hỗ trợ PDF, Word, PowerPoint, Excel và TXT.';
  }
  if (!file.size) return 'Tài liệu đang trống.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Tài liệu vượt quá giới hạn 20 MB.';
  return '';
};

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MeetingMaterials = ({ meetingId, isTeacher }) => {
  const inputRef = useRef(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const loadMaterials = async ({ append = false } = {}) => {
    if (!meetingId) return;
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const data = await getMeetingMaterials(meetingId, {
        offset: append ? materials.length : 0,
        limit: MATERIAL_PAGE_SIZE,
      });
      const items = Array.isArray(data) ? data : [];
      if (append) {
        setMaterials((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          return [...current, ...items.filter((item) => !existingIds.has(item.id))];
        });
      } else {
        setMaterials(items);
      }
      setHasMore(items.length === MATERIAL_PAGE_SIZE);
      setError('');
    } catch (loadError) {
      setError(getMaterialErrorMessage(loadError, 'Không thể tải tài liệu phòng học.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!meetingId) return undefined;
    getMeetingMaterials(meetingId, { offset: 0, limit: MATERIAL_PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data) ? data : [];
        setMaterials(items);
        setHasMore(items.length === MATERIAL_PAGE_SIZE);
      })
      .catch((loadError) => { if (active) setError(getMaterialErrorMessage(loadError, 'Không thể tải tài liệu phòng học.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [meetingId]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const validationError = validateDocument(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setUploading(true);
      setUploadProgress(0);
      setError('');
      await uploadMaterial(meetingId, file, {
        onUploadProgress: ({ loaded, total }) => {
          if (!total) return;
          setUploadProgress(Math.min(100, Math.round((loaded * 100) / total)));
        },
      });
      await loadMaterials();
    } catch (uploadError) {
      setError(getMaterialErrorMessage(uploadError, 'Không thể tải tài liệu lên.'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (material) => {
    try {
      setDownloadingId(material.id);
      setError('');
      const playback = await getMaterialDownload(material.id);
      if (!playback?.url) throw new Error('Chưa thể tải tài liệu này. Vui lòng thử lại sau.');
      const anchor = document.createElement('a');
      anchor.href = playback.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    } catch (downloadError) {
      setError(getMaterialErrorMessage(downloadError, 'Không thể tạo liên kết tải tài liệu.'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <div className="bg-role-soft border-[3px] border-pure-black p-4 shadow-[4px_4px_0px_#000000]">
          <input ref={inputRef} type="file" accept={ACCEPTED_DOCUMENTS} onChange={handleUpload} className="hidden" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-headline font-bold text-headline-sm">Chia sẻ tài liệu</div>
              <div className="text-label-sm text-on-surface-variant mt-1">PDF, Word, PowerPoint, Excel hoặc TXT</div>
            </div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="shrink-0 px-3 py-2 bg-role-accent text-role-contrast border-[2px] border-pure-black font-bold text-label-sm shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              {uploading ? `Đang tải${uploadProgress ? ` ${uploadProgress}%` : '...'}` : 'Tải lên'}
            </button>
          </div>
        </div>
      )}

      {error && <div className="bg-tertiary-container border-[2px] border-pure-black p-3 text-body-sm font-bold">{error}</div>}
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-bold uppercase">Tài liệu trong phòng</span>
        <button type="button" disabled={loading || uploading} onClick={loadMaterials} className="text-label-sm font-bold underline disabled:opacity-50">Làm mới</button>
      </div>
      {loading && <div className="border-[2px] border-pure-black bg-surface p-4 text-center text-body-sm">Đang tải tài liệu...</div>}
      {!loading && !materials.length && <div className="border-[2px] border-pure-black bg-surface p-5 text-center text-body-sm text-on-surface-variant">Chưa có tài liệu nào được chia sẻ.</div>}
      <div className="space-y-2">
        {materials.map((material) => (
          <div key={material.id} className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2">
              <span className="material-symbols-outlined text-role-accent">description</span>
              <div className="min-w-0">
                <div className="font-bold text-body-sm truncate" title={material.filename}>{material.filename}</div>
                <div className="text-xs text-on-surface-variant">{formatBytes(material.size_bytes)} • {new Date(material.created_at).toLocaleString('vi-VN')}</div>
              </div>
            </div>
            <button
              type="button"
              disabled={downloadingId === material.id}
              onClick={() => handleDownload(material)}
              aria-label={`Tải ${material.filename}`}
              className="shrink-0 p-2 bg-role-accent text-role-contrast border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        ))}
      </div>
      {!loading && hasMore && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => loadMaterials({ append: true })}
          className="w-full px-3 py-2 bg-surface-container border-[2px] border-pure-black font-bold text-label-sm shadow-[2px_2px_0px_#000000] disabled:opacity-50"
        >
          {loadingMore ? 'Đang tải...' : 'Tải thêm tài liệu'}
        </button>
      )}
    </div>
  );
};

export default MeetingMaterials;
