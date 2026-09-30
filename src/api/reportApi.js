import axiosClient from './axiosClient';

export const getMeetingReport = (meetingId, params) => (
  axiosClient.get(`/meetings/${meetingId}/report`, { params })
);

export const getRecordingAnalysis = (recordingId, params) => (
  axiosClient.get(`/recordings/${recordingId}/analysis`, { params })
);
