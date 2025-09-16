import { useEffect, useRef, useState } from 'react';

interface UsePortalOptions {
  /** Container element to append portal to. Defaults to document.body */
  container?: Element | null;
  /** CSS class to apply to portal container */
  className?: string;
}

/**
 * Hook for managing portal containers
 * Provides a ref to the portal container and handles cleanup
 */
export const usePortal = (options: UsePortalOptions = {}) => {
  const { container = null, className = '' } = options;
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Create portal container element
    const element = document.createElement('div');

    // Apply className if provided
    if (className) {
      element.className = className;
    }

    elementRef.current = element;

    // Append to specified container or document.body
    const targetContainer = container || document.body;
    targetContainer.appendChild(element);

    setMounted(true);

    // Cleanup function to remove portal element
    return () => {
      if (elementRef.current && targetContainer.contains(elementRef.current)) {
        targetContainer.removeChild(elementRef.current);
      }
    };
  }, [container, className]);

  return {
    /** Reference to the portal container element */
    portalRef: elementRef,
    /** Whether the portal is currently mounted */
    mounted,
    /** The portal container element */
    container: elementRef.current,
  };
};

export default usePortal;
