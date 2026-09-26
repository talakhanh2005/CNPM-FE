const dialogTitles = {
  chat: 'Trò chuyện trực tiếp',
  emotion: 'Phân tích AI Cảm xúc',
  settings: 'Cài đặt phòng học',
};

const MeetingDialog = ({
  activePanel,
  isVisible,
  onClose,
  onAnimationEnd,
  userRole,
  connectionStatus,
}) => {
  if (!activePanel) return null;

  return (
    <aside
      onAnimationEnd={onAnimationEnd}
      className={`absolute bottom-20 right-0 top-16 z-30 flex w-[min(380px,100vw)] flex-col bg-off-white border-l-[3px] border-pure-black shadow-[-6px_0px_0px_#000000] text-on-surface ${
        isVisible ? 'meeting-dialog-visible' : 'meeting-dialog-exit'
      }`}
      aria-label={dialogTitles[activePanel]}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b-[3px] border-pure-black px-5 py-4 bg-surface-container">
        <h2 className="m-0 font-headline font-bold text-headline-sm flex items-center gap-2">
          {activePanel === 'chat' && <span className="material-symbols-outlined text-royal-blue">chat</span>}
          {activePanel === 'emotion' && <span className="material-symbols-outlined text-vivid-red" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>}
          {activePanel === 'settings' && <span className="material-symbols-outlined">settings</span>}
          {dialogTitles[activePanel]}
        </h2>
        <button
          type="button"
          onClick={onClose}
          title="Đóng bảng"
          aria-label="Đóng bảng"
          className="w-8 h-8 border-[2px] border-pure-black bg-surface flex items-center justify-center font-bold text-lg hover:bg-bright-yellow cursor-pointer shadow-[2px_2px_0px_#000000]"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5 flex flex-col gap-4 font-body">
        {activePanel === 'chat' && (
          <div className="flex flex-col h-full justify-between gap-4">
            <div className="space-y-3">
              <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-label-sm font-bold text-secondary">Hệ thống AI</span>
                  <span className="text-xs font-mono text-outline">Vừa xong</span>
                </div>
                <p className="text-body-sm text-on-surface">
                  Chào mừng bạn đến với lớp học trực tuyến Neo-Bauhaus. Hãy giữ trật tự và tập trung nghe giảng!
                </p>
              </div>
            </div>

            <div className="border-t-[2px] border-pure-black pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 bg-surface-container-lowest border-[2px] border-pure-black text-body-sm focus:bg-bright-yellow outline-none"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-bright-yellow border-[2px] border-pure-black font-bold text-label-sm shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'emotion' && (
          <div className="space-y-4">
            <div className="bg-primary-container border-[3px] border-pure-black p-4 shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between">
                <span className="text-label-sm font-bold uppercase">Mức độ tập trung</span>
                <span className="font-headline font-bold text-headline-sm text-secondary">92%</span>
              </div>
              <div className="w-full bg-surface-container border-[2px] border-pure-black h-3.5 mt-2 overflow-hidden">
                <div className="bg-secondary h-full w-[92%]" />
              </div>
            </div>

            <div className="bg-surface border-[2px] border-pure-black p-3.5 shadow-[2px_2px_0px_#000000] space-y-2">
              <span className="text-label-sm font-bold uppercase text-on-surface-variant block">
                Phân tích trạng thái
              </span>
              <div className="flex items-center justify-between text-body-sm">
                <span>Cảm xúc thị giác:</span>
                <span className="font-bold text-emerald-600">🟢 Tích cực, chăm chú</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span>Chuyển động đầu:</span>
                <span className="font-bold">Ổn định</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span>Tương tác bài học:</span>
                <span className="font-bold text-secondary">Cao</span>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'settings' && (
          <div className="space-y-3 text-body-sm">
            <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex justify-between items-center">
              <span className="font-bold">Realtime Mock</span>
              <span className="font-mono px-2 py-0.5 bg-bright-yellow border border-pure-black font-bold">
                {connectionStatus}
              </span>
            </div>

            <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex justify-between items-center">
              <span className="font-bold">Vai trò trong phòng</span>
              <span className="font-bold text-secondary">
                {userRole === 'teacher' ? 'Giáo viên (Chủ tọa)' : 'Học sinh'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low border-[2px] border-pure-black text-xs text-on-surface-variant leading-relaxed">
              Luồng âm thanh và hình ảnh sử dụng WebRTC native browser stream. Tín hiệu phòng được điều phối qua WebSocket Mock.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default MeetingDialog;
