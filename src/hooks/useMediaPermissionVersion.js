import { useEffect, useState } from 'react';

const permissionNames = ['camera', 'microphone'];

const useMediaPermissionVersion = () => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;

    let disposed = false;
    const statuses = [];
    const handleChange = () => setVersion((current) => current + 1);

    const watchPermissions = async () => {
      const results = await Promise.allSettled(
        permissionNames.map((name) => navigator.permissions.query({ name })),
      );

      results.forEach((result) => {
        if (result.status !== 'fulfilled' || !result.value) return;
        if (disposed) return;
        statuses.push(result.value);
        result.value.addEventListener('change', handleChange);
      });
    };

    watchPermissions();

    return () => {
      disposed = true;
      statuses.forEach((status) => status.removeEventListener('change', handleChange));
    };
  }, []);

  return version;
};

export default useMediaPermissionVersion;
