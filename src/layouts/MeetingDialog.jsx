import Button from '../components/Button';

const dialogTitles = {
  chat: 'Hộp thoại chat',
  emotion: 'Phân tích cảm xúc',
  settings: 'Cài đặt meeting',
};

const MeetingDialog = ({ activePanel, isVisible, onClose, onAnimationEnd, userRole, connectionStatus }) => {
  if (!activePanel) return null;

  return (
    <aside onAnimationEnd={onAnimationEnd} className={`meeting-dialog absolute bottom-[104px] right-6 top-16 z-30 flex w-[min(360px,calc(100vw-48px))] flex-col overflow-hidden rounded-[16px] bg-[#292b30] text-[#f0f2f7] shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${isVisible ? 'meeting-dialog-visible' : 'meeting-dialog-exit'}`} aria-label={dialogTitles[activePanel]}>
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="m-0 text-[18px] font-bold">{dialogTitles[activePanel]}</h2>
        <Button type="text" htmlType="button" onClick={onClose} title="Đóng bảng" aria-label="Đóng bảng" className="!h-8 !w-8 !rounded-full !border-0 !p-0 !text-xl !text-white/60 !shadow-none hover:!bg-white/10 hover:!text-white">×</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {activePanel === 'chat' && <p className="m-0 text-sm leading-6 text-[#d7d9df]">Giao diện chat đang được giữ sẵn; chưa có API chat nên chưa kết nối dữ liệu.</p>}
        {activePanel === 'emotion' && <p className="m-0 text-sm leading-6 text-[#d7d9df]">Giao diện phân tích cảm xúc được giữ lại. Chức năng này chưa nằm trong mock API nên không gửi dữ liệu giả.</p>}
        {activePanel === 'settings' && (
          <div className="space-y-4 text-sm text-[#d7d9df]">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>Realtime mock</span><span className="font-semibold text-[#86c5ff]">{connectionStatus}</span></div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>Vai trò</span><span className="font-semibold">{userRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span></div>
            <p className="m-0 text-xs leading-5 text-white/50">Camera và micro dùng WebRTC browser API; signaling dùng mock realtime transport.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default MeetingDialog;
