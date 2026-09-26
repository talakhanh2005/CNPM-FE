import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CameraGrid from '../components/CameraGrid';
import MeetingControls from '../components/MeetingControls';
import MeetingDialog from '../layouts/MeetingDialog';
import useAuth from '../hooks/useAuth';
import useWebRTC from '../hooks/useWebRTC';
import useWebSocket from '../hooks/useWebSocket';
import { disconnectRoomOnPageExit, getRoom, leaveRoom } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { takeRetainedMediaStream } from '../utils/mediaSession';

const defaultMediaState = { mic: false, speaker: true, camera: false };

const Meeting = () => {
  const { roomId } = useParams();
  const { state: navigationState } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(() => navigationState?.room || null);
  const [roomLoading, setRoomLoading] = useState(() => !navigationState?.room);
  const initialMediaState = useMemo(() => ({
    camera: navigationState?.media?.camera ?? defaultMediaState.camera,
    mic: navigationState?.media?.mic ?? defaultMediaState.mic,
    speaker: true,
  }), [navigationState?.media?.camera, navigationState?.media?.mic]);
  const cameraDeviceId = navigationState?.media?.cameraDeviceId || '';
  const micDeviceId = navigationState?.media?.micDeviceId || '';
  const speakerDeviceId = navigationState?.media?.speakerDeviceId || '';

  const streamRef = useRef(null);
  const transferredStreamRef = useRef(null);
  const streamCleanupArmedRef = useRef(false);
  const mediaStateRef = useRef(initialMediaState);
  const mediaOperationRef = useRef(Promise.resolve());
  const sendRef = useRef(() => false);
  const hasLeftRoomRef = useRef(false);
  const exitGuardArmedRef = useRef(false);
  const [localStream, setLocalStream] = useState(null);
  const [mediaState, setMediaState] = useState(initialMediaState);
  const [mediaLoading, setMediaLoading] = useState(Boolean(initialMediaState.camera || initialMediaState.mic));
  const [mediaError, setMediaError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [dialogPanel, setDialogPanel] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionSeconds, setSessionSeconds] = useState(125);
  const activeRoomError = roomError || (!roomLoading && !room ? 'Không tìm thấy dữ liệu phòng. Hãy tham gia lại từ trang chủ.' : '');

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    const roomFromNavigation = navigationState?.room;
    if (roomFromNavigation) return undefined;

    let active = true;
    getRoom(roomId)
      .then((nextRoom) => {
        if (active) setRoom(nextRoom);
      })
      .catch((error) => {
        if (active) setRoomError(getApiErrorMessage(error, 'Không thể tải phòng.'));
      })
      .finally(() => {
        if (active) setRoomLoading(false);
      });

    return () => { active = false; };
  }, [navigationState?.room, roomId]);

  useEffect(() => {
    let active = true;
    const transferredStream = transferredStreamRef.current
      || takeRetainedMediaStream(navigationState?.media?.mediaSessionId);

    if (transferredStream) {
      transferredStreamRef.current = transferredStream;
      streamRef.current = transferredStream;
      setLocalStream(transferredStream);
      setMediaLoading(false);
      return () => { active = false; };
    }

    const getMedia = navigator.mediaDevices?.getUserMedia;
    if (!getMedia || (!initialMediaState.camera && !initialMediaState.mic)) {
      return () => { active = false; };
    }

    getMedia({ video: initialMediaState.camera, audio: initialMediaState.mic })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);
        setMediaError('');
      })
      .catch(() => {
        if (active) {
          const disabledMedia = { ...mediaStateRef.current, camera: false, mic: false };
          mediaStateRef.current = disabledMedia;
          setMediaState(disabledMedia);
          setMediaError('Không thể truy cập camera hoặc micro. Bạn vẫn có thể tham gia lớp học.');
        }
      })
      .finally(() => { if (active) setMediaLoading(false); });

    return () => {
      active = false;
    };
  }, [initialMediaState, navigationState?.media?.mediaSessionId]);

  useEffect(() => {
    streamCleanupArmedRef.current = false;
    const armCleanup = window.setTimeout(() => { streamCleanupArmedRef.current = true; }, 0);

    return () => {
      window.clearTimeout(armCleanup);
      if (!streamCleanupArmedRef.current) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const { remoteParticipants, handleEvent } = useWebRTC({
    user,
    localStream,
    mediaState,
    send: (message) => sendRef.current(message),
  });
  const { send, close } = useWebSocket({
    meetingId: room?.id,
    user,
    onEvent: handleEvent,
    onStatus: setConnectionStatus,
  });

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (!room?.id) return undefined;
    exitGuardArmedRef.current = false;
    const armExitGuard = window.setTimeout(() => { exitGuardArmedRef.current = true; }, 0);
    const disconnectOnPageExit = () => {
      if (hasLeftRoomRef.current) return;
      hasLeftRoomRef.current = true;
      close();
      void disconnectRoomOnPageExit(room.id);
    };

    window.addEventListener('pagehide', disconnectOnPageExit);
    return () => {
      window.clearTimeout(armExitGuard);
      window.removeEventListener('pagehide', disconnectOnPageExit);
      if (exitGuardArmedRef.current) disconnectOnPageExit();
    };
  }, [close, room?.id]);

  useEffect(() => {
    if (connectionStatus !== 'connected') return;
    send({
      type: 'media.status',
      payload: { camera: mediaState.camera, mic: mediaState.mic },
    });
  }, [connectionStatus, mediaState.camera, mediaState.mic, send]);

  const applyMediaState = async (targetState) => {
    const currentStream = streamRef.current;
    const currentVideo = currentStream?.getVideoTracks().find((track) => track.readyState !== 'ended');
    const currentAudio = currentStream?.getAudioTracks().find((track) => track.readyState !== 'ended');
    if (currentVideo) currentVideo.enabled = targetState.camera;
    if (currentAudio) currentAudio.enabled = targetState.mic;

    const needsVideo = targetState.camera && !currentVideo;
    const needsAudio = targetState.mic && !currentAudio;
    if (!needsVideo && !needsAudio) return;

    try {
      const addedStream = await navigator.mediaDevices.getUserMedia({
        video: needsVideo ? (cameraDeviceId ? { deviceId: { exact: cameraDeviceId } } : true) : false,
        audio: needsAudio ? (micDeviceId ? { deviceId: { exact: micDeviceId } } : true) : false,
      });
      const latestStream = streamRef.current;
      const existingTracks = latestStream?.getTracks() || [];
      const addedTracks = addedStream.getTracks().filter((track) => !existingTracks.some((existing) => existing.kind === track.kind));
      const nextStream = latestStream
        ? new MediaStream([...existingTracks, ...addedTracks])
        : addedStream;
      nextStream.getVideoTracks().forEach((track) => { track.enabled = targetState.camera; });
      nextStream.getAudioTracks().forEach((track) => { track.enabled = targetState.mic; });
      streamRef.current = nextStream;
      setLocalStream(nextStream);
      setMediaError('');
    } catch {
      const fallbackState = { ...mediaStateRef.current };
      if (needsVideo && !streamRef.current?.getVideoTracks().some((track) => track.readyState !== 'ended')) fallbackState.camera = false;
      if (needsAudio && !streamRef.current?.getAudioTracks().some((track) => track.readyState !== 'ended')) fallbackState.mic = false;
      mediaStateRef.current = fallbackState;
      setMediaState(fallbackState);
      setMediaError('Không thể bật camera hoặc micro. Hãy kiểm tra quyền trình duyệt.');
    }
  };

  const toggleMedia = (type) => {
    if (type === 'speaker') {
      const nextState = { ...mediaStateRef.current, speaker: !mediaStateRef.current.speaker };
      mediaStateRef.current = nextState;
      setMediaState(nextState);
      return;
    }

    const nextState = { ...mediaStateRef.current, [type]: !mediaStateRef.current[type] };
    mediaStateRef.current = nextState;
    setMediaState(nextState);
    if (!navigator.mediaDevices?.getUserMedia) return;
    mediaOperationRef.current = mediaOperationRef.current
      .catch(() => undefined)
      .then(() => applyMediaState(nextState));
  };

  const toggleDialog = (panel) => {
    if (dialogPanel === panel && dialogVisible) {
      setDialogVisible(false);
      return;
    }
    setDialogPanel(panel);
    setDialogVisible(true);
  };

  const handleLeave = async () => {
    if (!room || !window.confirm('Bạn có muốn rời khỏi phòng học không?')) return;
    try {
      setLeaving(true);
      hasLeftRoomRef.current = true;
      await leaveRoom(room.id);
      close();
      navigate('/', { replace: true });
    } catch (error) {
      hasLeftRoomRef.current = false;
      setRoomError(getApiErrorMessage(error, 'Không thể rời phòng.'));
    } finally {
      setLeaving(false);
    }
  };

  const participants = [
    ...remoteParticipants,
    {
      id: user?.id || 'local-user',
      name: user?.username || 'Bạn',
      initials: user?.username?.[0]?.toUpperCase() || 'B',
      isLocal: true,
      stream: localStream,
      cameraOn: mediaState.camera,
    },
  ];

  if (roomLoading && !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface font-body p-6 text-center">
        <div className="bg-surface-container-lowest border-[3px] border-pure-black p-8 shadow-[8px_8px_0px_#000000]">
          <span className="material-symbols-outlined text-[48px] text-bright-yellow animate-spin">
            progress_activity
          </span>
          <p className="mt-4 font-headline font-bold text-headline-sm">Đang tải phòng học...</p>
        </div>
      </main>
    );
  }

  if (activeRoomError && !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface font-body p-6 text-center">
        <div className="bg-surface-container-lowest border-[3px] border-pure-black p-8 shadow-[8px_8px_0px_#000000] max-w-md">
          <span className="material-symbols-outlined text-[48px] text-tertiary">error</span>
          <p className="mt-4 font-headline font-bold text-headline-sm">{activeRoomError}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2.5 bg-bright-yellow font-bold border-[2px] border-pure-black shadow-[3px_3px_0px_#000000]"
          >
            Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-surface font-body text-on-surface">
      {/* Top Header Control Bar */}
      <header className="w-full bg-off-white border-b-[3px] border-pure-black px-4 sm:px-gutter py-2.5 sm:py-3 flex items-center justify-between shadow-[4px_4px_0px_#000000] shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-space-md">
          <div className="bg-primary-container border-[2px] sm:border-[3px] border-pure-black px-2.5 sm:px-space-md py-1 font-headline font-bold text-label-md text-on-primary-container shadow-[2px_2px_0px_#000000] flex items-center gap-1 sm:gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            #{room?.code || roomId}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-surface-container border-[2px] border-pure-black px-3 py-1 font-mono text-label-md text-on-surface shadow-[2px_2px_0px_#000000]">
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <span>{formatTimer(sessionSeconds)}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-bright-yellow border-[2px] border-pure-black px-3 py-1 font-headline text-label-md text-pure-black shadow-[2px_2px_0px_#000000]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>AI Cảm xúc: Đang bật</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-space-md">
          <div className="hidden lg:flex items-center gap-2 bg-surface-container-low border-[2px] border-pure-black px-3 py-1 font-bold text-label-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isTeacher ? 'Chủ tọa (Giáo viên)' : 'Học viên'}</span>
          </div>

          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="px-3.5 py-1.5 bg-vivid-red text-on-error border-[2px] border-pure-black font-headline font-bold text-label-sm uppercase shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* If Teacher: Show live class stats summary row */}
        {isTeacher && (
          <div className="bg-surface-container-low border-b-[2px] border-pure-black px-4 py-2 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-label-sm">
            <div className="flex items-center justify-between p-2 bg-surface-container-lowest border border-pure-black">
              <span className="text-on-surface-variant font-mono">Học sinh:</span>
              <span className="font-bold text-secondary">{participants.length} bạn</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-surface-container-lowest border border-pure-black">
              <span className="text-on-surface-variant font-mono">Tập trung TB:</span>
              <span className="font-bold text-emerald-600">91%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-surface-container-lowest border border-pure-black">
              <span className="text-on-surface-variant font-mono">Cần hỗ trợ:</span>
              <span className="font-bold text-tertiary">0 em</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-surface-container-lowest border border-pure-black">
              <span className="text-on-surface-variant font-mono">AI Realtime:</span>
              <span className="font-bold text-royal-blue uppercase">{connectionStatus}</span>
            </div>
          </div>
        )}

        {/* Video Stage Area */}
        <section
          className={`relative flex min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 transition-[padding] duration-300 ${
            dialogVisible ? 'lg:pr-[390px]' : ''
          }`}
        >
          <CameraGrid
            participants={participants}
            speakerOn={mediaState.speaker}
            speakerDeviceId={speakerDeviceId}
          />

          {mediaLoading && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 z-20 border-[2px] border-pure-black bg-bright-yellow px-4 py-1.5 text-label-sm font-bold text-pure-black shadow-[3px_3px_0px_#000000]">
              Đang chuẩn bị camera và micro...
            </div>
          )}

          {(mediaError || activeRoomError) && !mediaLoading && (
            <div className="absolute bottom-5 left-1/2 max-w-[calc(100%-32px)] -translate-x-1/2 z-20 border-[3px] border-pure-black bg-tertiary-container px-4 py-2 text-center text-body-sm font-bold text-on-tertiary-container shadow-[4px_4px_0px_#000000]">
              {mediaError || activeRoomError}
            </div>
          )}
        </section>

        {/* Dialog Panel (Chat / Emotion / Settings) */}
        <MeetingDialog
          activePanel={dialogPanel}
          isVisible={dialogVisible}
          connectionStatus={connectionStatus}
          userRole={user?.role}
          onClose={() => setDialogVisible(false)}
          onAnimationEnd={() => {
            if (!dialogVisible) setDialogPanel(null);
          }}
        />
      </div>

      {/* Bottom Meeting Control Bar */}
      <MeetingControls
        mediaState={mediaState}
        activeDialog={dialogVisible ? dialogPanel : null}
        onMediaToggle={toggleMedia}
        onDialogToggle={toggleDialog}
        onLeave={handleLeave}
        leaving={leaving}
      />
    </main>
  );
};

export default Meeting;
