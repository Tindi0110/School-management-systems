import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'avatar' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rect', 
  width, 
  height,
  count = 1 
}) => {
  const baseClass = "skeleton-box";
  const variantClass = variant === 'avatar' || variant === 'circle' ? 'rounded-full' : 
                     variant === 'text' ? 'rounded-md h-4' : 'rounded-lg';
  
  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`${baseClass} ${variantClass} ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || (variant === 'avatar' ? '40px' : variant === 'text' ? '16px' : '100%'),
        marginBottom: count > 1 ? '0.75rem' : '0'
      }}
    />
  ));

  return (
    <>
      {skeletons}
      <style>{`
        .skeleton-box {
          position: relative;
          overflow: hidden;
          background-color: #e5e7eb;
        }
        .skeleton-box::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 2s infinite;
          content: '';
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
};

export default Skeleton;
