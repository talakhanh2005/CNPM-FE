import { useCallback, useMemo, useState } from 'react';
import { loginApi, logoutApi, meApi, registerApi } from '../api/authApi';
import { clearSession } from '../api/axiosClient';
import AuthContext from './AuthContextValue';

export { AuthContext } from './AuthContextValue';

const readStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (credentials) => {
    const response = await loginApi(credentials);
    const { access_token, refresh_token } = response;
    sessionStorage.setItem('accessToken', access_token);
    sessionStorage.setItem('refreshToken', refresh_token);
    const nextUser = await meApi();
    sessionStorage.setItem('currentUser', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback((payload) => registerApi(payload), []);

  const logout = useCallback(async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) await logoutApi(refreshToken).catch(() => undefined);
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading: false,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }), [login, logout, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
