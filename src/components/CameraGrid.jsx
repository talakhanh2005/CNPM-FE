import { useEffect, useLayoutEffect, useRef } from 'react';
import { calculateCameraColumns, calculateCameraMaxWidth } from '../utils/cameraLayout';

const ParticipantTile = ({ participant, speakerOn, speakerDeviceId, showEmotion, compact }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const cameraVisible = Boolean(participant.stream) && participant.cameraOn !== false;
  const emotion = participant.emotion;
  const roleLabel = participant.isLocal
    ? 'ME'
    : participant.role === 'teacher'
      ? 'GV'
      : participant.role === 'student'
        ? 'HS'
        : '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = participant.stream || null;
    void video.play().catch(() => undefined);
  }, [participant.stream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.srcObject = participant.isLocal ? null : participant.stream || null;
    if (speakerDeviceId && typeof audio.setSinkId === 'function') {
      void audio.setSinkId(speakerDeviceId).catch(() => undefined);
    }
    if (!audio.muted && audio.srcObject) void audio.play().catch(() => undefined);
  }, [participant.isLocal, participant.stream, speakerDeviceId, speakerOn]);

  return (
    <div
      data-testid={participant.isLocal ? 'local-camera-tile' : `remote-camera-${participant.id}`}
      className={`relative aspect-video shrink-0 overflow-hidden border-[3px] border-pure-black bg-surface-container shadow-[4px_4px_0px_#000000] flex flex-col ${compact ? 'w-full' : 'meeting-camera-tile'}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${cameraVisible ? 'block' : 'hidden'}`}
      />
      {!participant.isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          muted={!speakerOn}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}

      {/* When camera is off: Bauhaus abstract avatar */}
      {!cameraVisible && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-surface-dim ${participant.role === 'teacher' ? 'role-theme-teacher' : participant.role === 'student' ? 'role-theme-student' : ''}`}>
          <div className="flex h-20 w-20 items-center justify-center border-[3px] border-pure-black bg-role-accent text-2xl font-headline font-bold text-role-contrast shadow-[3px_3px_0px_#000000]">
            {participant.initials || participant.name?.[0] || 'U'}
          </div>
          <span className="mt-2 text-label-sm font-bold text-on-surface-variant font-mono">
            {participant.name}
          </span>
        </div>
      )}

      {/* Only show a realtime result after the backend has returned one. */}
      {showEmotion && emotion?.emotion && (
        <div className="absolute top-2 left-2 z-10 bg-surface/90 border-[2px] border-pure-black px-2.5 py-0.5 text-label-sm font-bold text-on-surface flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
          <span>{emotion.emotion}</span>
        </div>
      )}

      {/* Top Right: Mic & Cam Icons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <span
          className={`material-symbols-outlined border-[2px] border-pure-black p-1 text-[16px] shadow-[2px_2px_0px_#000000] ${
            participant.isLocal || participant.cameraOn !== false
              ? 'bg-surface text-on-surface'
              : 'bg-tertiary text-on-tertiary'
          }`}
        >
          {participant.cameraOn !== false ? 'videocam' : 'videocam_off'}
        </span>
      </div>

      {/* Bottom Name Bar */}
      <div className="mt-auto z-10 bg-off-white/95 border-t-[3px] border-pure-black px-space-md py-1.5 flex justify-between items-center">
        <span className="font-bold text-body-sm text-on-surface truncate">
          {participant.name} {participant.isLocal ? '(Bạn)' : ''}
        </span>
        <span className="text-label-sm text-on-surface-variant font-mono">
          {roleLabel}
        </span>
      </div>
    </div>
  );
};

const MeetingCameraGrid = ({
  participants = [],
  speakerOn = true,
  speakerDeviceId = '',
  showEmotion = true,
  compact = false,
}) => {
  const gridRef = useRef(null);
  const count = participants.length;
  const columns = calculateCameraColumns(count);
  useLayoutEffect(() => {
    if (compact || !count || !gridRef.current) return undefined;
    const grid = gridRef.current;
    let previousHeight = 0;

    // Height limits camera size; width changes during the panel animation are
    // handled by CSS, without recalculating columns or wrapping between frames.
    const updateLayout = (height) => {
      if (height <= 0 || height === previousHeight) return;
      previousHeight = height;
      for (let columnCount = 1; columnCount <= columns; columnCount += 1) {
        const maxWidth = calculateCameraMaxWidth(count, columnCount, height);
        grid.style.setProperty(`--camera-max-width-${columnCount}`, `${maxWidth}px`);
      }
    };

    updateLayout(grid.clientHeight);
    if (typeof ResizeObserver === 'undefined') {
      const updateOnWindowResize = () => updateLayout(grid.clientHeight);
      window.addEventListener('resize', updateOnWindowResize);
      return () => window.removeEventListener('resize', updateOnWindowResize);
    }
    const observer = new ResizeObserver(([entry]) => updateLayout(Math.floor(entry.contentRect.height)));
    observer.observe(grid);
    return () => observer.disconnect();
  }, [compact, count, columns]);

  if (!participants.length) {
    return (
      <section
        className="flex min-h-[140px] w-full items-center justify-center border-[3px] border-dashed border-pure-black bg-surface-container p-4 text-center text-label-sm font-bold text-on-surface-variant"
        data-testid="camera-grid"
        aria-label="Khu vực camera"
      >
        Chưa có học sinh bật camera.
      </section>
    );
  }

  return (
    <section
      ref={gridRef}
      className={compact ? 'w-full' : 'meeting-camera-grid flex h-full min-h-0 w-full flex-col'}
      data-testid="camera-grid"
      aria-label="Khu vực camera"
    >
      <div
        className={compact
          ? 'grid w-full grid-cols-1 gap-3'
          : 'meeting-camera-tiles mx-auto my-auto flex max-w-full flex-wrap justify-center gap-4'}
        data-columns={compact ? undefined : columns}
      >
        {participants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            speakerOn={speakerOn}
            speakerDeviceId={speakerDeviceId}
            showEmotion={showEmotion && participant.role === 'student'}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
};

export default MeetingCameraGrid;
