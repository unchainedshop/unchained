import { useEffect, useRef } from 'react';

const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * useQuery options that poll only while the page is visible: gate devices lock their screen or
 * switch apps, and a hidden page has nothing to show.
 */
export const pollWhileVisible = (pollInterval: number) => ({ pollInterval, skipPollAttempt: isHidden });

/** Refetches as soon as the page is visible again instead of waiting for the next poll. */
const useRefetchWhenVisible = (refetch: () => unknown) => {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!isHidden()) refetchRef.current();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);
};

export default useRefetchWhenVisible;
