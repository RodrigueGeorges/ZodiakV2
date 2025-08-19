import React from 'react';
import { Logo as CosmicLogo } from './Logo/index';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  variant?: 'classic' | 'cosmic';
}

export function Logo({ size = 'md', className = '', style, variant = 'cosmic' }: LogoProps) {
  return (
    <CosmicLogo 
      size={size} 
      className={className} 
      variant={variant}
      style={style}
    />
  );
}

export default Logo;