import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CameraGrid from '../components/CameraGrid';
import LoadingPage from '../components/LoadingPage';
import MeetingControls from '../components/MeetingControls';
import MeetingDialog from '../layouts/MeetingDialog';
import useAuth from '../hooks/useAuth';
import useEmotionMonitoring from '../hooks/useEmotionMonitoring';
import useMeetingRecording from '../hooks/useMeetingRecording';
import useWebRTC from '../hooks/useWebRTC';
import useWebSocket from '../hooks/useWebSocket';
import { closeRoom, getIceConfig, getRoom, leaveRoom } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { fallbackIceServers, normalizeIceServers } from '../config/iceServers';
import { takeRetainedMediaStream } from '../utils/mediaSession';

const defaultMediaState = { mic: false, speaker: true, camera: false };

const socketErrorMessages = {
  ROOM_FULL: 'Phòng học đã đủ người tham gia.',
  MEETING_NOT_FOUND: 'Không tìm thấy phòng học.',
  MEETING_NOT_ACTIVE: 'Phòng học chưa bắt đầu hoặc đã kết thúc.',
  MEETING_ENDED: 'Phòng học đã kết thúc.',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  PEER_OFFLINE: 'Người tham gia đã ngắt kết nối.',
};

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
  const participantRefreshPromiseRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [mediaState, setMediaState] = useState(initialMediaState);
  const [mediaLoading, setMediaLoading] = useState(Boolean(initialMediaState.camera || initialMediaState.mic));
  const [mediaError, setMediaError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dialogPanel, setDialogPanel] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [emotionsByStudentId, setEmotionsByStudentId] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [iceConfig, setIceConfig] = useState({ meetingId: null, servers: fallbackIceServers });
  const activeRoomError = roomError || (!roomLoading && !room ? 'Không tìm thấy dữ liệu phòng. Hãy tham gia lại từ trang chủ.' : '');

  const isTeacher = user?.role === 'teacher';
  const isAfterSession = room?.analysisMode === 'after_session';
  const emotionPanelEnabled = room?.analysisMode === 'realtime';
  const emotionViewEnabled = emotionPanelEnabled && isTeacher;
  const iceConfigReady = Boolean(room?.id && iceConfig.meetingId === room.id);
  const participantDirectory = useMemo(() => new Map(
    (room?.participants || []).map((participant) => [
      String(participant.id || participant.user_id),
      participant,
    ]),
  ), [room?.participants]);

  const handleEmotionResult = useCallback((result) => {
    if (!result) return;
    if (result.student_id) {
      setEmotionsByStudentId((current) => ({
        ...current,
        [result.student_id]: result,
      }));
    }
  }, []);

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

  useEffect(() => {
    if (!room?.id) return undefined;

    let active = true;
    const meetingId = room.id;
    getIceConfig(room.id)
      .then((config) => {
        if (active) {
          setIceConfig({ meetingId, servers: normalizeIceServers(config?.iceServers) });
        }
      })
      .catch(() => {
        if (active) setIceConfig({ meetingId, servers: fallbackIceServers });
      });

    return () => { active = false; };
  }, [room?.id]);

  const refreshRoomParticipants = useCallback(() => {
    const meetingId = room?.id;
    if (!meetingId) return Promise.resolve(null);
    if (participantRefreshPromiseRef.current) return participantRefreshPromiseRef.current;

    const request = getRoom(meetingId)
      .then((nextRoom) => {
        setRoom((current) => current?.id === meetingId ? nextRoom : current);
        return nextRoom;
      })
      .catch(() => null)
      .finally(() => {
        if (participantRefreshPromiseRef.current === request) {
          participantRefreshPromiseRef.current = null;
        }
      });
    participantRefreshPromiseRef.current = request;
    return request;
  }, [room?.id]);

  const { remoteParticipants, handleEvent } = useWebRTC({
    user,
    localStream,
    mediaState,
    iceServers: iceConfig.servers,
    send: (message) => sendRef.current(message),
  });

  const {
    isRecording,
    recordingSeconds,
    recordingBusy,
    recordings,
    recordingStatuses,
    recordingError,
    recordingNeedsUpload,
    recordingStarted,
    hasRecordingToFinalize,
    handleStartRecord,
    handleStopRecord,
    handleRetryRecordingUpload: retryRecordingUpload,
    handleDownloadPendingRecording,
    handleAnalyzeRecording,
    handlePlaybackRecording,
  } = useMeetingRecording({ room, remoteParticipants, setToastMessage });

  const { send, close } = useWebSocket({
    meetingId: iceConfigReady ? room?.id : null,
    user,
    onEvent: (event) => {
      if (event?.type === 'room.ended') {
        hasLeftRoomRef.current = true;
        navigate('/', { replace: true, state: { notice: 'Giáo viên đã đóng phòng học.' } });
        return;
      }
      if (event?.type === 'socket.error') {
        if (['AI_BUSY', 'RATE_LIMITED', 'FRAME_TOO_LARGE'].includes(event.payload?.code)) return;
        setRoomError(socketErrorMessages[event.payload?.code] || 'Kết nối phòng gặp lỗi. Vui lòng thử lại.');
        return;
      }
      if (event?.type === 'EMOTION' && isTeacher) {
        handleEmotionResult(event.payload || event);
      }
      if (['participant.joined', 'participant.present'].includes(event?.type)) {
        const participant = event.payload?.participant;
        const knownParticipant = participantDirectory.get(String(participant?.id || event.senderId));
        const knownName = participant?.fullName
          || knownParticipant?.fullName
          || knownParticipant?.full_name;
        if (!knownName) void refreshRoomParticipants();
      }
      void handleEvent(event);
    },
    onStatus: setConnectionStatus,
  });

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEmotionMonitoring({
    enabled: Boolean(
      user?.role === 'student'
      && room?.analysisMode === 'realtime'
      && mediaState.camera
    ),
    meetingId: room?.id,
    localStream,
    send,
  });

  useEffect(() => {
    if (!room?.id) return undefined;
    exitGuardArmedRef.current = false;
    const armExitGuard = window.setTimeout(() => { exitGuardArmedRef.current = true; }, 0);
    const disconnectOnPageExit = () => {
      if (hasLeftRoomRef.current) return;
      hasLeftRoomRef.current = true;
      close();
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

  const handleRetryRecordingUpload = async () => {
    const uploaded = await retryRecordingUpload();
    if (uploaded) setRoomError('');
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

  const handleCloseRoom = async () => {
    if (!isTeacher || !room || !window.confirm('Đóng phòng sẽ kết thúc buổi học cho tất cả người tham gia. Bạn có chắc không?')) return;
    try {
      setClosing(true);
      hasLeftRoomRef.current = true;
      if (hasRecordingToFinalize()) {
        await handleStopRecord({ finalizeForClose: true });
      }
      const meetingId = room.id;
      await closeRoom(meetingId);
      close();
      navigate(
        isAfterSession ? `/report?meetingId=${encodeURIComponent(meetingId)}` : '/',
        { replace: true },
      );
    } catch (error) {
      hasLeftRoomRef.current = false;
      setRoomError(getApiErrorMessage(error, 'Không thể đóng phòng.'));
    } finally {
      setClosing(false);
    }
  };

  const participants = [
    ...remoteParticipants.map((participant) => {
      const knownParticipant = participantDirectory.get(String(participant.id));
      const participantName = knownParticipant?.fullName
        || knownParticipant?.full_name
        || knownParticipant?.name
        || participant.name
        || 'Người tham gia';
      return {
        ...participant,
        name: participantName,
        initials: participantName[0]?.toUpperCase() || participant.initials || 'U',
        role: participant.role || knownParticipant?.role,
        emotion: isTeacher && (participant.role || knownParticipant?.role) === 'student'
          ? emotionsByStudentId[participant.id] || participant.emotion || null
          : null,
      };
    }),
    {
      id: user?.id || 'local-user',
      name: user?.full_name || user?.username || 'Bạn',
      role: user?.role,
      initials: (user?.full_name || user?.username)?.[0]?.toUpperCase() || 'B',
      isLocal: true,
      emotion: null,
      stream: localStream,
      cameraOn: mediaState.camera,
    },
  ];

  if (roomLoading && !room) {
    return <LoadingPage message="Đang tải phòng học..." />;
  }

  if (activeRoomError && !room) {
    return (
      <main className={`${isTeacher ? 'role-theme-teacher' : 'role-theme-student'} flex min-h-screen items-center justify-center bg-surface font-body p-6 text-center`}>
        <div className="bg-surface-container-lowest border-[3px] border-pure-black p-8 shadow-[8px_8px_0px_#000000] max-w-md">
          <span className="material-symbols-outlined text-[48px] text-tertiary">error</span>
          <p className="mt-4 font-headline font-bold text-headline-sm">{activeRoomError}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2.5 bg-role-accent text-role-contrast font-bold border-[2px] border-pure-black shadow-[3px_3px_0px_#000000]"
          >
            Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`${isTeacher ? 'role-theme-teacher' : 'role-theme-student'} relative flex h-screen w-full flex-col overflow-hidden bg-surface font-body text-on-surface`}>
      {/* Top Header Control Bar */}
      <header className="w-full bg-off-white border-b-[3px] border-pure-black px-4 sm:px-gutter py-2.5 sm:py-3 flex items-center justify-between shadow-[4px_4px_0px_#000000] shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-space-md">
          <div className="bg-role-accent text-role-contrast border-[2px] sm:border-[3px] border-pure-black px-2.5 sm:px-space-md py-1 font-headline font-bold text-label-md shadow-[2px_2px_0px_#000000] flex items-center gap-1 sm:gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            #{room?.code || roomId}
            {room?.name && <span className="hidden xl:inline font-mono font-normal">| {room.name}</span>}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-surface-container border-[2px] border-pure-black px-3 py-1 font-mono text-label-md text-on-surface shadow-[2px_2px_0px_#000000]">
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <span>{formatTimer(sessionSeconds)}</span>
          </div>

          {/* REC Blinking indicator if recording */}
          {isRecording && (
            <div className="flex items-center gap-1.5 bg-vivid-red text-white border-[2px] border-pure-black px-3 py-1 font-mono text-label-md font-bold shadow-[2px_2px_0px_#000000] animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>REC {formatTimer(recordingSeconds)}</span>
            </div>
          )}

          {/* Analysis mode badge */}
          <div className="hidden md:flex items-center gap-2 bg-role-accent text-role-contrast border-[2px] border-pure-black px-3 py-1 font-headline text-label-md shadow-[2px_2px_0px_#000000]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>
              {isAfterSession
                ? 'Chế độ: AI đánh giá sau'
                : 'AI Cảm xúc: Realtime'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-space-md">
          <div className="hidden lg:flex items-center gap-2 bg-surface-container-low border-[2px] border-pure-black px-3 py-1 font-bold text-label-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isTeacher ? 'Chủ tọa (Giáo viên)' : 'Học viên'}</span>
          </div>

          {isTeacher && (
            <button
              type="button"
              onClick={handleCloseRoom}
              disabled={closing || leaving}
              className="px-3.5 py-1.5 bg-vivid-red text-on-error border-[2px] border-pure-black font-headline font-bold text-label-sm uppercase shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>{closing ? 'Đang đóng...' : 'Đóng phòng'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Teacher student count */}
        {isTeacher && (
          <div className="bg-surface-container-low border-b-[2px] border-pure-black px-4 py-2 shrink-0 grid grid-cols-1 gap-2 text-label-sm">
            <div className="flex items-center justify-between p-2 bg-surface-container-lowest border border-pure-black">
              <span className="text-on-surface-variant font-mono">Học sinh:</span>
              <span className="font-bold text-secondary">
                {remoteParticipants.filter((participant) => participant.role === 'student').length} bạn
              </span>
            </div>
          </div>
        )}

        {/* Video stage and side panel share the same height. */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <section
            className={`relative flex min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 transition-[padding] duration-300 ${
              dialogVisible ? 'lg:pr-[390px]' : ''
            }`}
          >
            {/* Toast Notification Banner */}
            {toastMessage && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 border-[3px] border-pure-black bg-role-accent text-role-contrast px-5 py-2.5 font-bold shadow-[4px_4px_0px_#000000] flex items-center gap-2 text-body-md animate-bounce">
                <span className="material-symbols-outlined text-[24px]">verified</span>
                <span>{toastMessage}</span>
              </div>
            )}

            <CameraGrid
              participants={participants}
              speakerOn={mediaState.speaker}
              speakerDeviceId={speakerDeviceId}
              showEmotion={emotionViewEnabled}
            />

            {mediaLoading && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 z-20 border-[2px] border-pure-black bg-role-accent text-role-contrast px-4 py-1.5 text-label-sm font-bold shadow-[3px_3px_0px_#000000]">
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
            meetingId={room?.id}
            participants={participants}
            recordings={recordings}
            recordingStatuses={recordingStatuses}
            recordingParticipants={[...(room?.participants || []), ...participants]}
            recordingBusy={recordingBusy}
            recordingError={recordingError}
            recordingNeedsUpload={recordingNeedsUpload && !isRecording}
            emotionPanelEnabled={emotionViewEnabled}
            onAnalyzeRecording={handleAnalyzeRecording}
            onPlaybackRecording={handlePlaybackRecording}
            onRetryRecordingUpload={handleRetryRecordingUpload}
            onDownloadPendingRecording={handleDownloadPendingRecording}
            onClose={() => setDialogVisible(false)}
            onAnimationEnd={() => {
              if (!dialogVisible) setDialogPanel(null);
            }}
          />
        </div>
      </div>

      {/* Bottom Meeting Control Bar */}
      <MeetingControls
        mediaState={mediaState}
        activeDialog={dialogVisible ? dialogPanel : null}
        onMediaToggle={toggleMedia}
        onDialogToggle={toggleDialog}
        onLeave={handleLeave}
        leaving={leaving}
        isTeacher={isTeacher}
        isRecording={isRecording}
        recordingLocked={isAfterSession && recordingStarted}
        recordingNeedsUpload={recordingNeedsUpload}
        recordingBusy={recordingBusy}
        recordingForAnalysis={isAfterSession}
        emotionPanelEnabled={emotionViewEnabled}
        onRecordToggle={isRecording ? () => handleStopRecord() : handleStartRecord}
      />
    </main>
  );
};

export default Meeting;
