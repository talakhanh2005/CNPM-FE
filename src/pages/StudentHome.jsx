import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import JoinRoom from '../components/JoinRoom';
import useAuth from '../hooks/useAuth';

// Mock Data: Danh sách phòng học của học sinh (Live & Sắp diễn ra)
const mockStudentClassrooms = [
  {
    id: 'MATH12A1',
    code: 'MATH12A1',
    subject: 'Toán học',
    roomNo: 'Phòng 402',
    title: 'Toán 12A1: Khảo sát hàm số nâng cao & Cực trị hàm hợp',
    teacher: 'Thầy Nguyễn Văn A',
    teacherAvatar: 'A',
    studentsCount: 42,
    isLive: true,
    scheduledTime: 'Đang diễn ra',
    startTime: '14:00',
    endTime: '15:30',
    dateLabel: 'Hôm nay',
    description: 'Chuyên đề ôn tập cực trị của hàm số bậc 3, hàm số phân thức hữu tỉ và các dạng toán vận dụng cao.',
  },
  {
    id: 'PHYS11B2',
    code: 'PHYS11B2',
    subject: 'Vật lý',
    roomNo: 'Phòng 201',
    title: 'Vật lý 11B2: Dòng điện trong chất điện phân & Định luật Faraday',
    teacher: 'Cô Trần Thị Mai',
    teacherAvatar: 'M',
    studentsCount: 38,
    isLive: false,
    scheduledTime: '16:00 HÔM NAY',
    startTime: '16:00',
    endTime: '17:30',
    dateLabel: 'Hôm nay',
    description: 'Thí nghiệm mô phỏng hiện tượng cực dương tan và ứng dụng mạ điện công nghiệp.',
  },
  {
    id: 'ENG12C1',
    code: 'ENG12C1',
    subject: 'Tiếng Anh',
    roomNo: 'Phòng 305',
    title: 'Tiếng Anh 12C1: Luyện đề IELTS Reading & Kỹ năng Skimming',
    teacher: 'Thầy David Miller',
    teacherAvatar: 'D',
    studentsCount: 35,
    isLive: true,
    scheduledTime: 'Đang diễn ra',
    startTime: '14:15',
    endTime: '15:45',
    dateLabel: 'Hôm nay',
    description: 'Phân tích chiến lược xử lý các dạng bài khó: Matching Headings và True/False/Not Given.',
  },
  {
    id: 'CHEM10C3',
    code: 'CHEM10C3',
    subject: 'Hóa học',
    roomNo: 'Phòng 105',
    title: 'Hóa học 10C3: Cân bằng phản ứng Oxi hóa - Khử nâng cao',
    teacher: 'Thầy Lê Hoàng Nam',
    teacherAvatar: 'N',
    studentsCount: 40,
    isLive: false,
    scheduledTime: '08:00 NGÀY MAI',
    startTime: '08:00',
    endTime: '09:30',
    dateLabel: 'Ngày mai',
    description: 'Phương pháp thăng bằng electron cho phản ứng oxi hóa khử phức tạp có môi trường axit/bazơ.',
  },
  {
    id: 'LIT12A2',
    code: 'LIT12A2',
    subject: 'Ngữ văn',
    roomNo: 'Phòng 203',
    title: 'Ngữ văn 12A2: Phân tích hình tượng người lái đò sông Đà',
    teacher: 'Cô Vũ Bích Ngọc',
    teacherAvatar: 'N',
    studentsCount: 44,
    isLive: false,
    scheduledTime: '10:00 NGÀY MAI',
    startTime: '10:00',
    endTime: '11:30',
    dateLabel: 'Ngày mai',
    description: 'Bình giảng vẻ đẹp hung bạo và trữ tình của con sông Đà dưới ngòi bút Nguyễn Tuân.',
  },
  {
    id: 'BIO11A1',
    code: 'BIO11A1',
    subject: 'Sinh học',
    roomNo: 'Phòng Lab 2',
    title: 'Sinh học 11A1: Quang hợp ở các nhóm thực vật C3, C4 và CAM',
    teacher: 'Thầy Phan Thanh Tùng',
    teacherAvatar: 'T',
    studentsCount: 36,
    isLive: false,
    scheduledTime: '14:00 THỨ SÁU',
    startTime: '14:00',
    endTime: '15:30',
    dateLabel: 'Thứ Sáu',
    description: 'So sánh cơ chế cố định CO2, hiệu suất quang hợp và điểm bù ánh sáng giữa các nhóm thực vật.',
  },
];

