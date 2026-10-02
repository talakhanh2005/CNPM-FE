import EmotionPanel from '../components/EmotionPanel';

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
  emotion,
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
          <div className="border-[2px] border-dashed border-pure-black bg-surface-container-low p-5 text-center">
            <span className="material-symbols-outlined text-[40px]">chat_error</span>
            <p className="mt-2 font-bold">Chat chưa được backend hỗ trợ</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Tính năng này sẽ được bật khi có API hoặc WebSocket chat thật.
            </p>
          </div>
        )}

        {activePanel === 'emotion' && (
          <EmotionPanel
            isTeacher={userRole === 'teacher'}
            samples={emotion?.samples}
            latestSample={emotion?.latestSample}
            loading={emotion?.loading}
            error={emotion?.error}
            captureStatus={emotion?.captureStatus}
            onRefresh={emotion?.onRefresh}
          />
        )}

        {activePanel === 'settings' && (
          <div className="space-y-3 text-body-sm">
            <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex justify-between items-center">
              <span className="font-bold">Kết nối realtime</span>
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
              Luồng âm thanh và hình ảnh sử dụng WebRTC native; signaling được điều phối qua WebSocket backend.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default MeetingDialog;
