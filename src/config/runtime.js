const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

export const apiBaseUrl = stripTrailingSlash(import.meta.env.VITE_API_URL || '/api');

const defaultWebSocketBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const source = apiBaseUrl.startsWith('http') ? new URL(apiBaseUrl) : new URL(window.location.origin);
  source.protocol = source.protocol === 'https:' ? 'wss:' : 'ws:';
  source.pathname = '';
  source.search = '';
  source.hash = '';
  return stripTrailingSlash(source.toString());
};

export const webSocketBaseUrl = stripTrailingSlash(
  import.meta.env.VITE_WS_URL || defaultWebSocketBaseUrl(),
);

export const meetingWebSocketUrl = (meetingId) => (
  `${webSocketBaseUrl}/ws/meetings/${encodeURIComponent(meetingId)}`
);
