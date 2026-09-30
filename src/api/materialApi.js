import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

export const uploadMaterial = (meetingId, file) => dataOf(axiosClient.post(
  `/meetings/${meetingId}/materials`,
  file,
  {
    params: { filename: file.name },
    headers: { 'Content-Type': file.type },
  },
));

export const getMeetingMaterials = (meetingId, params = {}) => (
  dataOf(axiosClient.get(`/meetings/${meetingId}/materials`, { params }))
);

export const getMaterialDownload = (materialId) => (
  dataOf(axiosClient.get(`/materials/${materialId}/download`))
);
