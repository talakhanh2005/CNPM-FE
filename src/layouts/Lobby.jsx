import { useEffect, useRef, useState } from 'react';
import useMediaPermissionVersion from '../hooks/useMediaPermissionVersion';
import { isMediaStreamRetained } from '../utils/mediaSession';

const stopTracks = (stream) => stream?.getTracks().forEach((track) => track.stop());
const isLiveTrack = (track) => track?.readyState !== 'ended';
const audioBarFactors = [0.55, 0.75, 0.9, 1, 1, 0.9, 0.75, 0.55];

const Lobby = ({ children, onMediaChange, roomTitle, roomCode, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaChangeRef = useRef(onMediaChange);
  const cleanupArmedRef = useRef(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState({ mic: '', camera: '', speaker: '' });
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraSettings, setCameraSettings] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDb, setAudioDb] = useState(null);
  const permissionVersion = useMediaPermissionVersion();
  const [devices, setDevices] = useState({
    mics: [{ value: '', label: 'Đang tải micro...' }],
    cams: [{ value: '', label: 'Đang tải camera...' }],
    speakers: [{ value: '', label: 'Đang tải loa...' }],
  });

  useEffect(() => {
    mediaChangeRef.current = onMediaChange;
  }, [onMediaChange]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        setMediaStream(null);
        setCameraSettings(null);
        setAudioLevel(0);
        setAudioDb(null);
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
        setMediaStream(nextStream);
        setCameraSettings(isCamOn ? nextStream.getVideoTracks().find(isLiveTrack)?.getSettings?.() || null : null);
        if (!isMicOn) {
          setAudioLevel(0);
          setAudioDb(null);
        }
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
        setMediaStream(currentStream || null);
        setCameraSettings(isCamOn ? currentVideo?.getSettings?.() || null : null);
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
    const audioTrack = isMicOn ? mediaStream?.getAudioTracks().find(isLiveTrack) : null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!audioTrack || !AudioContextClass) return undefined;

    const context = new AudioContextClass();
    const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    void context.resume().catch(() => {});

    const timer = window.setInterval(() => {
      if (audioTrack.readyState === 'ended' || context.state !== 'running') return;
      analyser.getByteTimeDomainData(samples);
      const meanSquare = samples.reduce((sum, sample) => {
        const amplitude = (sample - 128) / 128;
        return sum + amplitude * amplitude;
      }, 0) / samples.length;
      const db = meanSquare > 0 ? 10 * Math.log10(meanSquare) : -Infinity;
      setAudioDb(db);
      setAudioLevel(Math.max(0, Math.min(100, (db + 60) / 60 * 100)));
    }, 100);

    return () => {
      window.clearInterval(timer);
      source.disconnect();
      analyser.disconnect();
      void context.close().catch(() => {});
    };
  }, [isMicOn, mediaStream]);

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
    <div className="flex min-h-0 max-h-full flex-col w-full h-full bg-surface text-on-surface font-body overflow-hidden">
      {/* Top compact Neo-Bauhaus Header */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 border-b-[3px] border-pure-black shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 bg-vivid-red border-[2px] border-pure-black" />
          <div className="w-3.5 h-3.5 rounded-full bg-royal-blue border-[2px] border-pure-black" />
          <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[13px] border-b-role-accent" />
          <span className="font-headline font-bold text-label-lg tracking-tight text-on-surface uppercase ml-1 truncate">
            {roomTitle || 'Phòng Chờ Trực Tuyến // Lớp Học AI'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Đóng phòng chờ (ESC)"
              className="w-8 h-8 bg-surface border-[2px] border-pure-black flex items-center justify-center font-bold text-headline-sm hover:bg-vivid-red hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Container - 2 Columns with internal responsive layout */}
      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-5 flex-1 overflow-y-auto overscroll-contain">
        {/* Left Column: Camera Preview & Quick Device Toggles (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Video Preview Card */}
          <div className="relative bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-3 flex flex-col">
            {/* Header of Video Preview */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-[2px] border-pure-black">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full border-[2px] border-pure-black ${isCamOn ? 'bg-emerald-500 animate-pulse' : 'bg-vivid-red'}`} />
                <span className="font-headline font-bold text-label-md uppercase">
                  Camera Preview {isCamOn ? 'LIVE' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCamOn((v) => !v)}
                  className={`px-2.5 py-1 border-[2px] border-pure-black text-label-xs uppercase font-bold transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1 ${
                    isCamOn
                      ? 'bg-surface-container hover:bg-role-soft text-on-surface'
                      : 'bg-vivid-red text-on-error'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isCamOn ? 'videocam_off' : 'videocam'}
                  </span>
                  <span>{isCamOn ? 'Tắt Cam' : 'Bật Cam'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMicOn((v) => !v)}
                  className={`px-2.5 py-1 border-[2px] border-pure-black text-label-xs uppercase font-bold transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1 ${
                    isMicOn
                      ? 'bg-surface-container hover:bg-role-soft text-on-surface'
                      : 'bg-vivid-red text-on-error'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isMicOn ? 'mic_off' : 'mic'}
                  </span>
                  <span>{isMicOn ? 'Tắt Mic' : 'Bật Mic'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeviceSettings((v) => !v)}
                  className={`p-1 border-[2px] border-pure-black transition-all shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer ${
                    showDeviceSettings ? 'bg-role-accent text-role-contrast' : 'bg-surface hover:bg-surface-container'
                  }`}
                  title="Cài đặt thiết bị"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>
              </div>
            </div>

            {/* Camera Frame (Aspect Video) */}
            <div className="relative w-full aspect-video max-h-[300px] md:max-h-[340px] bg-surface-dim border-[2px] border-pure-black overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCamOn ? 'block' : 'hidden'}`}
              />

              {!isCamOn && (
                <div className="flex flex-col items-center gap-1.5 text-center p-4 bg-surface-container-low border-[2px] border-pure-black max-w-xs">
                  <div className="w-10 h-10 bg-role-accent border-[2px] border-pure-black flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                    <span className="material-symbols-outlined text-[24px] text-role-contrast">
                      videocam_off
                    </span>
                  </div>
                  <p className="font-headline font-bold text-label-md text-on-surface">
                    Camera đang tắt
                  </p>
                  <p className="text-label-xs text-on-surface-variant">
                    Bật camera phía trên để kiểm tra hình ảnh trước khi vào lớp.
                  </p>
                </div>
              )}

              {/* Camera settings reported by the browser */}
              <div className="absolute bottom-2 left-2 bg-pure-black/90 text-on-primary px-2 py-0.5 text-[11px] font-mono border border-pure-black">
                FPS: {cameraSettings?.frameRate ? Math.round(cameraSettings.frameRate) : '--'} | {cameraSettings?.width && cameraSettings?.height ? `${cameraSettings.width}×${cameraSettings.height}` : '--'}
              </div>
            </div>

            {/* Audio Visualizer Bar */}
            <div className="mt-2.5 p-2 bg-surface-container-low border-[2px] border-pure-black flex items-center gap-3">
              <span className={`material-symbols-outlined text-[18px] ${isMicOn ? 'text-role-accent' : 'text-outline'}`}>
                {isMicOn ? 'mic' : 'mic_off'}
              </span>
              <div className="flex-1 flex items-center gap-1 h-3">
                {audioBarFactors.map((factor, index) => (
                  <div
                    key={index}
                    className={`w-1.5 border border-pure-black transition-[height] duration-75 ${isMicOn && audioLevel > 2 ? 'bg-role-accent' : 'bg-surface-variant'}`}
                    style={{ height: `${Math.max(15, isMicOn ? audioLevel * factor : 0)}%` }}
                  />
                ))}
              </div>
              <span className="text-label-xs font-mono font-bold">
                {!isMicOn ? 'Tắt mic' : audioDb === null ? 'Chưa đo được' : audioDb < -60 ? '≤ -60 dBFS' : `${Math.round(audioDb)} dBFS`}
              </span>
            </div>
          </div>

          {/* Collapsible/Compact Device Selectors */}
          {showDeviceSettings && (
            <div className="bg-surface-container-low border-[2px] border-pure-black p-3 flex flex-col gap-2.5 animate-fade-in shadow-[2px_2px_0px_#000000]">
              <div className="flex items-center justify-between pb-1 border-b border-pure-black">
                <span className="text-label-xs font-bold uppercase tracking-wider">Cài đặt thiết bị</span>
                <button
                  type="button"
                  onClick={() => setShowDeviceSettings(false)}
                  className="text-label-xs font-bold underline"
                >
                  Thu gọn
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] uppercase font-bold text-on-surface-variant">Camera</label>
                  <select
                    value={selectedDevices.camera}
                    onChange={(e) => setSelectedDevices((prev) => ({ ...prev, camera: e.target.value }))}
                    className="p-1.5 bg-surface border-[2px] border-pure-black text-label-xs font-medium focus:bg-role-soft outline-none cursor-pointer truncate"
                  >
                    {devices.cams.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] uppercase font-bold text-on-surface-variant">Microphone</label>
                  <select
                    value={selectedDevices.mic}
                    onChange={(e) => setSelectedDevices((prev) => ({ ...prev, mic: e.target.value }))}
                    className="p-1.5 bg-surface border-[2px] border-pure-black text-label-xs font-medium focus:bg-role-soft outline-none cursor-pointer truncate"
                  >
                    {devices.mics.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] uppercase font-bold text-on-surface-variant">Tai nghe / Loa</label>
                  <select
                    value={selectedDevices.speaker}
                    onChange={(e) => setSelectedDevices((prev) => ({ ...prev, speaker: e.target.value }))}
                    className="p-1.5 bg-surface border-[2px] border-pure-black text-label-xs font-medium focus:bg-role-soft outline-none cursor-pointer truncate"
                  >
                    {devices.speakers.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="px-2.5 py-1 bg-role-accent text-role-contrast border-[2px] border-pure-black text-label-xs uppercase font-bold">
                  {!isMicOn ? 'Bật micro để thử' : audioLevel > 8 ? 'Micro đang nhận âm' : 'Hãy nói vào micro'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Room Details & Form controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Header Card: Room info */}
          <div className="bg-surface-container-lowest border-[3px] border-pure-black shadow-[4px_4px_0px_#000000] p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-label-xs uppercase text-on-surface-variant font-bold">Mã phòng:</span>
              <span className="font-label-sm font-mono bg-role-accent text-role-contrast px-2 py-0.5 border-[2px] border-pure-black font-bold">
                {roomCode ? `#${roomCode}` : '#TẠO-MỚI'}
              </span>
            </div>
          </div>

          {/* Children: Form inputs & Action buttons */}
          <div className="flex flex-col flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
