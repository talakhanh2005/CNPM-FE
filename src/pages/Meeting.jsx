import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
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
  const activeRoomError = roomError || (!roomLoading && !room ? 'Không tìm thấy dữ liệu phòng. Hãy tham gia lại từ trang chủ.' : '');

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
          setMediaError('Không thể truy cập camera hoặc micro. Bạn vẫn có thể tham gia bằng avatar.');
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
    if (!room || !window.confirm('Bạn có muốn rời khỏi phòng không?')) return;
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
    return <main className="flex min-h-screen items-center justify-center bg-[#17181c] px-6 text-center font-['Roboto'] text-white"><p className="m-0 text-lg">Đang tải phòng...</p></main>;
  }

  if (activeRoomError && !room) {
    return <main className="flex min-h-screen items-center justify-center bg-[#17181c] px-6 text-center font-['Roboto'] text-white"><div><p className="m-0 text-lg">{activeRoomError}</p><Button type="default" htmlType="button" onClick={() => navigate('/')} className="mt-5 !rounded-full !bg-white !px-6 !text-black">Về trang chủ</Button></div></main>;
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black font-['Roboto'] text-[#f2f2f7]">
      <header className="flex h-14 shrink-0 items-center px-4 sm:px-6">
        <p className="m-0 truncate text-sm font-semibold text-[#9da1aa] sm:text-base">Mã phòng <span className="font-bold text-white">{room?.code || roomId}</span></p>
      </header>

      <section className={`relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 transition-[padding] duration-300 sm:px-8 sm:pb-5 ${dialogVisible ? 'lg:pr-[408px]' : 'lg:pr-8'}`}>
        <CameraGrid participants={participants} speakerOn={mediaState.speaker} speakerDeviceId={speakerDeviceId} />
        {mediaLoading && <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs text-white/80">Đang bật camera và micro...</div>}
        {(mediaError || activeRoomError) && !mediaLoading && <div className="absolute bottom-5 left-1/2 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl bg-[#7a241f]/90 px-4 py-2 text-center text-xs text-white">{mediaError || activeRoomError}</div>}
      </section>

      <MeetingDialog activePanel={dialogPanel} isVisible={dialogVisible} connectionStatus={connectionStatus} userRole={user?.role} onClose={() => setDialogVisible(false)} onAnimationEnd={() => { if (!dialogVisible) setDialogPanel(null); }} />
      <MeetingControls mediaState={mediaState} activeDialog={dialogVisible ? dialogPanel : null} onMediaToggle={toggleMedia} onDialogToggle={toggleDialog} onLeave={handleLeave} leaving={leaving} />
    </main>
  );
};

export default Meeting;
