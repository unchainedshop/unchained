import { ReactNode } from 'react';

export interface PortalProps {
  /** The content to render in the portal */
  children: ReactNode;
  /** Optional container element. Defaults to document.body */
  container?: Element | null;
  /** Optional CSS class to apply to the portal container */
  className?: string;
}

export interface PortalRef {
  /** Reference to the portal container element */
  container: HTMLDivElement | null;
  /** Whether the portal is currently mounted */
  mounted: boolean;
}
