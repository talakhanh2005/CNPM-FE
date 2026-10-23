// BE returns timezone-aware ISO timestamps. Never replace a missing room anchor
// with Date.now() or a participant's joined_at: that would create separate clocks.
export const parseMeetingTimestamp = (value) => {
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const meetingElapsedSeconds = (startedAt, now = Date.now()) => (
  Number.isFinite(startedAt) && Number.isFinite(now)
    ? Math.max(0, Math.floor((now - startedAt) / 1000))
    : null
);

export const formatMeetingDuration = (seconds) => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};
