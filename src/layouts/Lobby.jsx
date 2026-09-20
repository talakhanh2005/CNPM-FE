import { useState, useRef, useEffect } from 'react';

const Lobby = ({ children }) => {
  const videoRef = useRef(null);

  // State điều khiển bật/tắt
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState(null);

  // State lưu danh sách thiết bị
  const [devices, setDevices] = useState({
    mics: [{ label: 'Đang tải danh sách micro...' }],
    cams: [{ label: 'Đang tải danh sách camera...' }],
    speakers: [{ label: 'Đang tải danh sách loa...' }],
  });

  // Xử lý bật/tắt Camera & Mic
  useEffect(() => {
    const toggleMedia = async () => {
      if (isCamOn) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: isMicOn, 
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (error) {
          console.error('Không thể truy cập camera:', error);
          setIsCamOn(false);
        }
      } else {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      }
    };
    toggleMedia();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isCamOn, isMicOn]);

  // Lấy danh sách thiết bị thật trên máy
  useEffect(() => {
    const getDevices = async () => {
      try {
        const dev = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          mics: dev.filter((d) => d.kind === 'audioinput').map(d => ({ label: d.label || 'Microphone mặc định' })),
          cams: dev.filter((d) => d.kind === 'videoinput').map(d => ({ label: d.label || 'Camera mặc định' })),
          speakers: dev.filter((d) => d.kind === 'audiooutput').map(d => ({ label: d.label || 'Loa mặc định' })),
        });
      } catch (err) {
        console.error('Lỗi lấy thiết bị:', err);
      }
    };
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((s) => { s.getTracks().forEach(t => t.stop()); getDevices(); })
      .catch(getDevices);
  }, []);

  const DeviceSelect = ({ icon, label, options }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="group min-w-0 flex-1">
        <div
          className="flex h-[38px] w-full cursor-pointer items-center gap-2 rounded-full border border-[#eadfd4] bg-[#fffdf9] px-2.5 transition-all hover:-translate-y-0.5 hover:border-[#c9785f] hover:shadow-[0_8px_18px_rgba(141,47,21,0.08)]"
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsOpen((open) => !open);
            }
          }}
        >
        <img src={icon} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[12px] font-semibold text-[#3d302a]">{options[0]?.label || label}</p>
        </div>
        <span className="flex h-full w-3 shrink-0 items-center justify-center" aria-hidden="true">
          <span className={`h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-[#b28d7e] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </div>
    </div>
    );
  };
  return (
    <div className="relative flex w-full max-w-[1128px] flex-col gap-8 overflow-hidden rounded-[28px] border border-white/80 bg-[#fffdfa] px-5 py-4 shadow-[0_24px_70px_rgba(102,46,25,0.13)] md:px-6 md:py-5 lg:flex-row lg:gap-10">
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#f8e7c9]/70" />
      <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-[#f7d9ce]/50" />

      <div className="relative z-10 flex w-full flex-col gap-4 lg:w-[55%]">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[22px] bg-[#211b19] shadow-[0_14px_30px_rgba(48,35,29,0.2)]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted 
            className={`h-full w-full object-cover ${!isCamOn ? 'hidden' : ''}`}
          />
          
          {!isCamOn && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                <img src="/uncamera.png" alt="" className="h-7 w-7 opacity-80" />
              </div>
              <div>
                <p className="m-0 text-[16px] font-bold text-white">Camera đang tắt</p>
                <p className="m-0 mt-1 text-[12px] text-white/50">Bật camera để xem trước hình ảnh</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/15 bg-black/35 p-1.5 backdrop-blur-md">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              aria-label={isMicOn ? 'Tắt micro' : 'Bật micro'}
              className={`flex h-10 w-12 items-center justify-center rounded-full transition-colors ${isMicOn ? 'bg-[#f6c94c]' : 'bg-white/90 hover:bg-white'}`}
            >
              <img src={isMicOn ? '/micro.png' : '/unmicro.png'} alt="Micro" className="h-4 w-auto object-contain" />
            </button>

            <button
              onClick={() => setIsCamOn(!isCamOn)}
              aria-label={isCamOn ? 'Tắt camera' : 'Bật camera'}
              className={`flex h-10 w-12 items-center justify-center rounded-full transition-colors ${isCamOn ? 'bg-[#f6c94c]' : 'bg-white/90 hover:bg-white'}`}
            >
              <img src={isCamOn ? '/camera.png' : '/uncamera.png'} alt="Camera" className="h-4 w-auto object-contain" />
            </button>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
          <DeviceSelect icon="/micro.png" label="Microphone" options={devices.mics} />
          <DeviceSelect icon="/camera.png" label="Camera" options={devices.cams} />
          <DeviceSelect icon="/speaker.png" label="Loa" options={devices.speakers} />
        </div>

      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center rounded-[22px] ">
        {children}
      </div>

    </div>
  );
};

export default Lobby;