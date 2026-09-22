import { useEffect, useRef, useState } from 'react';
import Button from '../components/Button';
import useMediaPermissionVersion from '../hooks/useMediaPermissionVersion';
import { isMediaStreamRetained } from '../utils/mediaSession';

const DeviceSelect = ({ icon, label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className="group relative min-w-0 flex-1">
      <Button
        type="default"
        htmlType="button"
        aria-expanded={isOpen}
        aria-label={`Chọn ${label}`}
        onClick={() => setIsOpen((open) => !open)}
        className="!flex !h-[38px] !w-full !cursor-pointer !items-center !justify-start !gap-2 !rounded-full !border !border-[#eadfd4] !bg-[#fffdf9] !px-2.5 !text-left !shadow-none transition-all hover:!-translate-y-0.5 hover:!border-[#c9785f] hover:!shadow-[0_8px_18px_rgba(141,47,21,0.08)]"
      >
        <img src={icon} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#3d302a]">
          {selectedOption?.label || label}
        </span>
        <span className="flex h-full w-3 shrink-0 items-center justify-center" aria-hidden="true">
          <span className={`h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-[#b28d7e] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </Button>
      {isOpen && (
        <div role="listbox" aria-label={`Danh sách ${label}`} className="absolute left-0 top-[44px] z-30 max-h-40 w-full overflow-y-auto rounded-xl border border-[#eadfd4] bg-[#fffdf9] p-1 shadow-[0_12px_24px_rgba(73,45,31,0.16)]">
          {options.map((option) => (
            <Button
              key={option.value || option.label}
              type="text"
              htmlType="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              className={`!flex !h-auto !w-full !justify-start !rounded-lg !px-2 !py-2 !text-left !text-xs !font-medium !shadow-none ${option.value === value ? '!bg-[#eff7ff] !text-[#1e7dff]' : '!text-[#4a3b32] hover:!bg-[#f6efe8]'}`}
            >
              <span className="truncate">{option.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const stopTracks = (stream) => stream?.getTracks().forEach((track) => track.stop());
const isLiveTrack = (track) => track?.readyState !== 'ended';

const Lobby = ({ children, onMediaChange }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaChangeRef = useRef(onMediaChange);
  const cleanupArmedRef = useRef(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState({ mic: '', camera: '', speaker: '' });
  const permissionVersion = useMediaPermissionVersion();
  const [devices, setDevices] = useState({
    mics: [{ value: '', label: 'Đang tải danh sách micro...' }],
    cams: [{ value: '', label: 'Đang tải danh sách camera...' }],
    speakers: [{ value: '', label: 'Đang tải danh sách loa...' }],
  });

  useEffect(() => {
    mediaChangeRef.current = onMediaChange;
  }, [onMediaChange]);

  useEffect(() => {
    let cancelled = false;
    let committed = false;
    let addedStream = null;

    const syncMedia = async () => {
      const currentStream = streamRef.current;
      const currentVideo = currentStream?.getVideoTracks().find(isLiveTrack);
      const currentAudio = currentStream?.getAudioTracks().find(isLiveTrack);
      const currentCameraId = currentVideo?.getSettings?.().deviceId;
      const currentMicId = currentAudio?.getSettings?.().deviceId;
      const needsVideo = isCamOn && (!currentVideo || (selectedDevices.camera && selectedDevices.camera !== 'default' && currentCameraId !== selectedDevices.camera));
      const needsAudio = isMicOn && (!currentAudio || (selectedDevices.mic && selectedDevices.mic !== 'default' && currentMicId !== selectedDevices.mic));

      if (!isCamOn && !isMicOn) {
        if (!isMediaStreamRetained(currentStream)) stopTracks(currentStream);
        streamRef.current = null;
        mediaChangeRef.current?.({ camera: false, mic: false, stream: null, cameraDeviceId: selectedDevices.camera, micDeviceId: selectedDevices.mic, speakerDeviceId: selectedDevices.speaker });
        return;
      }

      try {
        if (needsVideo || needsAudio) {
          addedStream = await navigator.mediaDevices.getUserMedia({
            video: needsVideo ? (selectedDevices.camera ? { deviceId: { exact: selectedDevices.camera } } : true) : false,
            audio: needsAudio ? (selectedDevices.mic ? { deviceId: { exact: selectedDevices.mic } } : true) : false,
          });
        }
        if (cancelled) {
          stopTracks(addedStream);
          return;
        }

        currentStream?.getTracks().forEach((track) => {
          const keepTrack = (track.kind === 'video' && isCamOn && !needsVideo) || (track.kind === 'audio' && isMicOn && !needsAudio);
          if (!keepTrack) track.stop();
        });
        const keptTracks = currentStream?.getTracks().filter((track) => isLiveTrack(track) && (
          (track.kind === 'video' && isCamOn && !needsVideo) || (track.kind === 'audio' && isMicOn && !needsAudio)
        )) || [];
        const nextTracks = [...keptTracks, ...(addedStream?.getTracks() || [])];
        const nextStream = currentStream && !addedStream && keptTracks.length === currentStream.getTracks().length
          ? currentStream
          : new MediaStream(nextTracks);

        streamRef.current = nextStream;
        committed = true;
        mediaChangeRef.current?.({ camera: isCamOn, mic: isMicOn, stream: nextStream, cameraDeviceId: selectedDevices.camera, micDeviceId: selectedDevices.mic, speakerDeviceId: selectedDevices.speaker });
        if (videoRef.current) videoRef.current.srcObject = nextStream;
      } catch {
        if (cancelled) return;
        if (needsVideo && !currentVideo) setIsCamOn(false);
        if (needsAudio && !currentAudio) setIsMicOn(false);
        mediaChangeRef.current?.({
          camera: isCamOn && Boolean(currentVideo),
          mic: isMicOn && Boolean(currentAudio),
          stream: currentStream,
          cameraDeviceId: selectedDevices.camera,
          micDeviceId: selectedDevices.mic,
          speakerDeviceId: selectedDevices.speaker,
        });
      }
    };

    void syncMedia();
    return () => {
      cancelled = true;
      if (!committed) stopTracks(addedStream);
    };
  }, [isCamOn, isMicOn, permissionVersion, selectedDevices.camera, selectedDevices.mic, selectedDevices.speaker]);

  useEffect(() => {
    cleanupArmedRef.current = false;
    const armCleanup = window.setTimeout(() => { cleanupArmedRef.current = true; }, 0);

    return () => {
      window.clearTimeout(armCleanup);
      if (!cleanupArmedRef.current || isMediaStreamRetained(streamRef.current)) return;
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const toOptions = (kind, fallbackLabel) => {
          const options = deviceList
            .filter((device) => device.kind === kind)
            .map((device) => ({ value: device.deviceId, label: device.label || fallbackLabel }));
          return options.length ? options : [{ value: '', label: fallbackLabel }];
        };
        const nextDevices = {
          mics: toOptions('audioinput', 'Microphone mặc định'),
          cams: toOptions('videoinput', 'Camera mặc định'),
          speakers: toOptions('audiooutput', 'Loa mặc định'),
        };
        setDevices(nextDevices);
        setSelectedDevices((current) => ({
          mic: current.mic || nextDevices.mics[0]?.value || '',
          camera: current.camera || nextDevices.cams[0]?.value || '',
          speaker: current.speaker || nextDevices.speakers[0]?.value || '',
        }));
      } catch (error) {
        console.error('Lỗi lấy thiết bị:', error);
      }
    };

    void getDevices();
  }, []);

  return (
    <div className="relative flex w-full max-w-[1128px] flex-col gap-8 overflow-hidden rounded-[28px] border border-white/80 bg-[#fffdfa] px-5 py-4 shadow-[0_24px_70px_rgba(102,46,25,0.13)] md:px-6 md:py-5 lg:flex-row lg:gap-10">
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#f8e7c9]/70" />
      <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-[#f7d9ce]/50" />

      <div className="relative z-10 flex w-full flex-col gap-4 lg:w-[55%]">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[22px] bg-[#211b19] shadow-[0_14px_30px_rgba(48,35,29,0.2)]">
          <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${isCamOn ? '' : 'hidden'}`} />

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
            <Button
              type="default"
              htmlType="button"
              onClick={() => setIsMicOn((enabled) => !enabled)}
              aria-label={isMicOn ? 'Tắt micro' : 'Bật micro'}
              className={`!flex !h-10 !w-12 !rounded-full !border-0 !p-0 !shadow-none ${isMicOn ? '!bg-[#f6c94c]' : '!bg-white/90 hover:!bg-white'}`}
            >
              <img src={isMicOn ? '/micro.png' : '/unmicro.png'} alt="Micro" className="h-4 w-auto object-contain" />
            </Button>
            <Button
              type="default"
              htmlType="button"
              onClick={() => setIsCamOn((enabled) => !enabled)}
              aria-label={isCamOn ? 'Tắt camera' : 'Bật camera'}
              className={`!flex !h-10 !w-12 !rounded-full !border-0 !p-0 !shadow-none ${isCamOn ? '!bg-[#f6c94c]' : '!bg-white/90 hover:!bg-white'}`}
            >
              <img src={isCamOn ? '/camera.png' : '/uncamera.png'} alt="Camera" className="h-4 w-auto object-contain" />
            </Button>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
          <DeviceSelect icon="/micro.png" label="Microphone" options={devices.mics} value={selectedDevices.mic} onChange={(mic) => setSelectedDevices((current) => ({ ...current, mic }))} />
          <DeviceSelect icon="/camera.png" label="Camera" options={devices.cams} value={selectedDevices.camera} onChange={(camera) => setSelectedDevices((current) => ({ ...current, camera }))} />
          <DeviceSelect icon="/speaker.png" label="Loa" options={devices.speakers} value={selectedDevices.speaker} onChange={(speaker) => setSelectedDevices((current) => ({ ...current, speaker }))} />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center rounded-[22px]">
        {children}
      </div>
    </div>
  );
};

export default Lobby;
