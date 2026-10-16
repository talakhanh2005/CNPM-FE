import { useEffect, useRef } from 'react';
import { inferEmotion } from '../api/meetingApi';

const FRAME_INTERVAL_MS = 1000;
// 403/409 mean "not allowed here" (wrong role, wrong mode, meeting not active): stop trying.
const STOP_CODES = new Set(['INVALID_MEETING_MODE', 'MEETING_NOT_ACTIVE', 'NOT_A_PARTICIPANT', 'FORBIDDEN']);

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

/**
 * Realtime emotion inference (contract v1 section 5.1). Samples the student's camera about
 * once a second, sends the JPEG to POST /meetings/{id}/emotions/infer and reports the result
 * to `onResult({ status, ...data })`. The frame is never stored by the client or the server.
 * status: 'inferring' | 'ok' | 'no_face' | 'ai_error' | 'busy' | 'stopped' | 'error'.
 */
const useEmotionFrames = ({ stream, enabled, meetingId, isStudent, onResult }) => {
  const captureInProgress = useRef(false);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!stream || !enabled || !isStudent || !meetingId) return undefined;

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    let active = true;
    let timer;

    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    const report = (result) => {
      if (active) onResultRef.current?.(result);
    };

    const stop = (result) => {
      active = false;
      window.clearInterval(timer);
      onResultRef.current?.(result);
    };

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
        if (!frameBase64 || !active) return;
        const result = await inferEmotion(meetingId, {
          frame_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          frame_base64: frameBase64,
          content_type: 'image/jpeg',
        });
        const failed = result.emotion === 'fail_detection';
        report({ ...result, status: failed ? result.failure_reason || 'ai_error' : 'ok' });
      } catch (error) {
        const code = error?.response?.data?.data?.code;
        if (error?.response?.status === 429) {
          report({ status: 'busy' }); // too fast or AI busy: drop this frame, the next one retries
        } else if (STOP_CODES.has(code)) {
          stop({ status: 'stopped', code });
        } else {
          report({ status: 'error', code });
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
  }, [enabled, isStudent, meetingId, stream]);
};

export default useEmotionFrames;
