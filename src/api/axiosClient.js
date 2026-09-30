import axios from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_URL || '/api';
export const apiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, '');

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use((response) => {
  const envelope = response.data;
  return envelope && Object.prototype.hasOwnProperty.call(envelope, 'data')
    ? envelope.data
    : envelope;
});

export const clearSession = () => {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('currentUser');
};

export const getApiErrorMessage = (error, fallback = 'Đã có lỗi xảy ra.') => (
  error?.response?.data?.message
    || error?.response?.data?.detail
    || error?.message
    || fallback
);

export default axiosClient;
