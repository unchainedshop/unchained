import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PortalProps } from './Portal.types';

/**
 * Portal component that renders children at the document body level
 * to avoid z-index and overflow issues with dropdowns and modals.
 *
 * This component follows the same pattern as the existing Modal component
 * but provides a more generic and reusable implementation.
 *
 * @param children - The content to render in the portal
 * @param container - Optional container element. Defaults to document.body
 * @param className - Optional CSS class to apply to the portal container
 */
const Portal: React.FC<PortalProps> = ({
  children,
  container = null,
  className = '',
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

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

  // Don't render anything until mounted (SSR safety)
  if (!mounted || !elementRef.current || typeof window === 'undefined') {
    return null;
  }

  return createPortal(children, elementRef.current);
};

export default Portal;
