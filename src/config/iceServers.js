const splitUrls = (value) => value
  ?.split(',')
  .map((url) => url.trim())
  .filter(Boolean) || [];

const defaultStunUrls = ['stun:stun.l.google.com:19302'];

export const getFallbackIceServers = () => {
  const stunUrls = splitUrls(import.meta.env.VITE_STUN_URLS);
  const turnUrls = splitUrls(import.meta.env.VITE_TURN_URLS);
  const servers = [{ urls: stunUrls.length ? stunUrls : defaultStunUrls }];

  if (turnUrls.length && import.meta.env.VITE_TURN_USERNAME && import.meta.env.VITE_TURN_CREDENTIAL) {
    servers.push({
      urls: turnUrls,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }

  return servers;
};

export const fallbackIceServers = getFallbackIceServers();

export const normalizeIceServers = (servers) => {
  if (!Array.isArray(servers)) return fallbackIceServers;
  const validServers = servers.filter((server) => {
    if (!server || typeof server !== 'object') return false;
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => typeof url === 'string' && url.trim());
  });
  return validServers.length ? validServers : fallbackIceServers;
};

export const hasTurnServer = (servers) => servers.some((server) => {
  const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
  return urls.some((url) => typeof url === 'string' && url.startsWith('turn'));
});
