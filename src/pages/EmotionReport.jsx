import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import SessionReport from '../components/SessionReport';
import useAuth from '../hooks/useAuth';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '');

/**
 * Post-session report (README 1.2): real data only. A meeting is opened from the history list
 * (router state); realtime meetings have no report, so only a notice is shown for them.
 */
const EmotionReport = () => {
  const location = useLocation();
  const { user } = useAuth();
  const meeting = location.state?.meeting;
  const isAfterSession = meeting?.mode === 'after_session';
  const title = meeting?.name || (meeting?.code ? `Phòng ${meeting.code}` : 'Báo cáo cảm xúc');

  return (
    <DashboardLayout activeTab="bao-cao-cam-xuc">
      <div className="flex flex-col w-full max-w-7xl mx-auto p-gutter md:p-margin pb-24 font-body gap-space-lg">
        {!meeting ? (
          <div className="p-6 border-[3px] border-pure-black bg-surface-container-low shadow-[4px_4px_0px_#000000]">
            <h1 className="text-headline-md font-headline font-bold">Báo cáo cảm xúc</h1>
            <p className="mt-2 text-body-md">
              Chọn một buổi học sau buổi (AI đánh giá sau) trong lịch sử để xem báo cáo.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 px-4 py-2 bg-bright-yellow border-[3px] border-pure-black font-bold shadow-[4px_4px_0px_#000000]"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b-[3px] border-pure-black pb-space-md">
              <div className="flex items-center gap-space-sm flex-wrap mb-space-xs">
                <span className="px-2.5 py-0.5 bg-primary text-on-primary text-label-sm font-bold uppercase border border-pure-black">
                  Báo cáo sau buổi học
                </span>
                <span className="px-2.5 py-0.5 bg-royal-blue text-white text-label-sm font-bold border border-pure-black">
                  {isAfterSession ? 'AI đánh giá sau (video ghi hình)' : 'Realtime'}
                </span>
                {meeting.createdAt && (
                  <span className="text-body-sm text-on-surface-variant font-mono font-bold">
                    Ngày {formatDate(meeting.createdAt)}
                  </span>
                )}
              </div>
              <h1 className="text-headline-lg font-headline font-bold text-on-surface tracking-tight">{title}</h1>
              {meeting.code && (
                <p className="text-body-md text-on-surface-variant mt-1">
                  Phòng học: <strong className="font-mono">#{meeting.code}</strong>
                </p>
              )}
            </div>
            {user?.role !== 'teacher' ? (
              <div className="p-4 border-[3px] border-pure-black bg-tertiary-container font-bold" role="alert">
                Chỉ giáo viên chủ phòng được xem báo cáo.
              </div>
            ) : isAfterSession ? (
              <SessionReport meeting={meeting} />
            ) : (
              <div className="p-4 border-[3px] border-pure-black bg-bright-yellow font-bold" role="status">
                Buổi học Realtime không có Report, timeline hay chatbot (không lưu video).
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmotionReport;
