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

// Access tokens live 15 minutes. The BE rotates both tokens on refresh, so only one
// refresh may run at a time; concurrent 401s wait for the same promise.
let refreshing = null;

const refreshSession = async () => {
  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');
  // Plain axios: this request must not go through the 401 interceptor again.
  const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, { refresh_token: refreshToken });
  const tokens = data?.data || data;
  sessionStorage.setItem('accessToken', tokens.access_token);
  sessionStorage.setItem('refreshToken', tokens.refresh_token);
  return tokens.access_token;
};

axiosClient.interceptors.response.use((response) => {
  const envelope = response.data;
  return envelope && Object.prototype.hasOwnProperty.call(envelope, 'data')
    ? envelope.data
    : envelope;
}, async (error) => {
  const original = error.config;
  const isAuthCall = original?.url?.startsWith('/auth/');
  if (error.response?.status !== 401 || !original || original.retried || isAuthCall) {
    return Promise.reject(error);
  }
  original.retried = true;
  try {
    refreshing = refreshing || refreshSession().finally(() => { refreshing = null; });
    const token = await refreshing;
    original.headers.Authorization = `Bearer ${token}`;
    return axiosClient(original);
  } catch {
    clearSession();
    return Promise.reject(error);
  }
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
