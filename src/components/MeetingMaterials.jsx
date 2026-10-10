import { useEffect, useRef, useState } from 'react';
import { getMaterialDownload, getMeetingMaterials, uploadMaterial } from '../api/materialApi';
import { getApiErrorMessage } from '../api/axiosClient';

const ACCEPTED_DOCUMENTS = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt';

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MeetingMaterials = ({ meetingId, isTeacher }) => {
  const inputRef = useRef(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const loadMaterials = async () => {
    if (!meetingId) return;
    try {
      const data = await getMeetingMaterials(meetingId, { offset: 0, limit: 100 });
      setMaterials(Array.isArray(data) ? data : []);
      setError('');
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Không thể tải tài liệu phòng học.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!meetingId) return undefined;
    getMeetingMaterials(meetingId, { offset: 0, limit: 100 })
      .then((data) => { if (active) setMaterials(Array.isArray(data) ? data : []); })
      .catch((loadError) => { if (active) setError(getApiErrorMessage(loadError, 'Không thể tải tài liệu phòng học.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [meetingId]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      await uploadMaterial(meetingId, file);
      await loadMaterials();
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Không thể tải tài liệu lên.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (material) => {
    try {
      setDownloadingId(material.id);
      setError('');
      const playback = await getMaterialDownload(material.id);
      if (!playback?.url) throw new Error('Missing download URL');
      window.open(playback.url, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      setError(getApiErrorMessage(downloadError, 'Không thể tạo liên kết tải tài liệu.'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <div className="bg-primary-container border-[3px] border-pure-black p-4 shadow-[4px_4px_0px_#000000]">
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
              className="shrink-0 px-3 py-2 bg-bright-yellow border-[2px] border-pure-black font-bold text-label-sm shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              {uploading ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
        </div>
      )}

      {error && <div className="bg-tertiary-container border-[2px] border-pure-black p-3 text-body-sm font-bold">{error}</div>}
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-bold uppercase">Tài liệu trong phòng</span>
        <button type="button" onClick={loadMaterials} className="text-label-sm font-bold underline">Làm mới</button>
      </div>
      {loading && <div className="border-[2px] border-pure-black bg-surface p-4 text-center text-body-sm">Đang tải tài liệu...</div>}
      {!loading && !materials.length && <div className="border-[2px] border-pure-black bg-surface p-5 text-center text-body-sm text-on-surface-variant">Chưa có tài liệu nào được chia sẻ.</div>}
      <div className="space-y-2">
        {materials.map((material) => (
          <div key={material.id} className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2">
              <span className="material-symbols-outlined text-royal-blue">description</span>
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
              className="shrink-0 p-2 bg-bright-yellow border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingMaterials;
