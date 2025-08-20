import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'avatar' | 'button' | 'guidance';
  lines?: number;
  className?: string;
  height?: string;
  width?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 1,
  className = '',
  height,
  width
}) => {
  const baseClasses = 'bg-cosmic-700 rounded animate-pulse';
  
  const variants = {
    shimmer: {
      background: [
        'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
        'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
      ],
      backgroundSize: ['200% 100%', '200% 100%'],
      x: ['-100%', '100%']
    }
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
              <motion.div
                key={index}
                className={`${baseClasses} h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
                animate={{
                  background: [
                    'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                    'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
                  ],
                  backgroundSize: ['200% 100%', '200% 100%'],
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.1
                }}
              />
            ))}
          </div>
        );

      case 'card':
        return (
          <motion.div
            className={`${baseClasses} p-6 ${className}`}
            style={{ height: height || '200px', width: width || '100%' }}
            animate={{
              background: [
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
              ],
              backgroundSize: ['200% 100%', '200% 100%'],
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="space-y-3">
              <div className="h-6 bg-cosmic-600 rounded w-3/4"></div>
              <div className="h-4 bg-cosmic-600 rounded w-full"></div>
              <div className="h-4 bg-cosmic-600 rounded w-5/6"></div>
            </div>
          </motion.div>
        );

      case 'avatar':
        return (
          <motion.div
            className={`${baseClasses} rounded-full ${className}`}
            style={{ height: height || '40px', width: width || '40px' }}
            animate={{
              background: [
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
              ],
              backgroundSize: ['200% 100%', '200% 100%'],
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );

      case 'button':
        return (
          <motion.div
            className={`${baseClasses} h-12 rounded-lg ${className}`}
            style={{ width: width || '120px' }}
            animate={{
              background: [
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
              ],
              backgroundSize: ['200% 100%', '200% 100%'],
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );

      case 'guidance':
        return (
          <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-12 h-12 bg-cosmic-700 rounded-full"
                animate={{
                  background: [
                    'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                    'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
                  ],
                  backgroundSize: ['200% 100%', '200% 100%'],
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  className="h-4 bg-cosmic-700 rounded w-1/2"
                  animate={{
                    background: [
                      'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                      'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
                    ],
                    backgroundSize: ['200% 100%', '200% 100%'],
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.1
                  }}
                />
                <motion.div
                  className="h-3 bg-cosmic-700 rounded w-1/4"
                  animate={{
                    background: [
                      'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                      'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
                    ],
                    backgroundSize: ['200% 100%', '200% 100%'],
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-4 bg-cosmic-700 rounded ${index === 3 ? 'w-2/3' : 'w-full'}`}
                  animate={{
                    background: [
                      'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                      'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
                    ],
                    backgroundSize: ['200% 100%', '200% 100%'],
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3 + index * 0.1
                  }}
                />
              ))}
            </div>
          </div>
        );

      default:
        return (
          <motion.div
            className={`${baseClasses} ${className}`}
            style={{ height: height || '20px', width: width || '100%' }}
            animate={{
              background: [
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
              ],
              backgroundSize: ['200% 100%', '200% 100%'],
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
