import axiosClient, { apiBaseUrl } from './axiosClient';

const dataOf = (request) => request;

export const createRoom = (settings) => dataOf(axiosClient.post('/meetings', settings));

export const getRoom = (roomId) => dataOf(axiosClient.get(`/meetings/${roomId}`));

// Checks a room code without joining it (404 unknown, 409 not ongoing, 403 not allowed).
export const lookupRoomCode = (code) => dataOf(axiosClient.get('/meetings/lookup', { params: { code } }));

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
// Contract v1 section 5.1: realtime meetings only; the frame lives in RAM on the server.
export const inferEmotion = (meetingId, payload) => dataOf(
  axiosClient.post(`/meetings/${meetingId}/emotions/infer`, payload),
);
export const getMeetingReport = (meetingId, params) => dataOf(axiosClient.get(`/meetings/${meetingId}/report`, { params }));
export const getEmotionLogs = (meetingId, params) => dataOf(axiosClient.get(`/meetings/${meetingId}/emotion-logs`, { params }));
export const getRecordingStatus = (recordingId) => dataOf(axiosClient.get(`/recordings/${recordingId}/status`));
export const analyzeRecording = (recordingId) => dataOf(axiosClient.post(`/recordings/${recordingId}/analyze`));

// Room features merged from BE A.
// params: { page, size, q, status, recording_status, from_date, to_date }; without page the data is an array.
export const getFilteredHistory = (params) => dataOf(axiosClient.get('/meetings/history', { params }));
export const updateRoom = (roomId, changes) => dataOf(axiosClient.put(`/meetings/${roomId}`, changes));
export const deleteRoom = (roomId) => dataOf(axiosClient.delete(`/meetings/${roomId}`));
export const startRoom = (roomId) => dataOf(axiosClient.post(`/meetings/${roomId}/start`));
export const saveRecordingDuration = (roomId, durationSeconds) => dataOf(
  axiosClient.post(`/meetings/${roomId}/recording`, { duration_seconds: durationSeconds }),
);

// Page exit marks the member "disconnected" (not "left"), so a refresh can rejoin the room.
export const disconnectRoomOnPageExit = (roomId) => fetch(`${apiBaseUrl}/meetings/${roomId}/disconnect`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('accessToken') || ''}`,
  },
  keepalive: true,
}).catch(() => undefined);
