import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps a page in a lightweight CSS fade-in animation.
 * Using CSS animation instead of JS-based animation libraries
 * ensures zero JS overhead on navigation.
 */
const PageTransition = ({ children }: PageTransitionProps) => (
  <div className="page-transition-wrapper">
    {children}
  </div>
);

export default PageTransition;
