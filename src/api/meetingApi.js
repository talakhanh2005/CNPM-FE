import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

export const createRoom = (settings) => dataOf(axiosClient.post('/rooms', settings));

export const getRoom = (roomId) => dataOf(axiosClient.get(`/rooms/${roomId}`));

export const joinRoom = (code) => dataOf(axiosClient.post('/rooms/join', { code }));

export const leaveRoom = (roomId) => dataOf(axiosClient.post(`/rooms/${roomId}/leave`));

export const getMeetingHistory = () => dataOf(axiosClient.get('/meetings/history'));

export const saveMeetingRecording = (roomId, recordingData) =>
  dataOf(axiosClient.post(`/meetings/${roomId}/recording`, recordingData));

export const disconnectRoomOnPageExit = (roomId) => fetch(`/api/rooms/${roomId}/disconnect`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('mockSession') || ''}`,
  },
  keepalive: true,
}).catch(() => undefined);
