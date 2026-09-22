import axiosClient from './axiosClient';

export const registerApi = (payload) => axiosClient.post('/auth/register', payload);

export const loginApi = (payload) => axiosClient.post('/auth/login', payload);