// Mock Data: Lịch sử học tập (Các buổi học đã hoàn thành)
const mockLearningHistory = [
  {
    id: 'HIST-001',
    meetingId: 'MATH12A1_20260925',
    subject: 'Toán học',
    title: 'Toán 12A1: Đạo hàm hàm số lượng giác & Bài toán thực tế',
    teacher: 'Thầy Nguyễn Văn A',
    date: '25/09/2026',
    timeSlot: '14:00 - 15:30',
    duration: 90,
    attendedDuration: 90,
    attendanceStatus: 'Đúng giờ',
    aiFocusScore: 94,
    engagementLevel: 'Rất tích cực',
    emotionBreakdown: { focus: 78, normal: 18, distracted: 4 },
    aiFeedback: 'Tiếp thu bài rất tốt, liên tục duy trì trạng thái tập trung cao độ khi giáo viên giải bài tập vận dụng.',
  },
  {
    id: 'HIST-002',
    meetingId: 'PHYS11B2_20260924',
    subject: 'Vật lý',
    title: 'Vật lý 11B2: Định luật Ôm đối với toàn mạch & Nguồn điện',
    teacher: 'Cô Trần Thị Mai',
    date: '24/09/2026',
    timeSlot: '16:00 - 17:30',
    duration: 90,
    attendedDuration: 88,
    attendanceStatus: 'Đúng giờ',
    aiFocusScore: 91,
    engagementLevel: 'Tích cực',
    emotionBreakdown: { focus: 72, normal: 22, distracted: 6 },
    aiFeedback: 'Tập trung ổn định trong suốt buổi học. Có một khoảng thời gian ngắn xao nhãng ở phút thứ 40.',
  },
  {
    id: 'HIST-003',
    meetingId: 'ENG12C1_20260923',
    subject: 'Tiếng Anh',
    title: 'Tiếng Anh 12C1: Pronunciation & Connected Speech in English',
    teacher: 'Thầy David Miller',
    date: '23/09/2026',
    timeSlot: '09:00 - 10:30',
    duration: 90,
    attendedDuration: 90,
    attendanceStatus: 'Đúng giờ',
    aiFocusScore: 96,
    engagementLevel: 'Xuất sắc',
    emotionBreakdown: { focus: 85, normal: 12, distracted: 3 },
    aiFeedback: 'Tương tác bằng micro và camera rất tự tin, chỉ số cảm xúc hào hứng và chủ động đạt mức tối ưu.',
  },
  {
    id: 'HIST-004',
    meetingId: 'CHEM10C3_20260922',
    subject: 'Hóa học',
    title: 'Hóa học 10C3: Cấu tạo bảng tuần hoàn các nguyên tố hóa học',
    teacher: 'Thầy Lê Hoàng Nam',
    date: '22/09/2026',
    timeSlot: '14:00 - 15:30',
    duration: 90,
    attendedDuration: 75,
    attendanceStatus: 'Rời sớm 15p',
    aiFocusScore: 84,
    engagementLevel: 'Khá',
    emotionBreakdown: { focus: 60, normal: 28, distracted: 12 },
    aiFeedback: 'Giai đoạn đầu tập trung tốt, giai đoạn cuối có dấu hiệu mệt mỏi và rời phòng sớm trước khi hết giờ.',
  },
  {
    id: 'HIST-005',
    meetingId: 'LIT12A2_20260920',
    subject: 'Ngữ văn',
    title: 'Ngữ văn 12A2: Đọc hiểu và phân tích tác phẩm Vợ chồng A Phủ',
    teacher: 'Cô Vũ Bích Ngọc',
    date: '20/09/2026',
    timeSlot: '08:00 - 09:30',
    duration: 90,
    attendedDuration: 90,
    attendanceStatus: 'Đúng giờ',
    aiFocusScore: 93,
    engagementLevel: 'Rất tích cực',
    emotionBreakdown: { focus: 76, normal: 20, distracted: 4 },
    aiFeedback: 'Ghi chép bài đầy đủ, trạng thái suy ngẫm sâu sắc trong các đoạn phân tích tâm lý nhân vật Mị.',
  },
  {
    id: 'HIST-006',
    meetingId: 'BIO11A1_20260918',
    subject: 'Sinh học',
    title: 'Sinh học 11A1: Quá trình hô hấp ở thực vật và vai trò sinh thái',
    teacher: 'Thầy Phan Thanh Tùng',
    date: '18/09/2026',
    timeSlot: '15:00 - 16:30',
    duration: 90,
    attendedDuration: 90,
    attendanceStatus: 'Đúng giờ',
    aiFocusScore: 95,
    engagementLevel: 'Xuất sắc',
    emotionBreakdown: { focus: 82, normal: 15, distracted: 3 },
    aiFeedback: 'Tập trung tuyệt đối trong phần hướng dẫn sơ đồ chuỗi truyền electron hô hấp.',
  },
];

