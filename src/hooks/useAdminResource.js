import { useCallback, useEffect, useState } from 'react';
import { getAdminError } from '../utils/adminErrors';

// Keep results tied to their request so an old page or account never flashes
// while a new request is loading. The caller supplies a stable loader.
export default function useAdminResource(load) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const updateData = useCallback((data) => setResult({ load, revision, data, error: '' }), [load, revision]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => load(controller.signal)).then((data) => {
      if (!controller.signal.aborted) setResult({ load, revision, data, error: '' });
    }).catch((cause) => {
      if (!controller.signal.aborted) setResult({ load, revision, data: null, error: getAdminError(cause) });
    });
    return () => controller.abort();
  }, [load, revision]);
  const current = result?.load === load && result?.revision === revision;
  return { data: current ? result.data : null, error: current ? result.error : '', loading: !current, refresh, updateData };
}
