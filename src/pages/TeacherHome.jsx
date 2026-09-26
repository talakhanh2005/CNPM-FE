import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import NewRoom from '../components/NewRoom';
import History from '../components/HistoryRoom';
import JoinRoom from '../components/JoinRoom';
import useAuth from '../hooks/useAuth';

const sampleClassrooms = [
  {
    id: 'MATH12A1',
    code: 'MATH12A1',
    tag: 'TOÁN HỌC 12A1',
    tagColor: 'bg-bright-yellow text-on-primary-fixed',
    title: 'Giải tích Nâng cao: Đạo hàm hàm hợp',
    studentsCount: 42,
    aiFocus: 88,
    statusText: 'Đang bật - Tỉ lệ tập trung 88%',
    barColor: 'bg-secondary',
  },
  {
    id: 'PHYS11B2',
    code: 'PHYS11B2',
    tag: 'VẬT LÝ 11B2',
    tagColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Điện từ trường & Cảm ứng',
    studentsCount: 38,
    aiFocus: 94,
    statusText: 'Đang bật - Tỉ lệ tập trung 94%',
    barColor: 'bg-tertiary',
  },
  {
    id: 'CHEM10C3',
    code: 'CHEM10C3',
    tag: 'HÓA HỌC 10C3',
    tagColor: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    title: 'Phản ứng Oxi hóa - Khử',
    studentsCount: 45,
    aiFocus: 91,
    statusText: 'Đang bật - Tỉ lệ tập trung 91%',
    barColor: 'bg-primary',
  },
];

const scheduledLessons = [
  {
    time: 'Hôm nay, 14:00 - 15:30',
    title: 'Hình học không gian Oxyz',
    subtitle: 'Ôn tập chương phương pháp tọa độ',
    roomClass: '12A2',
    status: 'Sắp diễn ra',
  },
  {
    time: 'Hôm nay, 16:00 - 17:30',
    title: 'Dao động cơ học nâng cao',
    subtitle: 'Con lắc lò xo và bài toán thực tế',
    roomClass: '11A1',
    status: 'Sắp diễn ra',
  },
  {
    time: 'Ngày mai, 08:00 - 09:30',
    title: 'Kim loại kiềm & Kiềm thổ',
    subtitle: 'Tính chất hóa học và ứng dụng công nghiệp',
    roomClass: '10C1',
    status: 'Đã lên lịch',
  },
];

const TeacherHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'dashboard');
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(location.state?.tab === 'phong-hoc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      if (location.state.tab === 'phong-hoc') {
        setIsCreatingRoom(true);
      }
    }
  }, [location.state]);

  const filteredScheduled = scheduledLessons.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.roomClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab === 'phong-hoc') setIsCreatingRoom(true);
      }}
      onJoinRoom={(code) => setJoinRoomCode(code)}
    >
      {/* Overlays for NewRoom, JoinRoom or History */}
      {isCreatingRoom && (
        <div className="fixed inset-0 z-50 bg-pure-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-[3px] border-pure-black shadow-[8px_8px_0px_#000000] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6 teacher-content-enter">
            <NewRoom onClose={() => {
              setIsCreatingRoom(false);
              setActiveTab('dashboard');
            }} />
          </div>
        </div>
      )}

      {joinRoomCode && (
        <div className="fixed inset-0 z-50 bg-pure-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-[3px] border-pure-black shadow-[8px_8px_0px_#000000] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6 teacher-content-enter">
            <JoinRoom roomCode={joinRoomCode} onClose={() => setJoinRoomCode(null)} />
          </div>
        </div>
      )}

      {activeTab === 'lich-su' ? (
        <div className="p-gutter md:p-margin flex-1">
          <div className="flex items-center justify-between pb-4 border-b-[3px] border-pure-black mb-6">
            <h2 className="text-headline-lg font-headline font-bold">Lịch sử phòng học</h2>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-surface-container border-[2px] border-pure-black font-bold"
            >
              Quay lại Dashboard
            </button>
          </div>
          <History onClose={() => setActiveTab('dashboard')} />
        </div>
      ) : (
        <div className="flex flex-col w-full p-gutter md:p-margin gap-space-xl pb-24">
          {/* Welcome Banner */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-center bg-off-white border-[3px] border-pure-black p-space-lg shadow-[6px_6px_0px_#000000] gap-space-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none select-none text-royal-blue">
              <span className="material-symbols-outlined text-[200px]">co_present</span>
            </div>

            <div className="flex flex-col gap-space-xs z-10">
              <div className="flex items-center gap-space-sm">
                <span className="px-space-sm py-1 bg-royal-blue text-white text-label-sm font-bold border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">co_present</span>
                  TRUNG TÂM GIẢNG DẠY
                </span>
                <span className="text-on-surface-variant text-label-sm font-mono">Học kỳ II - 2024/2025</span>
              </div>
              <h1 className="text-headline-xl-mobile md:text-headline-xl font-headline font-bold text-on-surface tracking-tight">
                Xin chào, Thầy/Cô {user?.username || 'Hoàng'}! <span className="inline-block animate-bounce">📚</span>
              </h1>
              <p className="text-body-md text-on-surface-variant max-w-xl">
                Hệ thống AI đang hỗ trợ giám sát phòng học và phân tích mức độ tập trung của học sinh theo thời gian thực. Khởi tạo phòng mới hoặc kiểm tra báo cáo cảm xúc.
              </p>
            </div>

            <div className="flex flex-wrap gap-space-md z-10 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsCreatingRoom(true)}
                className="flex-1 md:flex-none px-space-md py-space-sm bg-royal-blue text-white border-[3px] border-pure-black font-label-lg font-bold shadow-[4px_4px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-space-sm cursor-pointer"
              >
                <span className="material-symbols-outlined">add_box</span>
                Tạo phòng học mới
              </button>

              <button
                type="button"
                onClick={() => navigate('/bao-cao-cam-xuc')}
                className="flex-1 md:flex-none px-space-md py-space-sm bg-surface-container-lowest text-on-surface border-[3px] border-pure-black font-label-lg font-bold shadow-[4px_4px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center justify-center gap-space-sm cursor-pointer"
              >
                <span className="material-symbols-outlined">psychology</span>
                Báo cáo cảm xúc
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lich-su')}
                className="px-space-md py-space-sm bg-surface-container-high text-on-surface border-[3px] border-pure-black font-label-lg font-bold shadow-[4px_4px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center justify-center gap-space-sm cursor-pointer"
              >
                <span className="material-symbols-outlined">history</span>
                Xem lịch sử
              </button>
            </div>
          </section>

          {/* Active Classrooms Grid */}
          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md font-headline font-bold uppercase tracking-tight flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-royal-blue border-[2px] border-pure-black inline-block" />
                Lớp học đang diễn ra
              </h2>
              <span className="text-label-sm bg-surface-container px-3 py-1 border-[2px] border-pure-black font-bold">
                Trực tuyến với AI Cảm xúc
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              {sampleClassrooms.map((item) => (
                <div
                  key={item.id}
                  className="bg-off-white border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] flex flex-col justify-between gap-space-md"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-label-sm font-bold border-[2px] border-pure-black ${item.tagColor}`}>
                      {item.tag}
                    </span>
                    <span className="flex items-center gap-1.5 text-label-sm font-bold text-on-surface bg-surface-container-lowest px-2 py-1 border-[2px] border-pure-black">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      TRỰC TUYẾN
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <h3 className="text-headline-sm font-headline font-bold text-on-surface">
                      {item.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                      {item.studentsCount} học sinh tham gia
                    </p>
                  </div>

                  <div className="bg-surface-container-low border-[2px] border-pure-black p-space-md flex flex-col gap-space-xs">
                    <div className="flex justify-between text-label-sm font-bold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">psychology</span> AI Cảm Xúc
                      </span>
                      <span className="text-on-surface">{item.statusText}</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-3 border-[2px] border-pure-black overflow-hidden">
                      <div className={`${item.barColor} h-full`} style={{ width: `${item.aiFocus}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-space-sm pt-space-xs">
                    <button
                      type="button"
                      onClick={() => setJoinRoomCode(item.code)}
                      className="flex-1 py-2 bg-royal-blue text-on-secondary font-label-md font-bold border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                      Vào phòng
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/bao-cao-cam-xuc')}
                      className="px-space-md py-2 bg-surface-container-lowest text-on-surface font-label-md font-bold border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">insights</span>
                      Báo cáo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Scheduled Classes Table */}
          <section className="flex flex-col gap-space-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-space-sm">
              <div>
                <span className="text-label-sm font-bold text-on-surface-variant tracking-wider uppercase">
                  Lịch trình hệ thống
                </span>
                <h2 className="text-headline-md font-headline font-bold text-on-surface">
                  Phòng học đã lên lịch
                </h2>
              </div>
              <div className="flex gap-space-sm w-full md:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm môn học, lớp..."
                  className="px-space-md py-2 bg-surface-container-lowest border-[3px] border-pure-black text-body-sm focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] flex-1 md:w-64"
                />
              </div>
            </div>

            <div className="bg-off-white border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b-[3px] border-pure-black text-label-lg font-bold text-on-surface">
                    <th className="p-space-md border-r-[3px] border-pure-black">Thời gian</th>
                    <th className="p-space-md border-r-[3px] border-pure-black">Môn học &amp; Chủ đề</th>
                    <th className="p-space-md border-r-[3px] border-pure-black">Lớp</th>
                    <th className="p-space-md border-r-[3px] border-pure-black">Trạng thái</th>
                    <th className="p-space-md text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[2px] divide-pure-black text-body-md">
                  {filteredScheduled.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-space-md border-r-[3px] border-pure-black font-bold">
                        {item.time}
                      </td>
                      <td className="p-space-md border-r-[3px] border-pure-black">
                        <div className="font-bold text-on-surface">{item.title}</div>
                        <div className="text-body-sm text-on-surface-variant">{item.subtitle}</div>
                      </td>
                      <td className="p-space-md border-r-[3px] border-pure-black font-bold font-mono">
                        {item.roomClass}
                      </td>
                      <td className="p-space-md border-r-[3px] border-pure-black">
                        <span className="px-3 py-1 bg-bright-yellow text-on-surface text-label-sm font-bold border-[2px] border-pure-black inline-block">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-space-md text-center">
                        <div className="flex justify-center gap-space-sm">
                          <button
                            type="button"
                            onClick={() => setIsCreatingRoom(true)}
                            className="px-3 py-1.5 bg-primary text-on-primary text-label-sm font-bold border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                          >
                            Bắt đầu
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherHome;
