import React from 'react';
import { Skeleton } from './ui/Skeleton';

/**
 * SkeletonLoader — alias rétrocompat. Préférer `Skeleton` depuis `components/ui`
 * dans le code neuf.
 */
interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'avatar' | 'button' | 'guidance';
  lines?: number;
  className?: string;
  height?: string;
  width?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 3,
  className = '',
  height,
  width,
}) => {
  const sizeStyle =
    height || width
      ? `${height ? `h-[${height}] ` : ''}${width ? `w-[${width}]` : ''}`
      : '';

  switch (type) {
    case 'avatar':
      return <Skeleton rounded="full" className={`w-12 h-12 ${className}`} />;
    case 'button':
      return <Skeleton rounded="full" className={`h-12 w-32 ${className}`} />;
    case 'card':
      return (
        <Skeleton
          rounded="2xl"
          className={`w-full ${height ? '' : 'h-44'} ${sizeStyle} ${className}`}
        />
      );
    case 'guidance':
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="flex items-center gap-4">
            <Skeleton rounded="full" className="w-12 h-12" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 ${i === 3 ? 'w-2/3' : 'w-full'}`}
              />
            ))}
          </div>
        </div>
      );
    case 'text':
    default:
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            />
          ))}
        </div>
      );
  }
};

export default SkeletonLoader;
