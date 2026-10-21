import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

export const getMeetingReport = (meetingId, params = {}) => (
  dataOf(axiosClient.get(`/meetings/${meetingId}/report`, { params }))
);

export const askReportQuestion = (meetingId, question) => (
  dataOf(axiosClient.post(`/meetings/${meetingId}/chat`, { question }))
);

export const getRecordingAnalysis = (recordingId, params = {}) => (
  dataOf(axiosClient.get(`/recordings/${recordingId}/analysis`, { params }))
);

export const getRecordingStatus = (recordingId) => (
  dataOf(axiosClient.get(`/recordings/${recordingId}/status`))
);

export const requestRecordingAnalysis = (recordingId) => (
  dataOf(axiosClient.post(`/recordings/${recordingId}/analyze`))
);
