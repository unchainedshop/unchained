import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Settings = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/security');
  }, []);

  return null;
};

export default Settings;
