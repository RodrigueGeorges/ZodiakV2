import React, { ReactNode } from 'react';
import { Card } from './ui/Card';

/**
 * InteractiveCard — alias rétrocompat vers la primitive `Card` (v2 aurora).
 *
 * Le code legacy importait souvent ce composant. On le garde comme un thin
 * wrapper pour migrer progressivement. Pour le code neuf, importer
 * directement `Card` depuis `components/ui`.
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
