import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadMeetingRecording } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import useRecordingStatus from './useRecordingStatus';

const supportedRecordingMimeType = () => [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
].find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';

const stopRecorder = (recorder) => {
  if (!recorder || recorder.state === 'inactive') return Promise.resolve();
  return new Promise((resolve, reject) => {
    recorder.addEventListener('stop', resolve, { once: true });
    recorder.addEventListener('error', reject, { once: true });
    recorder.stop();
  });
};

const downloadBlob = (blob, filename) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
};

const useMeetingRecording = ({ room, remoteParticipants, setToastMessage }) => {
  const mode = room?.analysisMode;
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const pendingRecordingBlobRef = useRef(null);
  const screenRecordingStreamRef = useRef(null);
  const studentRecordersRef = useRef(new Map());
  const afterSessionRecordingActiveRef = useRef(false);
  const recordingFinalizePromiseRef = useRef(null);
  const recordTimerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [recordingNeedsUpload, setRecordingNeedsUpload] = useState(false);
  const [recordingStarted, setRecordingStarted] = useState(false);
  const {
    recordings,
    recordingStatuses,
    addUploadedRecording,
    handleAnalyzeRecording,
    handlePlaybackRecording,
  } = useRecordingStatus({ setRecordingBusy, setRecordingError });

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const startStudentRecorder = useCallback((participant) => {
    if (
      !afterSessionRecordingActiveRef.current
      || participant?.role !== 'student'
      || !participant.id
      || !participant.stream?.getVideoTracks().some((track) => track.readyState === 'live')
    ) return false;

    let entry = studentRecordersRef.current.get(participant.id);
    const activeSegment = entry?.segments.at(-1);
    if (activeSegment && activeSegment.recorder.state !== 'inactive') return false;

    try {
      const mimeType = supportedRecordingMimeType();
      const recorder = new MediaRecorder(
        participant.stream,
        mimeType ? { mimeType } : undefined,
      );
      const segment = {
        recorder,
        chunks: [],
        mimeType: recorder.mimeType || mimeType || 'video/webm',
        blob: null,
        uploaded: false,
      };
      recorder.addEventListener('dataavailable', ({ data }) => {
        if (data?.size) segment.chunks.push(data);
      });
      recorder.start(1000);

      if (!entry) {
        entry = { studentId: participant.id, segments: [] };
        studentRecordersRef.current.set(participant.id, entry);
      }
      entry.segments.push(segment);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startAfterSessionRecording = () => {
    const studentsWithVideo = remoteParticipants.filter((participant) => (
      participant.role === 'student'
      && participant.stream?.getVideoTracks().some((track) => track.readyState === 'live')
    ));
    if (!studentsWithVideo.length) {
      throw new Error('Chưa nhận được video của học sinh để ghi hình.');
    }

    studentRecordersRef.current.clear();
    afterSessionRecordingActiveRef.current = true;
    const startedCount = studentsWithVideo.filter(startStudentRecorder).length;
    if (!startedCount) {
      afterSessionRecordingActiveRef.current = false;
      throw new Error('Không thể bắt đầu ghi camera học sinh.');
    }
    setRecordingNeedsUpload(true);
    setRecordingError('');
  };

  const startRealtimeRecording = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Trình duyệt không hỗ trợ ghi tab phòng học.');
    }
    const streamToRecord = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      monitorTypeSurfaces: 'exclude',
    });
    const displaySurface = streamToRecord.getVideoTracks()[0]?.getSettings?.().displaySurface;
    if (displaySurface && displaySurface !== 'browser') {
      streamToRecord.getTracks().forEach((track) => track.stop());
      throw new Error('Hãy chọn tab đang mở phòng học, không chọn cửa sổ hoặc toàn bộ màn hình.');
    }
    screenRecordingStreamRef.current = streamToRecord;

    const mimeType = supportedRecordingMimeType();
    const recorder = new MediaRecorder(streamToRecord, mimeType ? { mimeType } : undefined);
    recordingChunksRef.current = [];
    recorder.ondataavailable = ({ data }) => {
      if (data?.size) recordingChunksRef.current.push(data);
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    pendingRecordingBlobRef.current = null;
    setRecordingNeedsUpload(false);
    setRecordingError('');

    streamToRecord.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (mediaRecorderRef.current === recorder) void handleStopRecord();
    }, { once: true });
  };

  const handleStartRecord = async () => {
    if (mode === 'after_session' && recordingStarted) return;
    try {
      if (!window.MediaRecorder) throw new Error('Trình duyệt không hỗ trợ ghi hình.');
      if (mode === 'after_session') startAfterSessionRecording();
      else await startRealtimeRecording();
    } catch (error) {
      const message = ['AbortError', 'NotAllowedError'].includes(error.name)
        ? 'Bạn chưa chọn tab phòng học hoặc chưa cấp quyền ghi tab.'
        : error.message || 'Không thể bắt đầu ghi hình.';
      if (mode === 'realtime') {
        screenRecordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenRecordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
      }
      setRecordingError(message);
      showToast(message);
      return;
    }

    setIsRecording(true);
    if (mode === 'after_session') setRecordingStarted(true);
    setRecordingSeconds(0);
    clearInterval(recordTimerRef.current);
    recordTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const finalizeAfterSessionRecordings = async ({ silent = false } = {}) => {
    if (recordingFinalizePromiseRef.current) return recordingFinalizePromiseRef.current;

    const finalize = async () => {
      clearInterval(recordTimerRef.current);
      afterSessionRecordingActiveRef.current = false;
      setIsRecording(false);
      setRecordingBusy(true);
      setRecordingError('');

      try {
        const entries = [...studentRecordersRef.current.values()];
        const segments = entries.flatMap((entry) => (
          entry.segments.map((segment) => ({ entry, segment }))
        ));

        await Promise.all(segments.map(async ({ segment }) => {
          try {
            await stopRecorder(segment.recorder);
          } catch {
            // Preserve any chunks already emitted and continue with the other students.
          }
        }));

        for (const { entry, segment } of segments) {
          if (segment.uploaded) continue;
          if (!segment.blob) {
            segment.blob = new Blob(segment.chunks, {
              type: segment.mimeType || 'video/webm',
            });
          }
          if (!segment.blob.size) continue;

          try {
            const uploaded = await uploadMeetingRecording(
              room.id,
              entry.studentId,
              segment.blob,
            );
            segment.uploaded = true;
            addUploadedRecording(uploaded);
          } catch (error) {
            if (!silent) {
              setRecordingError(getApiErrorMessage(error, 'Không thể tải một bản ghi học sinh lên.'));
            }
          }
        }

        const pending = entries.some((entry) => entry.segments.some((segment) => (
          segment.blob?.size && !segment.uploaded
        )));
        setRecordingNeedsUpload(pending);
        return !pending;
      } finally {
        setRecordingBusy(false);
      }
    };

    recordingFinalizePromiseRef.current = finalize();
    try {
      return await recordingFinalizePromiseRef.current;
    } finally {
      recordingFinalizePromiseRef.current = null;
    }
  };

  const stopRealtimeRecording = async ({ finalizeForClose }) => {
    const recorder = mediaRecorderRef.current;
    clearInterval(recordTimerRef.current);
    setRecordingBusy(true);
    setRecordingError('');

    try {
      if ((!recorder && !pendingRecordingBlobRef.current) || !room?.id) {
        throw new Error('Không có dữ liệu ghi hình.');
      }
      await stopRecorder(recorder);
      setIsRecording(false);
      const videoBlob = pendingRecordingBlobRef.current || new Blob(recordingChunksRef.current, {
        type: recorder?.mimeType || 'video/webm',
      });
      if (!videoBlob.size) throw new Error('Bản ghi trống.');
      pendingRecordingBlobRef.current = videoBlob;

      const extension = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(videoBlob, `meeting-${room.code || room.id}-${timestamp}.${extension}`);
      recordingChunksRef.current = [];
      pendingRecordingBlobRef.current = null;
      mediaRecorderRef.current = null;
      screenRecordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenRecordingStreamRef.current = null;
      setRecordingNeedsUpload(false);
      showToast('Đã lưu bản ghi về máy. Bản ghi này không được tải lên hệ thống.');
      return true;
    } catch (error) {
      if (!finalizeForClose) {
        setRecordingError(getApiErrorMessage(error, 'Không thể lưu bản ghi.'));
      }
      return false;
    } finally {
      setRecordingBusy(false);
    }
  };

  const handleStopRecord = async ({ finalizeForClose = false } = {}) => {
    if (mode === 'after_session') {
      if (!finalizeForClose) return false;
      return finalizeAfterSessionRecordings({ silent: finalizeForClose });
    }
    return stopRealtimeRecording({ finalizeForClose });
  };

  const handleRetryRecordingUpload = async () => {
    return handleStopRecord({ finalizeForClose: true });
  };

  const handleDownloadPendingRecording = () => {
    if (mode === 'after_session') {
      const pendingSegments = [...studentRecordersRef.current.values()].flatMap((entry) => (
        entry.segments
          .filter((segment) => segment.blob?.size && !segment.uploaded)
          .map((segment, index) => ({ entry, segment, index }))
      ));
      if (!pendingSegments.length) {
        setRecordingError('Không còn dữ liệu bản ghi trong trình duyệt để tải xuống.');
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      pendingSegments.forEach(({ entry, segment, index }) => {
        const extension = segment.blob.type.includes('mp4') ? 'mp4' : 'webm';
        downloadBlob(
          segment.blob,
          `meeting-${room?.code || room?.id}-student-${entry.studentId}-${index + 1}-${timestamp}.${extension}`,
        );
      });
      return;
    }

    const videoBlob = pendingRecordingBlobRef.current;
    if (!videoBlob?.size) {
      setRecordingError('Không còn dữ liệu bản ghi trong trình duyệt để tải xuống.');
      return;
    }
    const extension = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadBlob(videoBlob, `meeting-${room?.code || room?.id || 'recording'}-${timestamp}.${extension}`);
    showToast('Đã tải bản ghi dự phòng về máy. Bạn vẫn có thể thử tải lên lại.');
  };

  useEffect(() => () => {
    clearInterval(recordTimerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // Recorder may already be stopping while the meeting unmounts.
      }
    }
    mediaRecorderRef.current = null;
    screenRecordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenRecordingStreamRef.current = null;
    afterSessionRecordingActiveRef.current = false;
    studentRecordersRef.current.forEach((entry) => {
      entry.segments.forEach(({ recorder: studentRecorder }) => {
        if (studentRecorder.state !== 'inactive') {
          try {
            studentRecorder.stop();
          } catch {
            // Recorder may already be stopping while the meeting unmounts.
          }
        }
      });
    });
    studentRecordersRef.current.clear();
  }, []);

  useEffect(() => {
    if (mode !== 'after_session' || (!isRecording && !recordingNeedsUpload && !recordingBusy)) {
      return undefined;
    }
    const warnBeforeExit = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeExit);
    return () => window.removeEventListener('beforeunload', warnBeforeExit);
  }, [isRecording, recordingBusy, recordingNeedsUpload, mode]);

  useEffect(() => {
    if (mode !== 'after_session' || !afterSessionRecordingActiveRef.current) return;
    remoteParticipants.forEach(startStudentRecorder);
  }, [remoteParticipants, mode, startStudentRecorder]);

  const hasRecordingToFinalize = () => Boolean(
    isRecording
    || recordingNeedsUpload
    || pendingRecordingBlobRef.current
    || studentRecordersRef.current.size
  );

  return {
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
    handleRetryRecordingUpload,
    handleDownloadPendingRecording,
    handleAnalyzeRecording,
    handlePlaybackRecording,
  };
};

export default useMeetingRecording;
