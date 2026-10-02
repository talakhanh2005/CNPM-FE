import axios from 'axios';
import { apiBaseUrl } from '../config/runtime';
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from '../utils/session';
import { apiErrorMessage } from '../utils/validation';

export { apiBaseUrl } from '../config/runtime';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use((response) => response.data);

let refreshRequest = null;

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Không có refresh token.');
  if (!refreshRequest) {
    refreshRequest = axios.post(`${apiBaseUrl}/auth/refresh`, { refresh_token: refreshToken })
      .then(({ data }) => {
        const tokens = data?.data;
        if (!tokens?.access_token || !tokens?.refresh_token) throw new Error('Phản hồi refresh token không hợp lệ.');
        saveTokens(tokens);
        return tokens.access_token;
      })
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
};

axiosClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config;
  const canRefresh = error.response?.status === 401
    && request
    && !request._retry
    && !['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']
      .some((path) => String(request.url || '').includes(path))
    && Boolean(getRefreshToken());

  if (!canRefresh) throw error;
  request._retry = true;
  try {
    const accessToken = await refreshAccessToken();
    request.headers.Authorization = `Bearer ${accessToken}`;
    return axiosClient(request);
  } catch (refreshError) {
    clearSession();
    globalThis.dispatchEvent?.(new Event('auth:session-expired'));
    throw refreshError;
  }
});

export const getApiErrorMessage = apiErrorMessage;

export default axiosClient;
