import { useEffect, useRef } from 'react';

const ParticipantTile = ({ participant, speakerOn, speakerDeviceId }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const cameraVisible = Boolean(participant.stream) && participant.cameraOn !== false;

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
    <div data-testid={participant.isLocal ? 'local-camera-tile' : `remote-camera-${participant.id}`} className="relative min-h-0 min-w-0 overflow-hidden rounded-[16px] bg-[#292b30]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${cameraVisible ? 'block' : 'hidden'}`}
      />
      {!participant.isLocal && <audio ref={audioRef} autoPlay muted={!speakerOn} className="pointer-events-none absolute h-px w-px opacity-0" />}

      {!cameraVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5879a7] text-3xl font-bold text-white sm:h-24 sm:w-24">
            {participant.initials || participant.name?.[0] || 'U'}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-[#f0f2f7] sm:bottom-4 sm:left-5 sm:text-sm">
        {participant.name}
      </div>
    </div>
  );
};

const MeetingCameraGrid = ({ participants = [], speakerOn = true, speakerDeviceId = '' }) => {
  const count = participants.length;
  const columns = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const gridClass = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  const sizeClass = count <= 1
    ? 'w-full max-w-[760px] aspect-video min-h-[180px] sm:min-h-[260px]'
    : 'h-full min-h-[260px] w-full max-w-[1100px]';

  return (
    <section
      className={`grid min-h-0 auto-rows-fr gap-3 sm:gap-4 ${gridClass} ${sizeClass}`}
      data-testid="camera-grid"
      aria-label="Khu vực camera"
    >
      {participants.map((participant) => (
        <ParticipantTile key={participant.id} participant={participant} speakerOn={speakerOn} speakerDeviceId={speakerDeviceId} />
      ))}
    </section>
  );
};

export default MeetingCameraGrid;
