import { useEffect, useRef } from 'react';

const mockEmotionStatus = [
  { text: '🟢 Tập trung 92%', color: 'text-emerald-700 bg-emerald-100' },
  { text: '🟡 Hứng thú 88%', color: 'text-amber-700 bg-amber-100' },
  { text: '🟢 Tập trung 95%', color: 'text-emerald-700 bg-emerald-100' },
  { text: '🟠 Cần chú ý', color: 'text-orange-700 bg-orange-100' },
  { text: '🟢 Tập trung 90%', color: 'text-emerald-700 bg-emerald-100' },
];

const ParticipantTile = ({ participant, speakerOn, speakerDeviceId, index = 0 }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const cameraVisible = Boolean(participant.stream) && participant.cameraOn !== false;
  const emotion = mockEmotionStatus[index % mockEmotionStatus.length];

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
      className="relative min-h-[220px] overflow-hidden border-[3px] border-pure-black bg-surface-container shadow-[4px_4px_0px_#000000] flex flex-col"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-dim">
          <div className="flex h-20 w-20 items-center justify-center border-[3px] border-pure-black bg-bright-yellow text-2xl font-headline font-bold text-pure-black shadow-[3px_3px_0px_#000000]">
            {participant.initials || participant.name?.[0] || 'U'}
          </div>
          <span className="mt-2 text-label-sm font-bold text-on-surface-variant font-mono">
            {participant.name}
          </span>
        </div>
      )}

      {/* Top Left: Emotion Badge */}
      <div className="absolute top-2 left-2 z-10 bg-surface/90 border-[2px] border-pure-black px-2.5 py-0.5 text-label-sm font-bold text-on-surface flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
        <span>{emotion.text}</span>
      </div>

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
          {participant.isLocal ? 'ME' : 'HS'}
        </span>
      </div>
    </div>
  );
};

const MeetingCameraGrid = ({
  participants = [],
  speakerOn = true,
  speakerDeviceId = '',
}) => {
  const count = participants.length;
  const gridClass =
    count <= 1
      ? 'grid-cols-1'
      : count <= 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : count <= 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section
      className={`grid min-h-0 w-full gap-4 ${gridClass}`}
      data-testid="camera-grid"
      aria-label="Khu vực camera"
    >
      {participants.map((participant, index) => (
        <ParticipantTile
          key={participant.id}
          index={index}
          participant={participant}
          speakerOn={speakerOn}
          speakerDeviceId={speakerDeviceId}
        />
      ))}
    </section>
  );
};

export default MeetingCameraGrid;
