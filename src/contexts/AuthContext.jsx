import { useCallback, useMemo, useState } from 'react';
import { loginApi, registerApi } from '../api/authApi';
import { clearSession } from '../api/axiosClient';
import AuthContext from './AuthContextValue';

export { AuthContext } from './AuthContextValue';

const readStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('mockUser') || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (credentials) => {
    const response = await loginApi(credentials);
    const { token, user: nextUser } = response.data;
    sessionStorage.setItem('mockSession', token);
    sessionStorage.setItem('mockUser', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback((payload) => registerApi(payload), []);

  const logout = useCallback(() => {
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
