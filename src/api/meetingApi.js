import axiosClient, { apiBaseUrl } from './axiosClient';

const dataOf = (request) => request;

export const createRoom = (settings) => dataOf(axiosClient.post('/meetings', settings));

export const getRoom = (roomId) => dataOf(axiosClient.get(`/meetings/${roomId}`));

export const joinRoom = (code) => dataOf(axiosClient.post('/meetings/join', { code }));

export const leaveRoom = (roomId) => dataOf(axiosClient.post(`/meetings/${roomId}/leave`));

export const closeRoom = (roomId) => dataOf(axiosClient.post(`/meetings/${roomId}/end`));

export const getMeetingHistory = (params) => dataOf(axiosClient.get('/meetings', { params }));

export const saveMeetingRecording = (roomId, recordingData, contentType = 'video/webm') =>
  dataOf(axiosClient.post(`/meetings/${roomId}/recordings`, recordingData, {
    headers: { 'Content-Type': contentType },
  }));

export const joinMeeting = (meetingId) => dataOf(axiosClient.post(`/meetings/${meetingId}/join`));
export const getIceConfig = (meetingId) => dataOf(axiosClient.get(`/meetings/${meetingId}/ice-config`));
export const sendFrame = (meetingId, payload) => dataOf(axiosClient.post(`/meetings/${meetingId}/frames`, payload));
export const getMeetingReport = (meetingId, params) => dataOf(axiosClient.get(`/meetings/${meetingId}/report`, { params }));
export const getEmotionLogs = (meetingId, params) => dataOf(axiosClient.get(`/meetings/${meetingId}/emotion-logs`, { params }));
export const getRecordingStatus = (recordingId) => dataOf(axiosClient.get(`/recordings/${recordingId}/status`));
export const analyzeRecording = (recordingId) => dataOf(axiosClient.post(`/recordings/${recordingId}/analyze`));

export const disconnectRoomOnPageExit = (roomId) => fetch(`${apiBaseUrl}/meetings/${roomId}/leave`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('accessToken') || ''}`,
  },
  keepalive: true,
}).catch(() => undefined);
