import { useEffect, useRef, useCallback } from 'react';

const useOutsideClick = (callback) => {
  const ref = useRef<HTMLButtonElement>(undefined);

  // Create a memoized version of the handleClick function
  const handleClick = useCallback(
    (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    },
    [ref, callback],
  );

  useEffect(() => {
    if (document) {
      document.addEventListener('click', handleClick);

      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, [handleClick]);

  return ref;
};

export default useOutsideClick;
