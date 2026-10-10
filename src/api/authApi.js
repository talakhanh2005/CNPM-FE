import axiosClient from './axiosClient';

const dataOf = (request) => request.then((response) => response.data);

export const registerApi = (payload) => dataOf(axiosClient.post('/auth/register', payload));

export const loginApi = (payload) => dataOf(axiosClient.post('/auth/login', payload));

export const getCurrentUserApi = () => dataOf(axiosClient.get('/auth/me'));

export const logoutApi = (refreshToken) => dataOf(axiosClient.post('/auth/logout', {
  refresh_token: refreshToken,
}));
