import axiosClient from './axiosClient';

export const getMeetingReport = (meetingId, params) => (
  axiosClient.get(`/meetings/${meetingId}/report`, { params })
);

export const getRecordingAnalysis = (recordingId, params) => (
  axiosClient.get(`/recordings/${recordingId}/analysis`, { params })
);

// Contract v1 section 5.3: after_session meetings with a completed analysis only.
// Otherwise the API answers 409 and error.response.data.data.code tells why.
export const getEmotionTimeline = (meetingId, params) => (
  axiosClient.get(`/meetings/${meetingId}/emotions/timeline`, { params })
);

// Contract v1 section 5.5: answers come from the stored timeline, with seekable references.
export const askTimelineChat = (meetingId, question, recordingId = null) => (
  axiosClient.post(`/meetings/${meetingId}/chat`, { question, recording_id: recordingId })
);

// Signed, short-lived (5 minutes) URL for the recording video.
export const getRecordingPlayback = (recordingId) => (
  axiosClient.get(`/recordings/${recordingId}/playback`)
);

// Reads the BE error envelope: { data: { code, details } }.
export const getApiErrorInfo = (error) => {
  const payload = error?.response?.data?.data || {};
  return {
    status: error?.response?.status,
    code: payload.code,
    dataStatus: payload.details?.[0]?.data_status,
    message: error?.response?.data?.message || error?.message,
  };
};
