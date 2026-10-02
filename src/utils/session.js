const KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'currentUser',
};

const storages = () => [globalThis.sessionStorage, globalThis.localStorage].filter(Boolean);

const read = (key) => {
  for (const storage of storages()) {
    const value = storage.getItem(key);
    if (value) return value;
  }
  return null;
};

const activeStorage = () => (
  globalThis.localStorage?.getItem(KEYS.refreshToken)
    ? globalThis.localStorage
    : globalThis.sessionStorage
);

export const getAccessToken = () => read(KEYS.accessToken);
export const getRefreshToken = () => read(KEYS.refreshToken);

export const getStoredUser = () => {
  try {
    return JSON.parse(read(KEYS.user) || 'null');
  } catch {
    return null;
  }
};

export const clearSession = () => {
  storages().forEach((storage) => Object.values(KEYS).forEach((key) => storage.removeItem(key)));
};

export const saveTokens = (tokens, remember) => {
  const storage = remember === undefined ? activeStorage() : (remember ? globalThis.localStorage : globalThis.sessionStorage);
  if (!storage) return;
  if (remember !== undefined) clearSession();
  storage.setItem(KEYS.accessToken, tokens.access_token);
  storage.setItem(KEYS.refreshToken, tokens.refresh_token);
};

export const saveUser = (user) => {
  activeStorage()?.setItem(KEYS.user, JSON.stringify(user));
};
