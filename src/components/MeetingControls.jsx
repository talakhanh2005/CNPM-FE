const MeetingControls = ({
  mediaState,
  activeDialog,
  onMediaToggle,
  onDialogToggle,
  onLeave,
  leaving = false,
  isTeacher = false,
  isRecording = false,
  onRecordToggle,
}) => {
  return (
    <footer className="h-20 bg-off-white border-t-[3px] border-pure-black shadow-[0px_-4px_0px_#000000] px-gutter flex items-center justify-between shrink-0 z-30">
      {/* Left Media Controls */}
      <div className="flex items-center gap-2 sm:gap-space-sm">
        {/* Mic Button */}
        <button
          type="button"
          onClick={() => onMediaToggle('mic')}
          aria-label={mediaState.mic ? 'Tắt micro' : 'Bật micro'}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all font-headline font-bold text-label-md cursor-pointer ${
            mediaState.mic
              ? 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              : 'bg-vivid-red text-on-error'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {mediaState.mic ? 'mic' : 'mic_off'}
          </span>
          <span className="hidden sm:inline">
            {mediaState.mic ? 'Tắt Mic' : 'Bật Mic'}
          </span>
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={() => onMediaToggle('camera')}
          aria-label={mediaState.camera ? 'Tắt camera' : 'Bật camera'}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all font-headline font-bold text-label-md cursor-pointer ${
            mediaState.camera
              ? 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              : 'bg-vivid-red text-on-error'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {mediaState.camera ? 'videocam' : 'videocam_off'}
          </span>
          <span className="hidden sm:inline">
            {mediaState.camera ? 'Tắt Camera' : 'Bật Camera'}
          </span>
        </button>

        {/* Speaker Button */}
        <button
          type="button"
          onClick={() => onMediaToggle('speaker')}
          aria-label={mediaState.speaker ? 'Tắt loa' : 'Bật loa'}
          className={`hidden md:flex items-center gap-1.5 px-3 py-2 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all font-headline font-bold text-label-md cursor-pointer ${
            mediaState.speaker
              ? 'bg-surface-container text-on-surface'
              : 'bg-surface-variant text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {mediaState.speaker ? 'volume_up' : 'volume_off'}
          </span>
          <span>{mediaState.speaker ? 'Loa: Bật' : 'Loa: Tắt'}</span>
        </button>

        {/* Teacher Record Button */}
        {isTeacher && (
          <button
            type="button"
            onClick={onRecordToggle}
            aria-label={isRecording ? 'Dừng ghi hình' : 'Bắt đầu ghi hình'}
            className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all font-headline font-bold text-label-md cursor-pointer ${
              isRecording
                ? 'bg-vivid-red text-white animate-pulse'
                : 'bg-bright-yellow text-pure-black hover:bg-yellow-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isRecording ? 'stop_circle' : 'fiber_manual_record'}
            </span>
            <span className="hidden sm:inline">
              {isRecording ? 'Dừng Ghi hình' : 'Ghi hình (AI)'}
            </span>
          </button>
        )}
      </div>

      {/* Center / Right Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-space-sm">
        {/* Chat Toggle */}
        <button
          type="button"
          onClick={() => onDialogToggle('chat')}
          aria-label="Trò chuyện"
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] transition-all font-headline font-bold text-label-md cursor-pointer ${
            activeDialog === 'chat'
              ? 'bg-bright-yellow text-on-surface translate-x-0.5 translate-y-0.5 shadow-none'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          <span className="hidden sm:inline">Trò chuyện</span>
        </button>

        {/* AI Emotion Panel Toggle */}
        <button
          type="button"
          onClick={() => onDialogToggle('emotion')}
          aria-label="Phân tích cảm xúc"
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] transition-all font-headline font-bold text-label-md cursor-pointer ${
            activeDialog === 'emotion'
              ? 'bg-bright-yellow text-on-surface translate-x-0.5 translate-y-0.5 shadow-none'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            psychology
          </span>
          <span className="hidden sm:inline">AI Cảm xúc</span>
        </button>

        {/* Settings Toggle */}
        <button
          type="button"
          onClick={() => onDialogToggle('settings')}
          aria-label="Cài đặt"
          className={`p-2 sm:p-2.5 border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] transition-all cursor-pointer ${
            activeDialog === 'settings'
              ? 'bg-bright-yellow text-on-surface translate-x-0.5 translate-y-0.5 shadow-none'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        {/* Leave Room Button */}
        <button
          type="button"
          disabled={leaving}
          onClick={onLeave}
          className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-vivid-red text-on-error hover:bg-error border-[3px] border-pure-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all font-headline font-bold text-label-md uppercase cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>{leaving ? 'Đang thoát...' : 'Rời phòng'}</span>
        </button>
      </div>
    </footer>
  );
};

export default MeetingControls;
