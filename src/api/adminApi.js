import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);
const userPath = (id) => `/v1/users/${encodeURIComponent(id)}`;

export const getAdminUsers = (params, signal) => (
  dataOf(axiosClient.get('/admin/users', { params, signal }))
);

export const getAdminMeetings = (params, signal) => (
  dataOf(axiosClient.get('/admin/meetings', { params, signal }))
);

export const getAdminUser = (id, signal) => dataOf(axiosClient.get(userPath(id), { signal }));
export const updateAdminUser = (id, payload) => dataOf(axiosClient.put(userPath(id), payload));
export const deleteAdminUser = (id) => dataOf(axiosClient.delete(userPath(id)));
export const getAdminProfile = (signal) => dataOf(axiosClient.get('/v1/users/me', { signal }));
export const updateAdminProfile = (payload) => dataOf(axiosClient.put('/v1/users/me', payload));
