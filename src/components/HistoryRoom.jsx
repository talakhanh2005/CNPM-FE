import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteRoom, getMeetingHistory } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';

const PAGE_SIZE = 20;

const History = () => {
  const navigate = useNavigate();
  const historyLengthRef = useRef(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchHistory = useCallback(async ({ append = false, refresh = false } = {}) => {
    const limit = refresh ? Math.max(PAGE_SIZE, historyLengthRef.current) : PAGE_SIZE;
    const offset = append ? historyLengthRef.current : 0;
    try {
      if (append) setLoadingMore(true);
      const data = await getMeetingHistory({ offset, limit });
      const items = data?.items || [];
      if (append) {
        setHistory((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          const next = [...current, ...items.filter((item) => !existingIds.has(item.id))];
          historyLengthRef.current = next.length;
          return next;
        });
      } else {
        historyLengthRef.current = items.length;
        setHistory(items);
      }
      if (!refresh) setHasMore(items.length === limit);
      if (refresh && items.length < limit) setHasMore(false);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải lịch sử phòng.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  // Auto-refresh when any room is in 'processing' status
  useEffect(() => {
    const hasProcessing = history.some((r) => ['pending', 'processing'].includes(r.analysis_status));
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      void fetchHistory({ refresh: true });
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchHistory, history]);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'realtime' && item.analysisMode === 'realtime') ||
      (filterMode === 'after_session' && item.analysisMode === 'after_session');

    return matchesSearch && matchesFilter;
  });

  const handleViewDetail = (meeting) => {
    navigate('/report', {
      state: { meeting },
    });
  };

  const handleDelete = async (meeting) => {
    const confirmed = window.confirm(
      `Xóa vĩnh viễn buổi học #${meeting.code}? Thông tin, bản ghi và báo cáo của buổi học sẽ bị xóa và không thể khôi phục.`,
    );
    if (!confirmed) return;

    setDeletingId(meeting.id);
    setError('');
    try {
      await deleteRoom(meeting.id);
      setHistory((current) => {
        const next = current.filter((item) => item.id !== meeting.id);
        historyLengthRef.current = next.length;
        return next;
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa buổi học.'));
    } finally {
      setDeletingId('');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Hôm nay';
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatDuration = (item) => {
    if (!item.createdAt || !item.endedAt) return item.status === 'active' ? 'Đang diễn ra' : '--';
    return `${Math.max(0, Math.round((new Date(item.endedAt) - new Date(item.createdAt)) / 60000))} phút`;
  };

  return (
    <div className="flex flex-col gap-space-lg w-full font-body">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md bg-off-white border-[3px] border-pure-black p-space-md shadow-[4px_4px_0px_#000000]">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên lớp học, mã phòng..."
            className="w-full px-3.5 py-2 bg-surface border-[2px] border-pure-black text-body-md font-bold focus:bg-role-soft outline-none shadow-[2px_2px_0px_#000000]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-sm font-bold uppercase text-on-surface-variant">
            Lọc:
          </span>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-label-sm font-bold border-[2px] border-pure-black transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-role-accent text-role-contrast shadow-[2px_2px_0px_#000000]'
                : 'bg-surface hover:bg-surface-container text-on-surface'
            }`}
          >
            Tất cả ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('after_session')}
            className={`px-3 py-1 text-label-sm font-bold border-[2px] border-pure-black transition-all cursor-pointer ${
              filterMode === 'after_session'
                ? 'bg-role-accent text-role-contrast shadow-[2px_2px_0px_#000000]'
                : 'bg-surface hover:bg-surface-container text-on-surface'
            }`}
          >
            ⏳ AI đánh giá sau
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('realtime')}
            className={`px-3 py-1 text-label-sm font-bold border-[2px] border-pure-black transition-all cursor-pointer ${
              filterMode === 'realtime'
                ? 'bg-role-accent text-role-contrast shadow-[2px_2px_0px_#000000]'
                : 'bg-surface hover:bg-surface-container text-on-surface'
            }`}
          >
            ⚡ Realtime
          </button>
        </div>
      </div>

      {/* Main History Table */}
      <div className="bg-off-white border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] overflow-x-auto">
        {error && <div className="m-4 border-[2px] border-pure-black bg-tertiary-container p-3 font-bold">{error}</div>}
        {loading ? (
          <div className="p-12 text-center text-body-lg font-bold">
            Đang tải danh sách lịch sử phòng học...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
              history_toggle_off
            </span>
            <p className="text-body-lg font-bold">Chưa tìm thấy lớp học nào phù hợp.</p>
            <p className="text-body-sm text-on-surface-variant">
              Hãy tạo phòng học mới và tiến hành ghi hình để xuất hiện trong lịch sử.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b-[3px] border-pure-black text-label-md font-bold text-on-surface uppercase">
                <th className="p-space-md border-r-[2px] border-pure-black">Mã lớp</th>
                <th className="p-space-md border-r-[2px] border-pure-black">Tên lớp học</th>
                <th className="p-space-md border-r-[2px] border-pure-black">Loại phân tích</th>
                <th className="p-space-md border-r-[2px] border-pure-black">Thời gian</th>
                <th className="p-space-md border-r-[2px] border-pure-black text-center">Hành động</th>
                <th className="w-20 p-space-md text-center">
                  <span className="sr-only">Xóa buổi học</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-[2px] divide-pure-black text-body-sm">
              {filteredHistory.map((item) => {
                const isAfterSession = item.analysisMode === 'after_session';
                const isProcessing = ['pending', 'processing'].includes(item.analysis_status);
                const reportUnavailable = !isAfterSession;
                const actionDisabled = isProcessing || reportUnavailable;
                const studentCount = item.studentIds?.length || (item.studentId ? 1 : 0);

                return (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                    {/* Code */}
                    <td className="p-space-md border-r-[2px] border-pure-black font-mono font-bold">
                      <span className="px-2 py-1 bg-surface-container-lowest border border-pure-black shadow-[1px_1px_0px_#000000]">
                        #{item.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="p-space-md border-r-[2px] border-pure-black">
                      <div className="font-bold text-on-surface text-body-md">
                        {item.name || 'Lớp học trực tuyến'}
                      </div>
                      <div className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">group</span>
                        {studentCount + 1} người tham gia
                      </div>
                    </td>

                    {/* Analysis Mode Badge */}
                    <td className="p-space-md border-r-[2px] border-pure-black">
                      {isAfterSession ? (
                        <span className="px-2.5 py-1 bg-royal-blue text-white text-label-sm font-bold border border-pure-black shadow-[2px_2px_0px_#000000] inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">psychology</span>
                          AI đánh giá sau
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-bright-yellow text-pure-black text-label-sm font-bold border border-pure-black shadow-[2px_2px_0px_#000000] inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">speed</span>
                          Realtime
                        </span>
                      )}
                    </td>

                    {/* Time / Duration */}
                    <td className="p-space-md border-r-[2px] border-pure-black font-mono">
                      <div className="font-bold">{formatDate(item.createdAt)}</div>
                      <div className="text-on-surface-variant text-label-sm">
                        {formatDuration(item)}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-space-md border-r-[2px] border-pure-black text-center">
                      <button
                        type="button"
                        disabled={actionDisabled}
                        onClick={() => handleViewDetail(item)}
                        className={`px-3.5 py-1.5 font-bold text-label-md border-[2px] border-pure-black transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                          actionDisabled
                            ? 'bg-surface-variant text-on-surface-variant opacity-60 cursor-not-allowed'
                            : 'bg-role-accent text-role-contrast shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{reportUnavailable ? 'block' : 'insights'}</span>
                        {reportUnavailable ? 'Không có báo cáo' : 'Xem chi tiết'}
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="w-20 p-space-md text-center">
                      <button
                        type="button"
                        disabled={Boolean(deletingId)}
                        onClick={() => handleDelete(item)}
                        aria-label={`Xóa buổi học ${item.name || item.code || ''}`.trim()}
                        title={deletingId === item.id ? 'Đang xóa buổi học' : 'Xóa buổi học'}
                        className="inline-flex size-10 cursor-pointer items-center justify-center border-[2px] border-pure-black bg-vivid-red text-white shadow-[2px_2px_0px_#000000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-royal-blue active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className={`material-symbols-outlined text-[22px] ${deletingId === item.id ? 'animate-spin' : ''}`} aria-hidden="true">
                          {deletingId === item.id ? 'progress_activity' : 'delete'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && hasMore && (
          <div className="flex items-center justify-center gap-3 border-t-[3px] border-pure-black p-4">
            <span className="text-label-sm text-on-surface-variant">Đã tải {history.length} phòng</span>
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => fetchHistory({ append: true })}
              className="px-4 py-2 bg-role-accent text-role-contrast border-[2px] border-pure-black font-bold text-label-sm shadow-[2px_2px_0px_#000000] disabled:opacity-50"
            >
              {loadingMore ? 'Đang tải...' : `Tải thêm ${PAGE_SIZE} phòng`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
