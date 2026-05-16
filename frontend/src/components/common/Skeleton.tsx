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
    </>
  );
};

export default Skeleton;
