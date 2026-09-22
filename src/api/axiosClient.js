import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('mockSession');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use((response) => response.data);

export const clearSession = () => {
  sessionStorage.removeItem('mockSession');
  sessionStorage.removeItem('mockUser');
};

export const getApiErrorMessage = (error, fallback = 'Đã có lỗi xảy ra.') => (
  error?.response?.data?.message || error?.message || fallback
);

export default axiosClient;
