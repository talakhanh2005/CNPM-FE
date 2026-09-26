import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

const timelineData = [
  { time: '00m', focus: 75, happy: 15, tired: 10, distracted: 0 },
  { time: '15m', focus: 65, happy: 30, tired: 5, distracted: 0 },
  { time: '30m', focus: 65, happy: 10, tired: 0, distracted: 25 },
  { time: '45m', focus: 40, happy: 0, tired: 20, distracted: 40 },
  { time: '60m', focus: 60, happy: 30, tired: 0, distracted: 10 },
  { time: '75m', focus: 70, happy: 15, tired: 15, distracted: 0 },
  { time: '90m', focus: 50, happy: 45, tired: 5, distracted: 0 },
];

const studentsReport = [
  {
    initials: 'NA',
    name: 'Nguyễn An',
    color: 'bg-primary-fixed',
    attendance: '90/90 phút (100%)',
    focus: 80,
    happy: 15,
    distracted: 5,
    statusText: 'Tập trung cao độ',
    notes: 'Hoàn thành tốt tất cả bài tập trắc nghiệm và câu hỏi mở rộng.',
  },
  {
    initials: 'TB',
    name: 'Trần Bình',
    color: 'bg-secondary-fixed text-on-secondary',
    attendance: '85/90 phút (94%)',
    focus: 50,
    happy: 30,
    tired: 20,
    statusText: 'Hơi mệt ở cuối giờ',
    notes: 'Đã được AI nhắc nhở tập trung lúc phút thứ 50, sau đó hồi phục tốt.',
  },
  {
    initials: 'LH',
    name: 'Lê Hoàng',
    color: 'bg-tertiary-fixed',
    attendance: '90/90 phút (100%)',
    focus: 70,
    happy: 25,
    distracted: 5,
    statusText: 'Tích cực phát biểu',
    notes: 'Dẫn đầu bảng xếp hạng mini-game và chủ động tương tác với giáo viên.',
  },
  {
    initials: 'PM',
    name: 'Phạm Mai',
    color: 'bg-surface-container-highest',
    attendance: '78/90 phút (86%)',
    focus: 40,
    happy: 20,
    tired: 40,
    statusText: 'Mất tập trung giữa giờ',
    notes: 'Cần phụ đạo thêm phần phương pháp giải bài tập hình học không gian.',
  },
];

