import Button from './Button';

const mediaControls = {
  mic: { on: '/whitemicro.png', off: '/unmicro.png', label: 'micro' },
  speaker: { on: '/whitespeaker.png', off: '/unspeaker.png', label: 'loa' },
  camera: { on: '/whitecamera.png', off: '/uncamera.png', label: 'camera' },
};

const dialogControls = [
  ['chat', '/whitechat.png', 'Hộp thoại chat'],
  ['emotion', '/whitesmiley.png', 'Log phân tích cảm xúc'],
  ['settings', '/whitesetting.png', 'Cài đặt meeting'],
];

const MeetingControls = ({ mediaState, activeDialog, onMediaToggle, onDialogToggle, onLeave, leaving = false }) => (
  <footer className="relative flex min-h-[112px] shrink-0 flex-col items-center justify-center gap-3 px-4 py-4 sm:h-[88px] sm:min-h-0 sm:flex-row sm:gap-3 sm:px-8 sm:py-0">
    <div className="order-2 flex gap-2 text-[#aeb3c0] sm:absolute sm:right-8 sm:order-2 sm:gap-3">
      {dialogControls.map(([key, icon, label]) => (
        <Button
          key={key}
          type="text"
          htmlType="button"
          onClick={() => onDialogToggle(key)}
          title={label}
          aria-label={label}
          className={`!h-11 !w-11 !rounded-full !border-0 !bg-transparent !p-0 !shadow-none hover:!bg-transparent hover:!text-white sm:!h-12 sm:!w-12 ${activeDialog === key ? '!text-white' : '!text-[#aeb3c0]'}`}
        >
          <img src={icon} alt="" className="h-5 w-5 object-contain sm:h-6 sm:w-6" />
        </Button>
      ))}
    </div>

    <div className="order-1 flex flex-wrap justify-center gap-2 sm:order-2 sm:gap-3">
      {Object.entries(mediaControls).map(([type, control]) => {
        const enabled = mediaState[type];
        const label = `${enabled ? 'Tắt' : 'Bật'} ${control.label}`;

        return (
          <Button
            key={type}
            type="default"
            htmlType="button"
            onClick={() => onMediaToggle(type)}
            title={label}
            aria-label={label}
            className={`!h-11 !w-11 !rounded-full !border-0 !p-0 !shadow-none sm:!h-12 sm:!w-12 ${enabled ? '!bg-[#3d3d45] hover:!bg-[#50515a]' : '!bg-white hover:!bg-[#f2f2f2]'}`}
          >
            <img src={enabled ? control.on : control.off} alt="" className="h-5 w-5 object-contain sm:h-6 sm:w-6" />
          </Button>
        );
      })}

      <Button
        type="default"
        htmlType="button"
        onClick={onLeave}
        loading={leaving}
        disabled={leaving}
        title="Rời cuộc họp"
        aria-label="Kết thúc cuộc gọi"
        className="!h-11 !w-[76px] !rounded-full !border-0 !bg-[#f01818] !p-0 !shadow-none hover:!bg-[#d91515] sm:!h-12 sm:!w-[90px]"
      >
        <img src="/whitehangup.png" alt="" className="h-5 w-5 object-contain sm:h-6 sm:w-6" />
      </Button>
    </div>
  </footer>
);

export default MeetingControls;
