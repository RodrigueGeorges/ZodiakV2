import { Moon, Sun, Star, Sparkle } from 'lucide-react';
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-32 h-32',
};
const ringMap = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-32 h-32',
};
const middleMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-24 h-24',
};
const sunMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-16 h-16',
};
const centerStarMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};
const moonMap = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};
const sparkleMap = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export function Logo({ size = 'md', className = '', style }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`} style={style}>
      {/* Outer cosmic ring */}
      <div className={`absolute ${ringMap[size]} rounded-full border-2 border-primary/30 animate-spin-slow`}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <Star className={`${sparkleMap[size]} text-primary animate-cosmic-pulse`} />
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <Star className={`${sparkleMap[size]} text-primary animate-cosmic-pulse`} />
        </div>
        <div className="absolute -left-1 top-1/2 -translate-y-1/2">
          <Star className={`${sparkleMap[size]} text-primary animate-cosmic-pulse`} />
        </div>
        <div className="absolute -right-1 top-1/2 -translate-y-1/2">
          <Star className={`${sparkleMap[size]} text-primary animate-cosmic-pulse`} />
        </div>
      </div>

      {/* Middle cosmic ring */}
      <div className={`absolute ${middleMap[size]} rounded-full border-2 border-secondary/30 animate-reverse-spin`}>
        <div className="absolute top-1/2 -translate-y-1/2 -left-3">
          <Moon className={`${moonMap[size]} text-primary animate-float`} />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-3">
          <Moon className={`${moonMap[size]} text-primary animate-float-reverse`} />
        </div>
      </div>

      {/* Central sun with glowing effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 animate-glow" />
        <Sun className={`${sunMap[size]} text-primary animate-glow relative z-10`} />
        <Star className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${centerStarMap[size]} text-primary/90`} />
      </div>

      {/* Floating sparkles */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Sparkle className={`${sparkleMap[size]} text-primary animate-float`} />
      </div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
        <Sparkle className={`${sparkleMap[size]} text-primary animate-float-delayed`} />
      </div>
      <div className="absolute top-1/2 -left-4 -translate-y-1/2">
        <Sparkle className={`${sparkleMap[size]} text-primary animate-float-reverse`} />
      </div>
      <div className="absolute top-1/2 -right-4 -translate-y-1/2">
        <Sparkle className={`${sparkleMap[size]} text-primary animate-float-reverse-delayed`} />
      </div>

      {/* Additional decorative stars */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Logo;