import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

const normalizeParticipant = (participant) => ({
  ...participant,
  id: participant.user_id,
  joinedAt: participant.joined_at,
  leftAt: participant.left_at,
});

export const normalizeMeeting = (meeting) => {
  if (!meeting) return null;
  const analysisMode = meeting.mode === 'after_session' ? 'batch' : 'realtime';
  const status = meeting.status === 'ongoing'
    ? 'active'
    : meeting.status === 'ended'
      ? 'closed'
      : meeting.status;

  return {
    ...meeting,
    name: meeting.name || `Phòng học #${meeting.code}`,
    hostId: meeting.teacher_id,
    studentId: meeting.student_id,
    analysisMode,
    emotionRecognition: analysisMode === 'realtime',
    status,
    createdAt: meeting.created_at,
    endedAt: meeting.ended_at,
    participants: (meeting.participants || []).map(normalizeParticipant),
  };
};

export const createRoom = ({ analysisMode }) => dataOf(axiosClient.post('/meetings', {
  status: 'ongoing',
  mode: analysisMode === 'batch' ? 'after_session' : 'realtime',
})).then(normalizeMeeting);

export const getRoom = (meetingId) => (
  dataOf(axiosClient.get(`/meetings/${meetingId}`)).then(normalizeMeeting)
);

export const joinRoom = (code) => (
  dataOf(axiosClient.post('/meetings/join', { code: code.trim().toUpperCase() })).then(normalizeMeeting)
);

export const leaveRoom = (meetingId) => (
  dataOf(axiosClient.post(`/meetings/${meetingId}/leave`)).then(normalizeMeeting)
);

export const closeRoom = (meetingId) => (
  dataOf(axiosClient.post(`/meetings/${meetingId}/end`)).then(normalizeMeeting)
);

export const startRoom = (meetingId) => (
  dataOf(axiosClient.post(`/meetings/${meetingId}/start`)).then(normalizeMeeting)
);

export const getIceConfig = (meetingId) => (
  dataOf(axiosClient.get(`/meetings/${meetingId}/ice-config`))
);

export const getMeetingHistory = (params = {}) => dataOf(axiosClient.get('/meetings', { params }))
  .then((result) => ({
    ...result,
    items: (result?.items || []).map((item) => normalizeMeeting({
      ...item,
      participants: [],
    })),
  }));

export const uploadMeetingRecording = (meetingId, videoBlob) => dataOf(axiosClient.post(
  `/meetings/${meetingId}/recordings`,
  videoBlob,
  {
    headers: {
      'Content-Type': videoBlob.type || 'video/webm',
    },
  },
));

export const getRecording = (recordingId) => (
  dataOf(axiosClient.get(`/recordings/${recordingId}`))
);

export const getRecordingPlayback = (recordingId) => (
  dataOf(axiosClient.get(`/recordings/${recordingId}/playback`))
);
