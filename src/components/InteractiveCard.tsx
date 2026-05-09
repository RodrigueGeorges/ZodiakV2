import React, { ReactNode } from 'react';
import { Card } from './ui/Card';

/**
 * InteractiveCard — wrapper mince autour de `Card` (interaction + padding).
 * Préférer `Card` directement pour le code neuf.
 */
interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  'aria-label'?: string;
}

function InteractiveCard({
  children,
  className = '',
  onClick,
  tabIndex,
  'aria-label': ariaLabel,
}: InteractiveCardProps) {
  return (
    <Card
      variant="elevated"
      interactive={Boolean(onClick)}
      onClick={onClick}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      className={className}
    >
      <div className="p-6">{children}</div>
    </Card>
  );
}

export default React.memo(InteractiveCard);
