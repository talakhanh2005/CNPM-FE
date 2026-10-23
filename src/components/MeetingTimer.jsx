import { useEffect, useState } from 'react';
import { formatMeetingDuration, meetingElapsedSeconds, parseMeetingTimestamp } from '../utils/meetingTimer';

// Current FE rooms start immediately on creation. Use the same BE timestamp for
// every participant; scheduled starts will need a separate started_at from BE.
export default function MeetingTimer({ createdAt }) {
  const [now, setNow] = useState(Date.now);
  const anchor = parseMeetingTimestamp(createdAt);
  const seconds = meetingElapsedSeconds(anchor, now);

  useEffect(() => {
    if (anchor === null) return undefined;
    const update = () => setNow(Date.now());
    const interval = window.setInterval(update, 1000);
    window.addEventListener('pageshow', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pageshow', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [anchor]);

  return (
    <time aria-label="Thời gian trong phòng" dateTime={seconds === null ? undefined : `PT${seconds}S`}>
      {seconds === null ? '--:--:--' : formatMeetingDuration(seconds)}
    </time>
  );
}
