import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeetingHistory } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';

const analysisStatuses = {
  awaiting_recording: { label: 'Chờ bản ghi', className: 'bg-surface-container-high text-on-surface', icon: 'videocam_off' },
  awaiting_analysis: { label: 'Chờ yêu cầu AI', className: 'bg-bright-yellow text-pure-black', icon: 'hourglass_top' },
  pending: { label: 'Đang chờ AI...', className: 'bg-orange-400 text-pure-black animate-pulse', icon: 'progress_activity' },
  processing: { label: 'Đang xử lý AI...', className: 'bg-orange-400 text-pure-black animate-pulse', icon: 'progress_activity' },
  completed: { label: 'Phân tích hoàn tất', className: 'bg-emerald-500 text-white', icon: 'check_circle' },
  failed: { label: 'Phân tích thất bại', className: 'bg-vivid-red text-white', icon: 'error' },
  not_required: { label: 'Realtime', className: 'bg-surface-container-high text-on-surface', icon: 'speed' },
};

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const data = await getMeetingHistory();
      setHistory(data?.items || []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải lịch sử phòng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-refresh when any room is in 'processing' status
  useEffect(() => {
    const hasProcessing = history.some((r) => ['pending', 'processing'].includes(r.analysis_status));
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 2500);

    return () => clearInterval(interval);
  }, [history]);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'realtime' && item.analysisMode === 'realtime') ||
      (filterMode === 'batch' && item.analysisMode === 'batch');

    return matchesSearch && matchesFilter;
  });

  const handleViewDetail = (meeting) => {
    navigate('/bao-cao-cam-xuc', {
      state: { meeting },
    });
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
            className="w-full px-3.5 py-2 bg-surface border-[2px] border-pure-black text-body-md font-bold focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000]"
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
                ? 'bg-bright-yellow text-pure-black shadow-[2px_2px_0px_#000000]'
                : 'bg-surface hover:bg-surface-container text-on-surface'
            }`}
          >
            Tất cả ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('batch')}
            className={`px-3 py-1 text-label-sm font-bold border-[2px] border-pure-black transition-all cursor-pointer ${
              filterMode === 'batch'
                ? 'bg-bright-yellow text-pure-black shadow-[2px_2px_0px_#000000]'
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
                ? 'bg-bright-yellow text-pure-black shadow-[2px_2px_0px_#000000]'
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
                <th className="p-space-md border-r-[2px] border-pure-black">Trạng thái</th>
                <th className="p-space-md text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y-[2px] divide-pure-black text-body-sm">
              {filteredHistory.map((item) => {
                const isBatch = item.analysisMode === 'batch';
                const isProcessing = ['pending', 'processing'].includes(item.analysis_status);
                const isOngoing = item.status === 'active';
                const statusInfo = isOngoing
                  ? { label: 'Đang diễn ra', className: 'bg-emerald-500 text-white', icon: 'sensors' }
                  : analysisStatuses[item.analysis_status] || analysisStatuses.not_required;

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
                        {item.studentId ? 2 : 1} người tham gia
                      </div>
                    </td>

                    {/* Analysis Mode Badge */}
                    <td className="p-space-md border-r-[2px] border-pure-black">
                      {isBatch ? (
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

                    {/* Status */}
                    <td className="p-space-md border-r-[2px] border-pure-black">
                      <span className={`px-2.5 py-1 text-label-sm font-bold border border-pure-black shadow-[2px_2px_0px_#000000] inline-flex items-center gap-1.5 ${statusInfo.className}`}>
                        <span className={`material-symbols-outlined text-[16px] ${isProcessing ? 'animate-spin' : ''}`}>{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-space-md text-center">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleViewDetail(item)}
                        className={`px-3.5 py-1.5 font-bold text-label-md border-[2px] border-pure-black transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                          isProcessing
                            ? 'bg-surface-variant text-on-surface-variant opacity-60 cursor-not-allowed'
                            : 'bg-bright-yellow text-pure-black shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">insights</span>
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default History;
