import axiosClient from './axiosClient';

// Profile and admin user management (merged from BE A).
export const getProfile = () => axiosClient.get('/v1/users/me');
export const updateProfile = (changes) => axiosClient.put('/v1/users/me', changes);
export const listUsers = (params) => axiosClient.get('/v1/users', { params });
export const getUser = (userId) => axiosClient.get(`/v1/users/${userId}`);
export const updateUser = (userId, changes) => axiosClient.put(`/v1/users/${userId}`, changes);
export const deleteUser = (userId) => axiosClient.delete(`/v1/users/${userId}`);

// Room recording file and direct Cloudinary upload.
export const uploadRecordingFile = (meetingId, file) => {
  const form = new FormData();
  form.append('file', file);
  return axiosClient.post(`/meetings/${meetingId}/recording-file`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getMediaInfo = (publicId) => axiosClient.get(`/media/${publicId}`);
export const deleteMedia = (publicId) => axiosClient.delete(`/media/${publicId}`);
export const getSignedUpload = (options) => axiosClient.post('/media/signed-upload', options);
