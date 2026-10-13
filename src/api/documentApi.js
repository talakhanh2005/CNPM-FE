import axiosClient from './axiosClient';

// Teaching materials (raw body upload, visible to the whole class).
export const uploadMaterial = (meetingId, file) => axiosClient.post(
  `/meetings/${meetingId}/materials`,
  file,
  { params: { filename: file.name }, headers: { 'Content-Type': file.type } },
);
export const listMaterials = (meetingId, params) => axiosClient.get(`/meetings/${meetingId}/materials`, { params });
export const getMaterialDownload = (materialId) => axiosClient.get(`/materials/${materialId}/download`);

// Shared documents (multipart upload, private until shared).
export const uploadDocument = (meetingId, file, tags = '') => {
  const form = new FormData();
  form.append('file', file);
  if (tags) form.append('tags', tags);
  return axiosClient.post(`/meetings/${meetingId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
// params: { page, size, q, tag, from_date, to_date, include_revoked }
export const listDocuments = (meetingId, params) => axiosClient.get(`/meetings/${meetingId}/documents`, { params });
export const getDocument = (meetingId, documentId) => axiosClient.get(`/meetings/${meetingId}/documents/${documentId}`);
export const deleteDocument = (meetingId, documentId) => axiosClient.delete(`/meetings/${meetingId}/documents/${documentId}`);
// accountIds = [] shares with / hides from the whole class.
export const shareDocument = (meetingId, documentId, accountIds = []) => axiosClient.patch(
  `/meetings/${meetingId}/documents/${documentId}/share`, { account_ids: accountIds },
);
export const unshareDocument = (meetingId, documentId, accountIds = []) => axiosClient.patch(
  `/meetings/${meetingId}/documents/${documentId}/unshare`, { account_ids: accountIds },
);
export const revokeDocument = (meetingId, documentId) => axiosClient.post(`/meetings/${meetingId}/documents/${documentId}/revoke`);
export const restoreDocument = (meetingId, documentId) => axiosClient.post(`/meetings/${meetingId}/documents/${documentId}/restore`);
export const generateShareLink = (meetingId, documentId, expiresInHours = 24) => axiosClient.post(
  `/meetings/${meetingId}/documents/${documentId}/generate-share-link`, { expires_in_hours: expiresInHours },
);
// sharePath comes from the API ("/share/documents/<token>"); no login needed.
export const getSharedDocument = (sharePath) => axiosClient.get(sharePath);