const EmotionReport = () => {
  const location = useLocation();
  const meeting = location.state?.meeting;
  const [search, setSearch] = useState('');

  const className = meeting?.name || 'Toán 12A1 - Ôn thi đại học';
  const roomCode = meeting?.code || 'ML-8842';
  const isBatch = meeting ? meeting.analysisMode === 'batch' : true;
  const duration = meeting?.durationMinutes ? `${meeting.durationMinutes} phút` : '90 phút';
  const createdDate = meeting?.createdAt
    ? new Date(meeting.createdAt).toLocaleDateString('vi-VN')
    : '24/05/2024';

  const filteredStudents = studentsReport.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout activeTab="bao-cao-cam-xuc">
      <div className="flex flex-col w-full max-w-7xl mx-auto p-gutter md:p-margin pb-24 font-body">
        {/* Header Session Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl border-b-[3px] border-pure-black pb-space-lg">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs flex-wrap">
              <span className="px-2.5 py-0.5 bg-primary text-on-primary text-label-sm font-bold uppercase border border-pure-black">
                Báo cáo sau buổi học
              </span>
              {isBatch ? (
                <span className="px-2.5 py-0.5 bg-royal-blue text-white text-label-sm font-bold border border-pure-black flex items-center gap-1 shadow-[1px_1px_0px_#000000]">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  AI đánh giá sau (Video Recording)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-bright-yellow text-pure-black text-label-sm font-bold border border-pure-black flex items-center gap-1 shadow-[1px_1px_0px_#000000]">
                  <span className="material-symbols-outlined text-[14px]">speed</span>
                  Phân tích Realtime
                </span>
              )}
              <span className="text-body-sm text-on-surface-variant font-mono font-bold">
                Ngày {createdDate}
              </span>
            </div>
            <h1 className="text-headline-lg font-headline font-bold text-on-surface tracking-tight">
              {className}
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Thời lượng: <strong className="text-on-surface font-bold">{duration}</strong> | Phòng học:{' '}
              <strong className="text-on-surface font-mono font-bold">#{roomCode}</strong> | Giáo viên:{' '}
              <strong className="text-on-surface font-bold">Thầy Hoàng (Giáo viên)</strong>
            </p>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              type="button"
              onClick={() => alert('Đã sao chép liên kết báo cáo vào bộ nhớ tạm!')}
              className="px-space-md py-space-sm bg-surface-container border-[3px] border-pure-black text-on-surface font-label-md font-bold shadow-[4px_4px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-space-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              Chia sẻ báo cáo
            </button>
            <button
              type="button"
              onClick={() => alert('Đang tạo file PDF báo cáo buổi học...')}
              className="px-space-md py-space-sm bg-bright-yellow text-pure-black border-[3px] border-pure-black font-label-md font-bold shadow-[4px_4px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-space-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Xuất PDF / Excel
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
          {/* Card 1 */}
          <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">groups</span>
            </div>
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Tổng số học sinh
            </span>
            <div className="flex items-baseline gap-space-sm mt-space-xs">
              <span className="text-headline-xl font-headline font-bold text-on-surface">42</span>
              <span className="text-body-sm text-secondary font-bold bg-secondary-fixed px-1.5 py-0.5 border border-pure-black">
                100% có mặt
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-space-sm">
              Không có học sinh vắng mặt hoặc bỏ tiết giữa chừng.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">psychology</span>
            </div>
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Tỉ lệ tập trung trung bình
            </span>
            <div className="flex items-baseline gap-space-sm mt-space-xs">
              <span className="text-headline-xl font-headline font-bold text-on-surface">84%</span>
              <span className="text-body-sm text-pure-black font-bold bg-bright-yellow px-1.5 py-0.5 border border-pure-black">
                +5.2% so với buổi trước
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-3 mt-space-sm border-[2px] border-pure-black overflow-hidden">
              <div className="bg-bright-yellow h-full w-[84%] border-r-[2px] border-pure-black" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">sentiment_satisfied</span>
            </div>
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Cảm xúc chủ đạo
            </span>
            <div className="flex items-center gap-space-sm mt-space-xs">
              <span className="text-headline-md font-headline font-bold text-on-surface">
                Tập trung &amp; Vui vẻ
              </span>
            </div>
            <div className="flex items-center gap-2 mt-space-md">
              <span className="px-2 py-0.5 bg-royal-blue text-on-primary text-label-sm font-bold border border-pure-black">
                Tập trung (65%)
              </span>
              <span className="px-2 py-0.5 bg-bright-yellow text-on-surface text-label-sm font-bold border border-pure-black">
                Vui vẻ (25%)
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg mb-space-xl">
          {/* Timeline Bar Chart */}
          <div className="lg:col-span-2 bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                <div>
                  <h2 className="text-headline-sm font-headline font-bold text-on-surface">
                    Biểu đồ diễn biến cảm xúc theo thời gian
                  </h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Phân tích trạng thái học sinh qua các mốc 15 phút của buổi học
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-label-sm font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-bright-yellow inline-block border border-pure-black" />{' '}
                    Vui
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-royal-blue inline-block border border-pure-black" />{' '}
                    Tập trung
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-vivid-red inline-block border border-pure-black" />{' '}
                    Mệt mỏi
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-[#888888] inline-block border border-pure-black" />{' '}
                    Mất tập trung
                  </span>
                </div>
              </div>

              {/* Stacked Chart Canvas */}
              <div className="w-full h-64 bg-surface-bright border-[2px] border-pure-black p-4 flex flex-col justify-end relative my-space-md">
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                  <div className="w-full border-b border-dashed border-pure-black" />
                  <div className="w-full border-b border-dashed border-pure-black" />
                  <div className="w-full border-b border-dashed border-pure-black" />
                  <div className="w-full border-b border-dashed border-pure-black" />
                </div>

                <div className="flex items-end justify-between h-48 gap-3 z-10">
                  {timelineData.map((slot) => (
                    <div
                      key={slot.time}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end group"
                    >
                      <div className="w-full flex flex-col h-full justify-end gap-0.5 border-[2px] border-pure-black bg-surface overflow-hidden shadow-xs">
                        {slot.distracted > 0 && (
                          <div className="bg-[#888888] w-full" style={{ height: `${slot.distracted}%` }} />
                        )}
                        {slot.tired > 0 && (
                          <div className="bg-vivid-red w-full" style={{ height: `${slot.tired}%` }} />
                        )}
                        {slot.happy > 0 && (
                          <div className="bg-bright-yellow w-full" style={{ height: `${slot.happy}%` }} />
                        )}
                        {slot.focus > 0 && (
                          <div className="bg-royal-blue w-full" style={{ height: `${slot.focus}%` }} />
                        )}
                      </div>
                      <span className="text-label-sm font-mono font-bold mt-1">{slot.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="bg-primary-container p-3 border-[2px] border-pure-black text-on-primary-container text-body-sm flex items-center gap-space-sm mt-space-md">
              <span className="material-symbols-outlined text-[24px]">lightbulb</span>
              <span>
                <strong>Nhận xét AI:</strong> Mức độ tập trung giảm nhẹ ở phút thứ 45 do bài tập khó. Học sinh nhanh chóng lấy lại trạng thái tập trung cao nhờ bài tập tương tác sau đó.
              </span>
            </div>
          </div>

          {/* Overall Emotion Distribution */}
          <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            <div>
              <h2 className="text-headline-sm font-headline font-bold text-on-surface mb-space-xs">
                Phân bổ cảm xúc tổng thể
              </h2>
              <p className="text-body-sm text-on-surface-variant mb-space-lg">
                Tỉ lệ phần trăm thời gian hiển thị trên toàn buổi học
              </p>
              <div className="space-y-space-md">
                <div>
                  <div className="flex justify-between text-label-md font-bold mb-1">
                    <span>Tập trung</span>
                    <span className="text-royal-blue">65%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-4 border-[2px] border-pure-black p-0.5">
                    <div className="bg-royal-blue h-full w-[65%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-md font-bold mb-1">
                    <span>Vui vẻ</span>
                    <span className="text-pure-black">20%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-4 border-[2px] border-pure-black p-0.5">
                    <div className="bg-bright-yellow h-full w-[20%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-md font-bold mb-1">
                    <span>Mệt mỏi</span>
                    <span className="text-vivid-red">10%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-4 border-[2px] border-pure-black p-0.5">
                    <div className="bg-vivid-red h-full w-[10%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-md font-bold mb-1">
                    <span>Mất tập trung</span>
                    <span className="text-on-surface-variant">5%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-4 border-[2px] border-pure-black p-0.5">
                    <div className="bg-[#888888] h-full w-[5%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-space-lg pt-space-md border-t-2 border-pure-black">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface-variant font-bold">Chỉ số tương tác AI:</span>
                <strong className="text-on-surface font-headline font-bold text-headline-sm">
                  9.2 / 10
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-surface-container-low border-[3px] border-pure-black p-space-lg shadow-[4px_4px_0px_#000000]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
            <div>
              <h2 className="text-headline-sm font-headline font-bold text-on-surface">
                Bảng chi tiết học sinh
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Thống kê mức độ tham gia và cảm xúc của từng cá nhân (42 học sinh)
              </p>
            </div>
            <div className="flex items-center gap-space-sm">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-space-md py-2 bg-surface border-[2px] border-pure-black text-body-sm outline-none focus:bg-bright-yellow shadow-[2px_2px_0px_#000000]"
                placeholder="Tìm kiếm học sinh..."
                type="text"
              />
            </div>
          </div>

          <div className="overflow-x-auto border-[2px] border-pure-black">
            <table className="w-full text-left border-collapse bg-surface-bright">
              <thead>
                <tr className="bg-surface-container border-b-[2px] border-pure-black text-label-md font-bold">
                  <th className="p-space-md border-r border-pure-black">Học sinh</th>
                  <th className="p-space-md border-r border-pure-black">Thời gian có mặt</th>
                  <th className="p-space-md border-r border-pure-black">Thanh cảm xúc chủ đạo</th>
                  <th className="p-space-md">Ghi chú AI / Giáo viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pure-black text-body-sm">
                {filteredStudents.map((st, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-space-md border-r border-pure-black font-bold flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full border border-pure-black flex items-center justify-center text-label-sm font-bold ${st.color}`}
                      >
                        {st.initials}
                      </div>
                      {st.name}
                    </td>
                    <td className="p-space-md border-r border-pure-black font-mono font-bold">
                      {st.attendance}
                    </td>
                    <td className="p-space-md border-r border-pure-black min-w-[200px]">
                      <div className="w-full bg-surface-container h-3 border border-pure-black flex overflow-hidden">
                        <div className="bg-royal-blue" style={{ width: `${st.focus}%` }} />
                        <div className="bg-bright-yellow" style={{ width: `${st.happy}%` }} />
                        {st.tired && <div className="bg-vivid-red" style={{ width: `${st.tired}%` }} />}
                        {st.distracted && (
                          <div className="bg-[#888888]" style={{ width: `${st.distracted}%` }} />
                        )}
                      </div>
                      <span className="text-label-sm text-on-surface-variant font-bold mt-1 block">
                        {st.statusText}
                      </span>
                    </td>
                    <td className="p-space-md text-on-surface-variant">{st.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmotionReport;
