import axiosClient from './axiosClient';

export const registerApi = (payload) => axiosClient.post('/auth/register', payload);

export const loginApi = (payload) => axiosClient.post('/auth/login', payload);
export const refreshApi = (refresh_token) => axiosClient.post('/auth/refresh', { refresh_token });
export const meApi = () => axiosClient.get('/auth/me');
export const logoutApi = (refresh_token) => axiosClient.post('/auth/logout', { refresh_token });
