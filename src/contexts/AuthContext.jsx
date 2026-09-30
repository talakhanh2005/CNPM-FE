import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentUserApi, loginApi, logoutApi, registerApi } from '../api/authApi';
import { clearSession, getAccessToken, getRefreshToken, getStoredUser, saveTokens, saveUser } from '../utils/session';
import AuthContext from './AuthContextValue';

export { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(getAccessToken()));

  useEffect(() => {
    let active = true;
    const expire = () => {
      if (active) setUser(null);
    };
    globalThis.addEventListener?.('auth:session-expired', expire);

    if (!getAccessToken()) {
      return () => globalThis.removeEventListener?.('auth:session-expired', expire);
    }

    getCurrentUserApi()
      .then((nextUser) => {
        if (!active) return;
        saveUser(nextUser);
        setUser(nextUser);
      })
      .catch(() => {
        clearSession();
        if (active) setUser(null);
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => {
      active = false;
      globalThis.removeEventListener?.('auth:session-expired', expire);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { remember = false, ...payload } = credentials;
    const tokens = await loginApi(payload);
    saveTokens(tokens, remember);
    const nextUser = await getCurrentUserApi();
    saveUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback((payload) => registerApi(payload), []);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    const request = refreshToken ? logoutApi(refreshToken).catch(() => undefined) : Promise.resolve();
    return request.finally(() => {
      clearSession();
      setUser(null);
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }), [isLoading, login, logout, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
