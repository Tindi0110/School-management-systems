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
    <style>{`
      .page-transition-wrapper {
        animation: pageFadeIn 0.15s ease-out;
        will-change: opacity;
        contain: layout style;
      }
      @keyframes pageFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
    `}</style>
  </div>
);

export default PageTransition;
