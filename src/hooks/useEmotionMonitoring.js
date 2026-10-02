import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEmotionLogs, submitEmotionFrame } from '../api/emotionApi';
import { getApiErrorMessage } from '../api/axiosClient';

const FRAME_INTERVAL_MS = 1000;
const LOG_REFRESH_MS = 15000;
const MAX_SAMPLES = 500;
const FRAME_WIDTH = 640;

const sampleId = (sample) => sample?.sample_id || sample?.id;
const sampleTime = (sample) => sample?.received_at || sample?.timestamp || '';

const mergeSamples = (current, incoming) => {
  const merged = new Map(current.map((sample) => [sampleId(sample), sample]));
  incoming.forEach((sample) => {
    const id = sampleId(sample);
    if (id) merged.set(id, { ...merged.get(id), ...sample });
  });
  return [...merged.values()]
    .sort((left, right) => String(sampleTime(left)).localeCompare(String(sampleTime(right))))
    .slice(-MAX_SAMPLES);
};

const createFrameId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `frame-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const framePayload = (video, canvas) => {
  if (!video.videoWidth || !video.videoHeight) return null;
  const scale = Math.min(1, FRAME_WIDTH / video.videoWidth);
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const encoded = canvas.toDataURL('image/jpeg', 0.72).split(',', 2)[1];
  if (!encoded) return null;
  return {
    frame_id: createFrameId(),
    timestamp: new Date().toISOString(),
    frame_base64: encoded,
    content_type: 'image/jpeg',
  };
};

const useEmotionMonitoring = ({
  meetingId,
  enabled,
  isTeacher,
  localStream,
  cameraOn,
}) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const addSample = useCallback((sample) => {
    if (!sample || (meetingId && sample.meeting_id && sample.meeting_id !== meetingId)) return;
    setSamples((current) => mergeSamples(current, [sample]));
  }, [meetingId]);

  const refreshLogs = useCallback(async ({ silent = false } = {}) => {
    if (!meetingId || !enabled || !isTeacher) return;
    if (!silent) setLoading(true);
    try {
      const result = await getEmotionLogs(meetingId, { offset: 0, limit: MAX_SAMPLES });
      if (!mountedRef.current) return;
      setSamples((current) => mergeSamples(current, result?.items || []));
      setError('');
    } catch (requestError) {
      if (mountedRef.current) {
        setError(getApiErrorMessage(requestError, 'Không thể tải emotion log.'));
      }
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [enabled, isTeacher, meetingId]);

  useEffect(() => {
    if (!meetingId || !enabled || !isTeacher) return undefined;
    const initialRefresh = window.setTimeout(() => { void refreshLogs(); }, 0);
    const timer = window.setInterval(() => {
      void refreshLogs({ silent: true });
    }, LOG_REFRESH_MS);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [enabled, isTeacher, meetingId, refreshLogs]);

  useEffect(() => {
    if (isTeacher || !meetingId || !enabled || !cameraOn || !localStream) {
      return undefined;
    }
    const videoTrack = localStream.getVideoTracks().find(
      (track) => track.readyState === 'live' && track.enabled,
    );
    if (!videoTrack) {
      return undefined;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    let stopped = false;
    let busy = false;
    let timer;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = localStream;

    const capture = async () => {
      if (stopped || busy || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const payload = framePayload(video, canvas);
      if (!payload) return;
      busy = true;
      setCaptureStatus('sending');
      try {
        const result = await submitEmotionFrame(meetingId, payload);
        if (!stopped && mountedRef.current) {
          addSample(result);
          setError('');
          setCaptureStatus('active');
        }
      } catch (requestError) {
        if (!stopped && mountedRef.current) {
          setError(getApiErrorMessage(requestError, 'Không thể gửi frame tới backend.'));
          setCaptureStatus('error');
        }
      } finally {
        busy = false;
      }
    };

    void video.play()
      .then(() => {
        if (stopped) return;
        setCaptureStatus('active');
        void capture();
        timer = window.setInterval(() => { void capture(); }, FRAME_INTERVAL_MS);
      })
      .catch(() => {
        if (!stopped) {
          setCaptureStatus('error');
          setError('Không thể đọc frame từ camera.');
        }
      });

    return () => {
      stopped = true;
      window.clearInterval(timer);
      video.pause();
      video.srcObject = null;
    };
  }, [addSample, cameraOn, enabled, isTeacher, localStream, meetingId]);

  const visibleSamples = useMemo(() => samples.filter(
    (sample) => !meetingId || !sample.meeting_id || sample.meeting_id === meetingId,
  ), [meetingId, samples]);
  const latestSample = visibleSamples.at(-1) || null;
  const latestByStudent = useMemo(() => visibleSamples.reduce((latest, sample) => {
    if (sample.student_id) latest[sample.student_id] = sample;
    return latest;
  }, {}), [visibleSamples]);
  const effectiveCaptureStatus = isTeacher || !meetingId || !enabled || !cameraOn || !localStream
    ? 'idle'
    : captureStatus;

  return {
    samples: visibleSamples,
    latestSample,
    latestByStudent,
    loading,
    error,
    captureStatus: effectiveCaptureStatus,
    addSample,
    refreshLogs,
  };
};

export default useEmotionMonitoring;
