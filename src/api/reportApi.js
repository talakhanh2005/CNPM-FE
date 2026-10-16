import axiosClient from './axiosClient';
import { getMockMeetingReport } from '../mocks/meetingReports';

const dataOf = (request) => request.then((response) => response.data);

export const getMeetingReport = (meetingId, params = {}, context = {}) => (
  Promise.resolve(getMockMeetingReport(meetingId, params, context))
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
