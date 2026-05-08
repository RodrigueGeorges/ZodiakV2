import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Card } from './Card';

/**
 * EmptyState — pour les zones vides (pas de guidance, pas de profil, etc.).
 * Toujours visuel, jamais une simple ligne de texte.
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: 'card' | 'plain';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = 'card',
}: EmptyStateProps) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'flex flex-col items-center text-center gap-4 py-10 px-6',
        className
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-aurora-500/10 text-aurora-300 ring-1 ring-aurora-500/20"
        >
          {icon}
        </div>
      )}
      <h3 className="font-cinzel text-h3 text-ivory-50">{title}</h3>
      {description && (
        <p className="text-body text-ivory-300 max-w-md">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </motion.div>
  );

  if (variant === 'plain') return inner;
  return <Card variant="surface">{inner}</Card>;
}
