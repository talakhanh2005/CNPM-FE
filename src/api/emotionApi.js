import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

export const submitEmotionFrame = (meetingId, frame) => (
  dataOf(axiosClient.post(`/meetings/${meetingId}/frames`, frame))
);

export const getEmotionLogs = (meetingId, params = {}) => (
  dataOf(axiosClient.get(`/meetings/${meetingId}/emotion-logs`, { params }))
);
