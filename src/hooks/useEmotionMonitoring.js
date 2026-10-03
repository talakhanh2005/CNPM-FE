import { useEffect, useRef, useState } from 'react';
import { submitEmotionFrame } from '../api/emotionApi';

const FRAME_INTERVAL_MS = 1000;
const FRAME_WIDTH = 640;

const useEmotionMonitoring = ({ enabled, meetingId, localStream, send, onResult }) => {
  const inFlightRef = useRef(false);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!enabled || !localStream?.getVideoTracks().some((track) => track.readyState === 'live')) {
      return undefined;
    }

    let disposed = false;
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = localStream;

    const capture = () => {
      if (disposed || inFlightRef.current || video.readyState < 2 || !context) return;
      const sourceWidth = video.videoWidth || FRAME_WIDTH;
      const sourceHeight = video.videoHeight || 360;
      canvas.width = FRAME_WIDTH;
      canvas.height = Math.max(1, Math.round((sourceHeight / sourceWidth) * FRAME_WIDTH));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      const frameBase64 = dataUrl.split(',')[1];
      if (!frameBase64) return;

      inFlightRef.current = true;
      const payload = {
        frame_id: globalThis.crypto?.randomUUID?.() || `frame-${Date.now()}`,
        timestamp: new Date().toISOString(),
        frame_base64: frameBase64,
        content_type: 'image/jpeg',
      };
      const sent = send({ type: 'FRAME', payload });
      setStatus(sent ? 'sending' : 'waiting');
      if (!sent && meetingId) {
        submitEmotionFrame(meetingId, payload)
          .then((result) => {
            if (!disposed) {
              onResult?.(result);
              setStatus('active');
            }
          })
          .catch(() => { if (!disposed) setStatus('waiting'); })
          .finally(() => { inFlightRef.current = false; });
        return;
      }
      window.setTimeout(() => { inFlightRef.current = false; }, FRAME_INTERVAL_MS - 100);
    };

    video.play()
      .then(() => { if (!disposed) setStatus('active'); })
      .catch(() => { if (!disposed) setStatus('waiting'); });
    const timer = window.setInterval(capture, FRAME_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      video.pause();
      video.srcObject = null;
      inFlightRef.current = false;
    };
  }, [enabled, localStream, meetingId, onResult, send]);

  return enabled ? status : 'idle';
};

export default useEmotionMonitoring;
