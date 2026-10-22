import { useEffect, useMemo, useState } from 'react';
import { getRecordingPlayback } from '../api/meetingApi';
import { getRecordingStatus, requestRecordingAnalysis } from '../api/reportApi';
import { getApiErrorMessage } from '../api/axiosClient';

const useRecordingStatus = ({ setRecordingBusy, setRecordingError }) => {
  const [recordings, setRecordings] = useState([]);
  const [recordingStatuses, setRecordingStatuses] = useState({});

  const addUploadedRecording = (uploaded) => {
    setRecordings((current) => {
      const exists = current.some((item) => item.id === uploaded.id);
      return exists
        ? current.map((item) => item.id === uploaded.id ? uploaded : item)
        : [...current, uploaded];
    });
    setRecordingStatuses((current) => ({
      ...current,
      [uploaded.id]: { status: uploaded.status || 'pending' },
    }));
  };

  const recordingPollKey = useMemo(() => JSON.stringify(
    recordings
      .filter((item) => ['pending', 'processing'].includes(
        recordingStatuses[item.id]?.status || item.status,
      ))
      .map((item) => item.id)
      .sort(),
  ), [recordings, recordingStatuses]);

  useEffect(() => {
    const recordingIds = JSON.parse(recordingPollKey);
    if (!recordingIds.length) return undefined;
    let active = true;

    const poll = async () => {
      const results = await Promise.allSettled(
        recordingIds.map((recordingId) => getRecordingStatus(recordingId)),
      );
      if (!active) return;

      setRecordingStatuses((current) => {
        const next = { ...current };
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') next[recordingIds[index]] = result.value;
        });
        return next;
      });

      const failedResult = results.find((result) => result.status === 'rejected');
      if (failedResult) {
        setRecordingError(getApiErrorMessage(
          failedResult.reason,
          'Không thể tải trạng thái của một bản ghi.',
        ));
      }
    };

    const timer = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [recordingPollKey, setRecordingError]);

  const handleAnalyzeRecording = async (recordingId) => {
    if (!recordingId) return;
    try {
      setRecordingBusy(true);
      setRecordingError('');
      const nextStatus = await requestRecordingAnalysis(recordingId);
      setRecordingStatuses((current) => ({ ...current, [recordingId]: nextStatus }));
    } catch (error) {
      setRecordingError(getApiErrorMessage(error, 'Không thể yêu cầu phân tích bản ghi.'));
    } finally {
      setRecordingBusy(false);
    }
  };

  const handlePlaybackRecording = async (recordingId) => {
    if (!recordingId) return;
    try {
      setRecordingError('');
      const playback = await getRecordingPlayback(recordingId);
      if (!playback?.url) throw new Error('Chưa thể mở bản ghi này. Vui lòng thử lại sau.');
      window.open(playback.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setRecordingError(getApiErrorMessage(error, 'Không thể mở bản ghi.'));
    }
  };

  return {
    recordings,
    recordingStatuses,
    addUploadedRecording,
    handleAnalyzeRecording,
    handlePlaybackRecording,
  };
};

export default useRecordingStatus;
