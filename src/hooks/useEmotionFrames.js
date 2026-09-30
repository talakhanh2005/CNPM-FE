import { useEffect, useRef } from 'react';

const FRAME_INTERVAL_MS = 1000;

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const useEmotionFrames = ({ stream, enabled, send, meetingId, isStudent }) => {
  const captureInProgress = useRef(false);

  useEffect(() => {
    if (!stream || !enabled || !isStudent || !meetingId) return undefined;

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    let active = true;
    let timer;

    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    const capture = async () => {
      if (!active || captureInProgress.current || video.readyState < 2) return;
      if (!video.videoWidth || !video.videoHeight) return;
      captureInProgress.current = true;
      try {
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.75));
        if (!blob || !active) return;
        const frameBase64 = await blobToBase64(blob);
        if (frameBase64 && active) {
          send({
            type: 'FRAME',
            payload: {
              frame_id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              frame_base64: frameBase64,
              content_type: 'image/jpeg',
            },
          });
        }
      } finally {
        captureInProgress.current = false;
      }
    };

    video.play().then(() => {
      void capture();
      timer = window.setInterval(capture, FRAME_INTERVAL_MS);
    }).catch(() => undefined);

    return () => {
      active = false;
      window.clearInterval(timer);
      video.pause();
      video.srcObject = null;
    };
  }, [enabled, isStudent, meetingId, send, stream]);
};

export default useEmotionFrames;
