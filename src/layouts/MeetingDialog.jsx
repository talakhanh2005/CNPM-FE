import EmotionPanel from '../components/EmotionPanel';
import MeetingMaterials from '../components/MeetingMaterials';
import RecordingStatus from '../components/RecordingStatus';

const connectionLabels = {
  connecting: 'Đang kết nối',
  reconnecting: 'Đang kết nối lại',
  connected: 'Đã kết nối',
  error: 'Mất kết nối',
  failed: 'Mất kết nối',
  closed: 'Đã ngắt kết nối',
};

const dialogTitles = {
  chat: 'Trò chuyện trực tiếp',
  emotion: 'Phân tích AI Cảm xúc',
  materials: 'Tài liệu học tập',
  settings: 'Cài đặt phòng học',
};

const MeetingDialog = ({
  activePanel,
  isVisible,
  onClose,
  onAnimationEnd,
  userRole,
  connectionStatus,
  meetingId,
  participants = [],
  recordings,
  recordingStatuses,
  recordingParticipants,
  recordingBusy,
  recordingError,
  recordingNeedsUpload,
  emotionPanelEnabled = true,
  presentingMaterialId,
  presentationBusyId,
  onPresentMaterial,
  onAnalyzeRecording,
  onPlaybackRecording,
  onRetryRecordingUpload,
  onDownloadPendingRecording,
}) => {
  if (
    !activePanel
    || (activePanel === 'emotion' && (userRole !== 'teacher' || !emotionPanelEnabled))
  ) return null;

  return (
    <aside
      onAnimationEnd={onAnimationEnd}
      className={`absolute inset-y-0 right-0 z-30 flex w-[min(380px,100vw)] flex-col border-l border-pure-black bg-off-white text-on-surface ${
        isVisible ? 'meeting-dialog-visible' : 'meeting-dialog-exit'
      }`}
      aria-label={dialogTitles[activePanel]}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b-[3px] border-pure-black px-5 py-4 bg-surface-container">
        <h2 className="m-0 font-headline font-bold text-headline-sm flex items-center gap-2">
          {activePanel === 'chat' && <span className="material-symbols-outlined text-role-accent">chat</span>}
          {activePanel === 'emotion' && <span className="material-symbols-outlined text-vivid-red" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>}
          {activePanel === 'materials' && <span className="material-symbols-outlined text-role-accent">folder_open</span>}
          {activePanel === 'settings' && <span className="material-symbols-outlined">settings</span>}
          {dialogTitles[activePanel]}
        </h2>
        <button
          type="button"
          onClick={onClose}
          title="Đóng bảng"
          aria-label="Đóng bảng"
          className="w-8 h-8 border-[2px] border-pure-black bg-surface flex items-center justify-center font-bold text-lg hover:bg-role-soft cursor-pointer shadow-[2px_2px_0px_#000000]"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5 flex flex-col gap-4 font-body">
        {activePanel === 'chat' && (
          <div className="flex h-full flex-col justify-end">
            <div className="border-t-[2px] border-pure-black pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 bg-surface-container-lowest border-[2px] border-pure-black text-body-sm focus:bg-role-soft outline-none"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-role-accent text-role-contrast border-[2px] border-pure-black font-bold text-label-sm shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'emotion' && <EmotionPanel participants={participants} />}

        {activePanel === 'materials' && (
          <MeetingMaterials
            meetingId={meetingId}
            isTeacher={userRole === 'teacher'}
            presentingMaterialId={presentingMaterialId}
            presentationBusyId={presentationBusyId}
            onPresent={onPresentMaterial}
          />
        )}

        {activePanel === 'settings' && (
          <div className="space-y-3 text-body-sm">
            <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex justify-between items-center">
              <span className="font-bold">Kết nối phòng học</span>
              <span className="font-mono px-2 py-0.5 bg-role-accent text-role-contrast border border-pure-black font-bold">
                {connectionLabels[connectionStatus] || 'Chưa xác định'}
              </span>
            </div>

            <div className="bg-surface border-[2px] border-pure-black p-3 shadow-[2px_2px_0px_#000000] flex justify-between items-center">
              <span className="font-bold">Vai trò trong phòng</span>
              <span className="font-bold text-role-accent">
                {userRole === 'teacher' ? 'Giáo viên (Chủ tọa)' : 'Học sinh'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low border-[2px] border-pure-black text-xs text-on-surface-variant leading-relaxed">
              Nếu kết nối bị gián đoạn, phòng học sẽ tự thử kết nối lại.
            </div>

            {userRole === 'teacher' && (
              <RecordingStatus
                recordings={recordings}
                statuses={recordingStatuses}
                participants={recordingParticipants}
                busy={recordingBusy}
                error={recordingError}
                needsUpload={recordingNeedsUpload}
                onAnalyze={onAnalyzeRecording}
                onPlayback={onPlaybackRecording}
                onRetryUpload={onRetryRecordingUpload}
                onDownloadPending={onDownloadPendingRecording}
              />
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default MeetingDialog;