const StudentDashBoard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'dashboard');
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const [inputCode, setInputCode] = useState('');

  // Classrooms Filter State
  const [classroomStatusFilter, setClassroomStatusFilter] = useState('all'); // all, live, scheduled
  const [classroomSubjectFilter, setClassroomSubjectFilter] = useState('all');
  const [classroomSearch, setClassroomSearch] = useState('');

  // History Filter State
  const [historySubjectFilter, setHistorySubjectFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  const handleJoinWithCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setJoinRoomCode(inputCode.trim().toUpperCase());
    setInputCode('');
  };

  // Filtered Classrooms
  const filteredClassrooms = useMemo(() => {
    return mockStudentClassrooms.filter((cls) => {
      const matchStatus =
        classroomStatusFilter === 'all' ||
        (classroomStatusFilter === 'live' && cls.isLive) ||
        (classroomStatusFilter === 'scheduled' && !cls.isLive);

      const matchSubject =
        classroomSubjectFilter === 'all' || cls.subject === classroomSubjectFilter;

      const matchSearch =
        !classroomSearch.trim() ||
        cls.title.toLowerCase().includes(classroomSearch.toLowerCase()) ||
        cls.teacher.toLowerCase().includes(classroomSearch.toLowerCase()) ||
        cls.code.toLowerCase().includes(classroomSearch.toLowerCase());

      return matchStatus && matchSubject && matchSearch;
    });
  }, [classroomStatusFilter, classroomSubjectFilter, classroomSearch]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return mockLearningHistory.filter((item) => {
      const matchSubject =
        historySubjectFilter === 'all' || item.subject === historySubjectFilter;

      const matchSearch =
        !historySearch.trim() ||
        item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.teacher.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.subject.toLowerCase().includes(historySearch.toLowerCase());

      return matchSubject && matchSearch;
    });
  }, [historySubjectFilter, historySearch]);

  // Unique subjects for filters
  const classroomSubjects = useMemo(() => {
    return ['all', ...new Set(mockStudentClassrooms.map((c) => c.subject))];
  }, []);

  const historySubjects = useMemo(() => {
    return ['all', ...new Set(mockLearningHistory.map((h) => h.subject))];
  }, []);

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

      {/* Session Detail Modal (Lịch sử học tập) */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 z-50 bg-pure-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border-[3px] border-pure-black shadow-[8px_8px_0px_#000000] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b-[3px] border-pure-black">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined bg-bright-yellow p-1.5 border-[2px] border-pure-black text-[22px]">
                  psychology
                </span>
                <h3 className="font-headline font-bold text-headline-sm">
                  Chi tiết phân tích buổi học
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionDetail(null)}
                className="w-8 h-8 border-[2px] border-pure-black bg-surface-container flex items-center justify-center font-bold hover:bg-vivid-red hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Session Info */}
            <div className="bg-off-white border-[2px] border-pure-black p-space-md flex flex-col gap-space-xs">
              <div className="flex justify-between items-start">
                <span className="text-label-sm uppercase tracking-wider bg-primary-container px-2 py-0.5 border border-pure-black font-bold">
                  {selectedSessionDetail.subject}
                </span>
                <span className="text-label-sm text-on-surface-variant font-mono">
                  {selectedSessionDetail.date} • {selectedSessionDetail.timeSlot}
                </span>
              </div>
              <h4 className="text-headline-sm font-headline font-bold mt-1">
                {selectedSessionDetail.title}
              </h4>
              <p className="text-body-sm text-on-surface-variant">
                Giáo viên: <strong>{selectedSessionDetail.teacher}</strong>
              </p>
            </div>

            {/* AI Focus Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
              <div className="bg-surface-container-lowest border-[2px] border-pure-black p-3 text-center">
                <span className="text-label-xs uppercase text-on-surface-variant font-bold block">
                  Điểm tập trung AI
                </span>
                <span className="text-headline-md font-bold text-secondary font-headline">
                  {selectedSessionDetail.aiFocusScore}%
                </span>
              </div>
              <div className="bg-surface-container-lowest border-[2px] border-pure-black p-3 text-center">
                <span className="text-label-xs uppercase text-on-surface-variant font-bold block">
                  Thời lượng tham gia
                </span>
                <span className="text-headline-md font-bold text-tertiary font-headline">
                  {selectedSessionDetail.attendedDuration}/{selectedSessionDetail.duration}p
                </span>
              </div>
              <div className="bg-surface-container-lowest border-[2px] border-pure-black p-3 text-center">
                <span className="text-label-xs uppercase text-on-surface-variant font-bold block">
                  Trạng thái
                </span>
                <span className="text-body-md font-bold text-emerald-700 block mt-1">
                  {selectedSessionDetail.attendanceStatus}
                </span>
              </div>
              <div className="bg-surface-container-lowest border-[2px] border-pure-black p-3 text-center">
                <span className="text-label-xs uppercase text-on-surface-variant font-bold block">
                  Mức tương tác
                </span>
                <span className="text-body-md font-bold text-on-surface block mt-1">
                  {selectedSessionDetail.engagementLevel}
                </span>
              </div>
            </div>

            {/* Emotional Distribution Bar */}
            <div className="bg-surface-container-low border-[2px] border-pure-black p-space-md">
              <span className="text-label-sm font-bold uppercase tracking-wider block mb-2">
                Phân bổ cảm xúc phiên học:
              </span>
              <div className="w-full h-6 border-[2px] border-pure-black flex overflow-hidden">
                <div
                  style={{ width: `${selectedSessionDetail.emotionBreakdown.focus}%` }}
                  className="bg-royal-blue text-white text-[11px] font-bold flex items-center justify-center"
                  title={`Tập trung: ${selectedSessionDetail.emotionBreakdown.focus}%`}
                >
                  {selectedSessionDetail.emotionBreakdown.focus}% Tập trung
                </div>
                <div
                  style={{ width: `${selectedSessionDetail.emotionBreakdown.normal}%` }}
                  className="bg-bright-yellow text-pure-black text-[11px] font-bold flex items-center justify-center border-l border-r border-pure-black"
                  title={`Bình thường: ${selectedSessionDetail.emotionBreakdown.normal}%`}
                >
                  {selectedSessionDetail.emotionBreakdown.normal}%
                </div>
                <div
                  style={{ width: `${selectedSessionDetail.emotionBreakdown.distracted}%` }}
                  className="bg-vivid-red text-white text-[11px] font-bold flex items-center justify-center"
                  title={`Xao nhãng: ${selectedSessionDetail.emotionBreakdown.distracted}%`}
                >
                  {selectedSessionDetail.emotionBreakdown.distracted}%
                </div>
              </div>
            </div>

            {/* AI Tutor Feedback */}
            <div className="bg-bright-yellow/20 border-[2px] border-pure-black p-space-md flex gap-space-sm items-start">
              <span className="material-symbols-outlined text-secondary text-[24px]">
                auto_awesome
              </span>
              <div>
                <strong className="text-label-md font-bold block mb-1">
                  Nhận xét &amp; Khuyến nghị từ AI Tutor:
                </strong>
                <p className="text-body-md text-on-surface">
                  {selectedSessionDetail.aiFeedback}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setSelectedSessionDetail(null)}
                className="px-4 py-2 bg-surface-container border-[2px] border-pure-black font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSessionDetail(null);
                  navigate('/bao-cao-cam-xuc');
                }}
                className="px-5 py-2 bg-bright-yellow text-pure-black border-[2px] border-pure-black font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Xem báo cáo cảm xúc đầy đủ ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAB TỔNG QUAN (activeTab === 'dashboard')                              */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col w-full p-gutter md:p-margin gap-space-xl pb-24 animate-fade-in">
          {/* Header Chào Mừng AI Tutor */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-xl gap-space-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none select-none text-bright-yellow">
              <span className="material-symbols-outlined text-[200px]">school</span>
            </div>

            <div className="flex flex-col gap-space-xs z-10">
              <div className="flex items-center gap-space-sm">
                <span className="px-space-sm py-1 bg-bright-yellow text-pure-black text-label-sm font-bold border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  GÓC HỌC TẬP
                </span>
                <span className="text-on-surface-variant text-label-sm font-mono">AI Tutor Trực tuyến</span>
              </div>
              <h1 className="text-headline-xl font-headline font-bold text-on-surface">
                Xin chào, {user?.username || 'Nguyễn Văn An'}! 🎓
              </h1>
              <p className="text-body-lg text-on-surface-variant">
                Trạng thái cảm xúc học tập: <strong className="text-secondary font-bold">Tập trung cao độ (94%)</strong> - AI ghi nhận bạn đang tiếp thu bài học rất hiệu quả.
              </p>
            </div>
            <div className="flex items-center gap-space-md z-10">
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

          {/* Thẻ thống kê nhanh (Grid 4 cột) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
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
                <div className="text-headline-xl font-headline font-bold">3 Lớp</div>
                <div className="text-body-sm text-on-surface-variant mt-space-xs">
                  Tiếp theo: Toán 12A1 lúc 14:00
                </div>
              </div>
            </div>

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
                <div className="text-headline-xl font-headline font-bold text-secondary">92%</div>
                <div className="text-body-sm text-on-surface-variant mt-space-xs">Đánh giá: Tốt ổn định</div>
              </div>
            </div>

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
                className="px-4 py-2.5 bg-surface-container-lowest border-[3px] border-pure-black font-mono font-bold focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] flex-1 md:w-60 uppercase"
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

          {/* Lớp học hôm nay */}
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md font-headline font-bold uppercase tracking-tight flex items-center gap-space-sm">
                <span className="w-4 h-4 bg-vivid-red border-[2px] border-pure-black inline-block" />
                Lớp học hôm nay
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('phong-hoc-cua-toi')}
                className="text-label-sm font-bold text-on-surface underline hover:text-secondary cursor-pointer"
              >
                Xem tất cả thời khóa biểu ➔
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
              {mockStudentClassrooms.slice(0, 3).map((cls) => (
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
                      Môn {cls.subject} • {cls.roomNo}
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
                      {cls.studentsCount} học viên
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
      )}

      {/* ========================================================================= */}
      {/* 2. TAB PHÒNG HỌC CỦA TÔI (activeTab === 'phong-hoc-cua-toi')              */}
      {/* ========================================================================= */}
      {activeTab === 'phong-hoc-cua-toi' && (
        <div className="flex flex-col w-full p-gutter md:p-margin gap-space-xl pb-24 animate-fade-in">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-xl gap-space-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[28px] text-royal-blue">school</span>
                <h1 className="text-headline-xl font-headline font-bold text-on-surface">
                  Phòng học của tôi
                </h1>
              </div>
              <p className="text-body-lg text-on-surface-variant">
                Quản lý các phòng học trực tuyến đang phát (LIVE) và lịch học sắp tới theo thời khóa biểu của bạn.
              </p>
            </div>

            {/* Quick stats for Classrooms */}
            <div className="flex gap-space-sm flex-wrap">
              <div className="px-4 py-2 bg-bright-yellow border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] text-center">
                <span className="text-label-xs uppercase font-bold block">Đang trực tuyến</span>
                <span className="text-headline-sm font-bold">2 Lớp</span>
              </div>
              <div className="px-4 py-2 bg-surface-container border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] text-center">
                <span className="text-label-xs uppercase font-bold block">Sắp diễn ra</span>
                <span className="text-headline-sm font-bold">4 Lớp</span>
              </div>
            </div>
          </div>

          {/* Quick Join Input Box */}
          <div className="bg-surface-container-low border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div>
              <h3 className="font-headline font-bold text-headline-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-royal-blue">vpn_key</span>
                Tham gia phòng bằng mã lớp học
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Nhập mã phòng (vd: MATH12A1) để kết nối trực tiếp vào phòng học của bạn.
              </p>
            </div>
            <form onSubmit={handleJoinWithCode} className="flex gap-space-sm w-full md:w-auto">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 12))}
                placeholder="Nhập mã phòng"
                className="px-4 py-2.5 bg-surface-container-lowest border-[3px] border-pure-black font-mono font-bold focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] flex-1 md:w-60 uppercase"
              />
              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="px-5 py-2.5 bg-bright-yellow text-on-surface font-label-md font-bold border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                Vào ngay
              </button>
            </form>
          </div>

          {/* Controls: Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md bg-surface-container-low border-[3px] border-pure-black p-space-md shadow-[4px_4px_0px_#000000]">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 bg-surface-container border-[2px] border-pure-black p-1">
              <button
                type="button"
                onClick={() => setClassroomStatusFilter('all')}
                className={`px-3 py-1 text-label-sm font-bold transition-all cursor-pointer ${
                  classroomStatusFilter === 'all'
                    ? 'bg-pure-black text-white'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                Tất cả ({mockStudentClassrooms.length})
              </button>
              <button
                type="button"
                onClick={() => setClassroomStatusFilter('live')}
                className={`px-3 py-1 text-label-sm font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  classroomStatusFilter === 'live'
                    ? 'bg-vivid-red text-white'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Đang trực tuyến ({mockStudentClassrooms.filter((c) => c.isLive).length})
              </button>
              <button
                type="button"
                onClick={() => setClassroomStatusFilter('scheduled')}
                className={`px-3 py-1 text-label-sm font-bold transition-all cursor-pointer ${
                  classroomStatusFilter === 'scheduled'
                    ? 'bg-pure-black text-white'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                Sắp diễn ra ({mockStudentClassrooms.filter((c) => !c.isLive).length})
              </button>
            </div>

            {/* Subject Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-space-sm flex-1 md:max-w-md justify-end">
              <select
                value={classroomSubjectFilter}
                onChange={(e) => setClassroomSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-surface-container-lowest border-[2px] border-pure-black text-label-sm font-bold outline-none cursor-pointer"
              >
                <option value="all">Tất cả môn học</option>
                {classroomSubjects
                  .filter((s) => s !== 'all')
                  .map((sub) => (
                    <option key={sub} value={sub}>
                      Môn {sub}
                    </option>
                  ))}
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={classroomSearch}
                  onChange={(e) => setClassroomSearch(e.target.value)}
                  placeholder="Tìm theo môn, bài, GV..."
                  className="w-full px-3 py-2 pl-9 bg-surface-container-lowest border-[2px] border-pure-black text-body-sm font-medium outline-none focus:bg-bright-yellow"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">
                  search
                </span>
              </div>
            </div>
          </div>

          {/* Classrooms Grid */}
          {filteredClassrooms.length === 0 ? (
            <div className="bg-off-white border-[3px] border-pure-black p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                search_off
              </span>
              <h3 className="text-headline-sm font-headline font-bold">
                Không tìm thấy phòng học phù hợp
              </h3>
              <p className="text-body-md text-on-surface-variant max-w-md">
                Không có lớp học nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn. Hãy thử chọn lại môn học hoặc trạng thái.
              </p>
              <button
                type="button"
                onClick={() => {
                  setClassroomStatusFilter('all');
                  setClassroomSubjectFilter('all');
                  setClassroomSearch('');
                }}
                className="mt-2 px-4 py-2 bg-bright-yellow border-[2px] border-pure-black font-bold text-label-md cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
              {filteredClassrooms.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md relative hover:shadow-[6px_6px_0px_#000000] transition-shadow"
                >
                  {/* Status Badge */}
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

                  {/* Header info */}
                  <div className="flex flex-col gap-space-xs pr-36">
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm uppercase tracking-wider bg-primary-container px-2 py-0.5 border border-pure-black font-bold">
                        {cls.subject}
                      </span>
                      <span className="text-label-sm text-on-surface-variant font-mono font-bold">
                        • {cls.roomNo} • Mã: {cls.code}
                      </span>
                    </div>

                    <h3 className="text-headline-md font-headline font-bold mt-1">
                      {cls.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                      {cls.description}
                    </p>
                  </div>

                  {/* Teacher & Schedule info */}
                  <div className="bg-surface-container-low border-[2px] border-pure-black p-space-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-bright-yellow border border-pure-black flex items-center justify-center font-bold text-xs">
                        {cls.teacherAvatar}
                      </div>
                      <span className="text-body-sm font-bold">{cls.teacher}</span>
                    </div>
                    <div className="text-label-sm font-mono font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {cls.startTime} - {cls.endTime}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between pt-space-sm border-t-[2px] border-pure-black">
                    <div className="flex items-center gap-space-xs text-body-sm font-bold">
                      <span className="material-symbols-outlined text-[20px]">group</span>
                      {cls.studentsCount} học viên đã tham gia
                    </div>

                    {cls.isLive ? (
                      <button
                        type="button"
                        onClick={() => setJoinRoomCode(cls.code)}
                        className="bg-bright-yellow text-on-surface font-bold px-space-md py-space-sm border-[3px] border-pure-black shadow-[2px_2px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] transition-all flex items-center gap-space-xs cursor-pointer"
                      >
                        Vào phòng học ngay ➔
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setJoinRoomCode(cls.code)}
                        className="bg-surface-container text-on-surface font-bold px-space-md py-space-sm border-[2px] border-pure-black hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">event</span>
                        Vào phòng chờ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB LỊCH SỬ HỌC TẬP (activeTab === 'lich-su-hoc-tap')                  */}
      {/* ========================================================================= */}
      {activeTab === 'lich-su-hoc-tap' && (
        <div className="flex flex-col w-full p-gutter md:p-margin gap-space-xl pb-24 animate-fade-in">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-xl gap-space-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[28px] text-tertiary">history</span>
                <h1 className="text-headline-xl font-headline font-bold text-on-surface">
                  Lịch sử học tập &amp; Điểm danh
                </h1>
              </div>
              <p className="text-body-lg text-on-surface-variant">
                Theo dõi toàn bộ các buổi học bạn đã hoàn thành, chỉ số tập trung AI ghi nhận và xem chi tiết nhận xét từng tiết học.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/bao-cao-cam-xuc')}
              className="px-space-md py-space-sm bg-bright-yellow text-pure-black border-[3px] border-pure-black font-bold shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              Xem báo cáo cảm xúc tổng thể ➔
            </button>
          </div>

          {/* 4 Thống kê tổng kết tích lũy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
              <div className="flex justify-between items-start">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Số buổi đã học
                </span>
                <span className="material-symbols-outlined bg-primary-container p-2 border-[2px] border-pure-black text-[24px]">
                  menu_book
                </span>
              </div>
              <div>
                <div className="text-headline-xl font-headline font-bold">24 Buổi</div>
                <div className="text-body-sm text-on-surface-variant mt-space-xs">
                  Hoàn thành 100% chỉ tiêu
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
              <div className="flex justify-between items-start">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Tổng thời lượng tích lũy
                </span>
                <span className="material-symbols-outlined bg-tertiary-container text-on-tertiary-container p-2 border-[2px] border-pure-black text-[24px]">
                  timelapse
                </span>
              </div>
              <div>
                <div className="text-headline-xl font-headline font-bold text-tertiary">38.5 Giờ</div>
                <div className="text-body-sm text-on-surface-variant mt-space-xs">
                  Trung bình 1.6 giờ / ngày
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
              <div className="flex justify-between items-start">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Điểm tập trung AI TB
                </span>
                <span className="material-symbols-outlined bg-secondary-container text-on-secondary-container p-2 border-[2px] border-pure-black text-[24px]">
                  insights
                </span>
              </div>
              <div>
                <div className="text-headline-xl font-headline font-bold text-secondary">92.4%</div>
                <div className="text-body-sm text-on-surface-variant mt-space-xs">
                  Xếp loại: Xuất sắc khối
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col justify-between gap-space-md">
              <div className="flex justify-between items-start">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Tỷ lệ chuyên cần
                </span>
                <span className="material-symbols-outlined bg-bright-yellow p-2 border-[2px] border-pure-black text-[24px]">
                  verified
                </span>
              </div>
              <div>
                <div className="text-headline-xl font-headline font-bold">96%</div>
                <div className="text-body-sm text-on-surface-variant mt-space-xs">
                  Có mặt đầy đủ &amp; đúng giờ
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Filter by Subject, Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md bg-surface-container-low border-[3px] border-pure-black p-space-md shadow-[4px_4px_0px_#000000]">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-label-sm font-bold uppercase tracking-wider">Lọc môn:</span>
              <div className="flex flex-wrap gap-1">
                {historySubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setHistorySubjectFilter(sub)}
                    className={`px-3 py-1 text-label-sm font-bold border-[2px] border-pure-black transition-all cursor-pointer ${
                      historySubjectFilter === sub
                        ? 'bg-bright-yellow text-pure-black shadow-[2px_2px_0px_#000000]'
                        : 'bg-surface-container hover:bg-surface-container-high'
                    }`}
                  >
                    {sub === 'all' ? 'Tất cả môn' : sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tìm bài học, giáo viên..."
                className="w-full px-3 py-2 pl-9 bg-surface-container-lowest border-[2px] border-pure-black text-body-sm font-medium outline-none focus:bg-bright-yellow"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">
                search
              </span>
            </div>
          </div>

          {/* Sessions List */}
          {filteredHistory.length === 0 ? (
            <div className="bg-off-white border-[3px] border-pure-black p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                history_toggle_off
              </span>
              <h3 className="text-headline-sm font-headline font-bold">
                Không tìm thấy lịch sử học tập
              </h3>
              <p className="text-body-md text-on-surface-variant max-w-md">
                Không có buổi học nào khớp với điều kiện tìm kiếm của bạn.
              </p>
              <button
                type="button"
                onClick={() => {
                  setHistorySubjectFilter('all');
                  setHistorySearch('');
                }}
                className="mt-2 px-4 py-2 bg-bright-yellow border-[2px] border-pure-black font-bold text-label-md cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-space-md">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-off-white border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md hover:shadow-[6px_6px_0px_#000000] transition-shadow"
                >
                  {/* Left: Info */}
                  <div className="flex flex-col gap-space-xs flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-label-sm uppercase tracking-wider bg-primary-container px-2 py-0.5 border border-pure-black font-bold">
                        {item.subject}
                      </span>
                      <span className="text-label-sm text-on-surface-variant font-mono font-bold">
                        📅 {item.date} • ⏰ {item.timeSlot}
                      </span>
                      <span
                        className={`text-label-xs px-2 py-0.5 border border-pure-black font-bold uppercase ${
                          item.attendanceStatus.includes('Đúng giờ')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.attendanceStatus}
                      </span>
                    </div>

                    <h3 className="text-headline-md font-headline font-bold mt-1">
                      {item.title}
                    </h3>
                    <p className="text-body-md text-on-surface-variant">
                      Giáo viên: <strong>{item.teacher}</strong> • Thời lượng tham gia: <strong>{item.attendedDuration}/{item.duration} phút</strong>
                    </p>
                  </div>

                  {/* Middle: AI Score summary */}
                  <div className="flex items-center gap-space-lg bg-surface-container-low border-[2px] border-pure-black p-space-sm px-space-md w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex flex-col text-center">
                      <span className="text-label-xs uppercase text-on-surface-variant font-bold">
                        Điểm tập trung AI
                      </span>
                      <span className="text-headline-md font-headline font-bold text-secondary">
                        {item.aiFocusScore}%
                      </span>
                    </div>

                    <div className="w-[1px] h-10 bg-pure-black" />

                    <div className="flex flex-col">
                      <span className="text-label-xs uppercase text-on-surface-variant font-bold">
                        Đánh giá
                      </span>
                      <span className="text-label-md font-bold text-on-surface">
                        {item.engagementLevel}
                      </span>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedSessionDetail(item)}
                      className="w-full lg:w-auto px-4 py-2.5 bg-bright-yellow text-pure-black font-bold border-[2px] border-pure-black shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer text-label-md"
                    >
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                      Xem phân tích AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashBoard;
