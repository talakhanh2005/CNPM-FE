import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

const documentMimes = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
};

export const uploadMaterial = (meetingId, file) => dataOf(axiosClient.post(
  `/meetings/${meetingId}/materials`,
  file,
  {
    params: { filename: file.name },
    headers: {
      'Content-Type': documentMimes[file.name.split('.').pop()?.toLowerCase()] || file.type || 'application/octet-stream',
    },
  },
));

export const getMeetingMaterials = (meetingId, params = {}) => (
  dataOf(axiosClient.get(`/meetings/${meetingId}/materials`, { params }))
);

export const getMaterialDownload = (materialId) => (
  dataOf(axiosClient.get(`/materials/${materialId}/download`))
);
