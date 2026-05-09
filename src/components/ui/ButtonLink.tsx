import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from './Button';
import { cn } from '../../lib/utils';

const MotionLink = motion(Link);

type ButtonLinkProps = Omit<LinkProps, 'children' | 'size'> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    className?: string;
  };

/**
 * Lien naviguant avec le style des boutons (accessibilité : clic droit, ouverture nouvel onglet, prefetch).
 */
export function ButtonLink({
  to,
  variant,
  size,
  fullWidth,
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <MotionLink
      to={to}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </MotionLink>
  );
}
