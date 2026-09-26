import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import JoinRoom from '../components/JoinRoom';
import useAuth from '../hooks/useAuth';

const sampleStudentClassrooms = [
  {
    id: 'MATH12A1',
    code: 'MATH12A1',
    subject: 'Môn Toán Học • Phòng 402',
    title: 'Toán 12A1: Khảo sát hàm số nâng cao',
    teacher: 'Thầy Nguyễn Văn A',
    studentsCount: 42,
    isLive: true,
  },
  {
    id: 'PHYS11B2',
    code: 'PHYS11B2',
    subject: 'Môn Vật Lý • Phòng 201',
    title: 'Vật lý 11B2: Dòng điện trong chất điện phân',
    teacher: 'Cô Trần Thị Mai',
    studentsCount: 38,
    isLive: false,
    scheduledTime: '16:00 HÔM NAY',
  },
  {
    id: 'CHEM10C3',
    code: 'CHEM10C3',
    subject: 'Môn Hóa Học • Phòng 105',
    title: 'Hóa học 10C3: Phản ứng Oxi hóa - Khử',
    teacher: 'Thầy Lê Hoàng Nam',
    studentsCount: 40,
    isLive: false,
    scheduledTime: '08:00 NGÀY MAI',
  },
];

const StudentDashBoard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const [inputCode, setInputCode] = useState('');

  const handleJoinWithCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setJoinRoomCode(inputCode.trim());
    setInputCode('');
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      onJoinRoom={(code) => setJoinRoomCode(code)}
    >
      {/* JoinRoom Modal Overlay */}
      {joinRoomCode && (
        <div className="fixed inset-0 z-50 bg-pure-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-[3px] border-pure-black shadow-[8px_8px_0px_#000000] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6 teacher-content-enter">
            <JoinRoom roomCode={joinRoomCode} onClose={() => setJoinRoomCode(null)} />
          </div>
        </div>
      )}

      <div className="flex flex-col w-full p-gutter md:p-margin gap-space-xl pb-24">
        {/* 1. Header Chào Mừng */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-xl gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <span className="text-label-sm uppercase tracking-wider bg-primary-container px-2 py-1 w-max border-[2px] border-pure-black font-bold">
              AI Tutor Trực tuyến
            </span>
            <h1 className="text-headline-xl font-headline font-bold text-on-surface">
              Xin chào, {user?.username || 'Nguyễn Văn An'}! 🎓
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              Trạng thái cảm xúc học tập: <strong className="text-secondary font-bold">Tập trung cao độ (94%)</strong> - AI ghi nhận bạn đang tiếp thu bài học rất hiệu quả.
            </p>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="bg-bright-yellow border-[3px] border-pure-black shadow-[2px_2px_0px_#000000] px-space-md py-space-sm flex items-center gap-space-sm">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                military_tech
              </span>
              <div className="flex flex-col">
                <span className="text-label-sm uppercase font-mono">Huy hiệu</span>
                <span className="text-label-lg font-bold">Top 5% Toàn trường</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Thẻ thống kê nhanh (Grid 4 cột) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
            <div className="flex justify-between items-start">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Lớp học hôm nay
              </span>
              <span className="material-symbols-outlined bg-primary-container p-2 border-[2px] border-pure-black text-[24px]">
                school
              </span>
            </div>
            <div>
              <div className="text-headline-xl font-headline font-bold">2 Lớp</div>
              <div className="text-body-sm text-on-surface-variant mt-space-xs">
                Tiếp theo: Toán 12A1 lúc 14:00
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
            <div className="flex justify-between items-start">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Tỉ lệ tập trung
              </span>
              <span className="material-symbols-outlined bg-secondary-container text-on-secondary-container p-2 border-[2px] border-pure-black text-[24px]">
                psychology
              </span>
            </div>
            <div>
              <div className="text-headline-xl font-headline font-bold text-secondary">91%</div>
              <div className="text-body-sm text-on-surface-variant mt-space-xs">Đánh giá: Tốt ổn định</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
            <div className="flex justify-between items-start">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Tổng giờ học tuần
              </span>
              <span className="material-symbols-outlined bg-tertiary-container text-on-tertiary-container p-2 border-[2px] border-pure-black text-[24px]">
                schedule
              </span>
            </div>
            <div>
              <div className="text-headline-xl font-headline font-bold text-tertiary">14.5h</div>
              <div className="text-body-sm text-on-surface-variant mt-space-xs">Đạt 96% mục tiêu tuần</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
            <div className="flex justify-between items-start">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Thành tích AI
              </span>
              <span className="material-symbols-outlined bg-bright-yellow p-2 border-[2px] border-pure-black text-[24px]">
                workspace_premium
              </span>
            </div>
            <div>
              <div className="text-headline-xl font-headline font-bold">Top 5%</div>
              <div className="text-body-sm text-on-surface-variant mt-space-xs">Học sinh xuất sắc khối</div>
            </div>
          </div>
        </div>

        {/* Quick Join Input Box */}
        <div className="bg-surface-container-low border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div>
            <h3 className="font-headline font-bold text-headline-sm">Tham gia nhanh bằng mã lớp học</h3>
            <p className="text-body-sm text-on-surface-variant">Nhập mã phòng được thầy cô cung cấp để kết nối tức thì.</p>
          </div>
          <form onSubmit={handleJoinWithCode} className="flex gap-space-sm w-full md:w-auto">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 12))}
              placeholder="Nhập mã (vd: MATH12A1)"
              className="px-4 py-2.5 bg-surface-container-lowest border-[3px] border-pure-black font-mono font-bold focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] flex-1 md:w-60"
            />
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="px-5 py-2.5 bg-bright-yellow text-on-surface font-label-md font-bold border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
            >
              Tham gia
            </button>
          </form>
        </div>

        {/* 3. Phòng học trực tuyến đang diễn ra / Sắp diễn ra */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md font-headline font-bold uppercase tracking-tight flex items-center gap-space-sm">
              <span className="w-4 h-4 bg-vivid-red border-[2px] border-pure-black inline-block" />
              Phòng học trực tuyến
            </h2>
            <span className="text-label-sm bg-surface-container px-3 py-1 border-[2px] border-pure-black font-bold">
              Trực tiếp &amp; Sắp tới
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            {sampleStudentClassrooms.map((cls) => (
              <div
                key={cls.id}
                className="bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md relative"
              >
                {cls.isLive ? (
                  <div className="absolute top-4 right-4 bg-vivid-red text-on-error text-label-sm px-3 py-1 border-[2px] border-pure-black font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    ĐANG PHÁT TRỰC TUYẾN
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 bg-surface-container text-on-surface text-label-sm px-3 py-1 border-[2px] border-pure-black font-bold">
                    {cls.scheduledTime}
                  </div>
                )}

                <div className="flex flex-col gap-space-xs pr-32">
                  <span className="text-label-sm uppercase tracking-widest text-on-surface-variant font-mono">
                    {cls.subject}
                  </span>
                  <h3 className="text-headline-md font-headline font-bold">
                    {cls.title}
                  </h3>
                  <p className="text-body-md text-on-surface-variant">
                    Giáo viên: {cls.teacher}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-space-md border-t-[2px] border-pure-black">
                  <div className="flex items-center gap-space-xs text-body-sm font-bold">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                    {cls.studentsCount} học viên đang tham gia
                  </div>

                  <button
                    type="button"
                    onClick={() => setJoinRoomCode(cls.code)}
                    className="bg-bright-yellow text-on-surface font-bold px-space-md py-space-sm border-[3px] border-pure-black shadow-[2px_2px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] transition-all flex items-center gap-space-xs cursor-pointer"
                  >
                    Vào phòng học ngay ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashBoard;
