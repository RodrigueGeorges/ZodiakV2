import React from 'react';
import { Logo as CosmicLogo } from './Logo/index';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  variant?: 'classic' | 'cosmic';
  withWordmark?: boolean;
  wordmarkClassName?: string;
  composeOnLoad?: boolean;
  'aria-label'?: string;
}

export function Logo({
  size = 'md',
  className = '',
  style,
  withWordmark,
  wordmarkClassName,
  composeOnLoad,
}: LogoProps) {
  return (
    <CosmicLogo
      size={size}
      className={className}
      style={style}
      withWordmark={withWordmark}
      wordmarkClassName={wordmarkClassName}
      composeOnLoad={composeOnLoad}
    />
  );
}

export default Logo;
