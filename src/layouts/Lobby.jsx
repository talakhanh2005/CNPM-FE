import { useEffect, useRef, useState } from 'react';
import useMediaPermissionVersion from '../hooks/useMediaPermissionVersion';
import { isMediaStreamRetained } from '../utils/mediaSession';

const stopTracks = (stream) => stream?.getTracks().forEach((track) => track.stop());
const isLiveTrack = (track) => track?.readyState !== 'ended';

const Lobby = ({ children, onMediaChange, roomTitle, roomCode }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaChangeRef = useRef(onMediaChange);
  const cleanupArmedRef = useRef(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState({ mic: '', camera: '', speaker: '' });
  const [audioLevel, setAudioLevel] = useState(false);
  const permissionVersion = useMediaPermissionVersion();
  const [devices, setDevices] = useState({
    mics: [{ value: '', label: 'Đang tải micro...' }],
    cams: [{ value: '', label: 'Đang tải camera...' }],
    speakers: [{ value: '', label: 'Đang tải loa...' }],
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
        mediaChangeRef.current?.({
          camera: false,
          mic: false,
          stream: null,
          cameraDeviceId: selectedDevices.camera,
          micDeviceId: selectedDevices.mic,
          speakerDeviceId: selectedDevices.speaker,
        });
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
        mediaChangeRef.current?.({
          camera: isCamOn,
          mic: isMicOn,
          stream: nextStream,
          cameraDeviceId: selectedDevices.camera,
          micDeviceId: selectedDevices.mic,
          speakerDeviceId: selectedDevices.speaker,
        });
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
    <div className="flex flex-col w-full bg-surface text-on-surface p-2 sm:p-4 font-body">
      {/* Top decorative Neo-Bauhaus geometric header bar */}
      <div className="flex flex-wrap items-center justify-between bg-surface-container-low p-4 mb-6 border-[3px] border-pure-black shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center gap-3">
          {/* Geometric Shapes Accent */}
          <div className="w-5 h-5 bg-vivid-red border-[2px] border-pure-black" />
          <div className="w-5 h-5 rounded-full bg-royal-blue border-[2px] border-pure-black" />
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[18px] border-b-bright-yellow" />
          <span className="font-headline font-bold text-headline-sm tracking-tight text-on-surface uppercase ml-2">
            Phòng Chờ Trực Tuyến // Lớp Học AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 bg-bright-yellow border-[2px] border-pure-black text-label-sm font-bold uppercase shadow-[2px_2px_0px_#000000]">
            Trạng thái: Đã kết nối
          </span>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left Column: Camera Preview & Device Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Video Preview Card */}
          <div className="relative bg-surface-container-lowest border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b-[3px] border-pure-black">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full border-[2px] border-pure-black ${isCamOn ? 'bg-emerald-500 animate-pulse' : 'bg-vivid-red'}`} />
                <span className="font-headline font-bold text-label-lg uppercase">
                  Camera Preview {isCamOn ? 'LIVE' : 'OFF'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCamOn((v) => !v)}
                  className={`px-3 py-1.5 border-[3px] border-pure-black text-label-sm uppercase font-bold transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                    isCamOn
                      ? 'bg-surface-container hover:bg-bright-yellow text-on-surface'
                      : 'bg-vivid-red text-on-error'
                  }`}
                >
                  {isCamOn ? 'Tắt Camera' : 'Bật Camera'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMicOn((v) => !v)}
                  className={`px-3 py-1.5 border-[3px] border-pure-black text-label-sm uppercase font-bold transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
                    isMicOn
                      ? 'bg-surface-container hover:bg-bright-yellow text-on-surface'
                      : 'bg-vivid-red text-on-error'
                  }`}
                >
                  {isMicOn ? 'Tắt Mic' : 'Bật Mic'}
                </button>
              </div>
            </div>

            {/* Camera Frame */}
            <div className="relative w-full aspect-video bg-surface-dim border-[3px] border-pure-black overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCamOn ? 'block' : 'hidden'}`}
              />

              {!isCamOn && (
                <div className="flex flex-col items-center gap-2 text-center p-6 bg-surface-container-low border-[2px] border-pure-black">
                  <div className="w-14 h-14 bg-bright-yellow border-[3px] border-pure-black flex items-center justify-center shadow-[3px_3px_0px_#000000]">
                    <span className="material-symbols-outlined text-[32px] text-pure-black">
                      videocam_off
                    </span>
                  </div>
                  <p className="font-headline font-bold text-headline-sm text-on-surface mt-2">
                    Camera đang tắt
                  </p>
                  <p className="text-body-sm text-on-surface-variant max-w-xs">
                    Nhấn nút "Bật Camera" phía trên để kiểm tra hình ảnh trước khi vào lớp.
                  </p>
                </div>
              )}

              {/* Absolute overlay stream elements */}
              <div className="absolute bottom-3 left-3 bg-pure-black text-on-primary px-3 py-1 text-label-sm font-mono border-[2px] border-pure-black">
                FPS: 60 | 1080p | Ping: 14ms
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 bg-bright-yellow border-[2px] border-pure-black flex items-center justify-center font-bold text-pure-black shadow-[2px_2px_0px_#000000]">
                AI
              </div>
            </div>

            {/* Audio Visualizer Bar */}
            <div className="mt-4 p-3 bg-surface-container-low border-[3px] border-pure-black flex items-center gap-4">
              <span className={`material-symbols-outlined ${isMicOn ? 'text-royal-blue' : 'text-outline'}`}>
                {isMicOn ? 'mic' : 'mic_off'}
              </span>
              <div className="flex-1 flex items-center gap-1.5 h-4">
                <div className={`w-2 h-full border border-pure-black ${isMicOn ? 'bg-royal-blue animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-3/4 border border-pure-black ${isMicOn ? 'bg-royal-blue animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-full border border-pure-black ${isMicOn ? 'bg-royal-blue animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-1/2 border border-pure-black ${isMicOn ? 'bg-bright-yellow animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-5/6 border border-pure-black ${isMicOn ? 'bg-royal-blue animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-full border border-pure-black ${isMicOn ? 'bg-royal-blue animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-1/3 border border-pure-black ${isMicOn ? 'bg-bright-yellow animate-pulse' : 'bg-surface-variant'}`} />
                <div className={`w-2 h-2/3 border border-pure-black ${isMicOn ? 'bg-royal-blue' : 'bg-surface-variant'}`} />
              </div>
              <span className="text-label-sm font-mono font-bold">
                {isMicOn ? '-18dB' : 'Muted'}
              </span>
            </div>
          </div>

          {/* Device Selection Controls */}
          <div className="bg-surface-container-low border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] p-5 flex flex-col gap-4">
            <h3 className="font-headline font-bold text-headline-sm uppercase border-b-[3px] border-pure-black pb-2">
              Cài đặt thiết bị đầu vào
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Camera Select */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm uppercase font-bold text-on-surface-variant">
                  Camera
                </label>
                <select
                  value={selectedDevices.camera}
                  onChange={(e) => setSelectedDevices((prev) => ({ ...prev, camera: e.target.value }))}
                  className="p-2.5 bg-surface border-[3px] border-pure-black font-body-sm focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  {devices.cams.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Micro Select */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm uppercase font-bold text-on-surface-variant">
                  Microphone
                </label>
                <select
                  value={selectedDevices.mic}
                  onChange={(e) => setSelectedDevices((prev) => ({ ...prev, mic: e.target.value }))}
                  className="p-2.5 bg-surface border-[3px] border-pure-black font-body-sm focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  {devices.mics.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Speaker Select */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm uppercase font-bold text-on-surface-variant">
                  Tai nghe / Loa
                </label>
                <select
                  value={selectedDevices.speaker}
                  onChange={(e) => setSelectedDevices((prev) => ({ ...prev, speaker: e.target.value }))}
                  className="p-2.5 bg-surface border-[3px] border-pure-black font-body-sm focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  {devices.speakers.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Test Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAudioLevel(true);
                  setTimeout(() => setAudioLevel(false), 2000);
                }}
                className="px-4 py-2 bg-secondary text-on-secondary border-[3px] border-pure-black font-label-md uppercase shadow-[3px_3px_0px_#000000] hover:bg-secondary-container active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-bold"
              >
                {audioLevel ? 'Micro hoạt động tốt!' : 'Kiểm tra Micro'}
              </button>
              <button
                type="button"
                onClick={() => setIsCamOn(true)}
                className="px-4 py-2 bg-tertiary text-on-tertiary border-[3px] border-pure-black font-label-md uppercase shadow-[3px_3px_0px_#000000] hover:bg-vivid-red active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-bold"
              >
                Thử Camera
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Room Info & AI Status & Children (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Room Info Card */}
          <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 bg-royal-blue text-on-secondary font-label-sm uppercase font-bold border-[2px] border-pure-black inline-block mb-2">
                  Trực tiếp hôm nay
                </span>
                <h2 className="font-headline font-bold text-headline-lg text-on-surface">
                  {roomTitle || 'Phòng học trực tuyến'}
                </h2>
                <p className="font-body-md font-bold text-on-surface-variant">
                  Không gian học tập AI Chuẩn Bauhaus
                </p>
              </div>
              <div className="w-12 h-12 bg-bright-yellow border-[3px] border-pure-black flex items-center justify-center font-headline font-bold text-headline-md shadow-[3px_3px_0px_#000000]">
                AI
              </div>
            </div>

            <div className="border-t-[3px] border-pure-black pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center bg-surface-container-low p-3 border-[2px] border-pure-black">
                <span className="font-label-sm uppercase text-on-surface-variant font-bold">Mã phòng:</span>
                <span className="font-label-lg font-mono bg-bright-yellow px-2 py-0.5 border-[2px] border-pure-black font-bold">
                  {roomCode ? `#${roomCode}` : '#TẠO-MỚI'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-surface-container-low p-3 border-[2px] border-pure-black">
                <span className="font-label-sm uppercase text-on-surface-variant font-bold">Thời gian:</span>
                <span className="font-label-md font-bold">90 phút</span>
              </div>
            </div>
          </div>

          {/* AI Emotion & Readiness Check Card */}
          <div className="bg-primary-container border-[3px] border-pure-black shadow-[6px_6px_0px_#000000] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-headline-sm uppercase text-on-primary-container">
                Trạng thái AI Phân tích
              </h3>
              <span className="material-symbols-outlined text-on-primary-container text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
            </div>
            <div className="bg-surface border-[3px] border-pure-black p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-body-sm font-bold uppercase">Cảm xúc nhận diện:</span>
                <span className="px-2 py-0.5 bg-bright-yellow border-[2px] border-pure-black font-label-sm uppercase font-bold">
                  Tập trung cao
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body-sm font-bold uppercase">Hệ thống trợ lý AI:</span>
                <span className="text-royal-blue font-bold uppercase text-label-sm">
                  Sẵn sàng kích hoạt
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-surface-container border-[2px] border-pure-black h-4 mt-1 overflow-hidden">
                <div className="bg-vivid-red h-full w-[95%] border-r-[2px] border-pure-black" />
              </div>
              <span className="text-right text-label-sm font-mono font-bold">
                Độ sẵn sàng: 95%
              </span>
            </div>
          </div>

          {/* Children: Form / Buttons */}
          <div className="flex flex-col gap-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
