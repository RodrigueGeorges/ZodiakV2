import { Sparkles, Compass, User, Moon } from 'lucide-react';
import EmptyStateUI from './ui/EmptyState';
import { Button } from './ui/Button';

/**
 * EmptyState (legacy) — façade rétrocompat pour la primitive `ui/EmptyState`.
 * Le `type` détermine l'icône et la copy par défaut.
 */
interface EmptyStateProps {
  type: 'natal' | 'guidance' | 'profile' | 'general';
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const PRESETS = {
  natal: {
    icon: <Compass className="w-7 h-7" />,
    title: 'Thème natal indisponible',
    message:
      'Renseigne ta date, ton heure et ton lieu de naissance pour révéler ta carte du ciel.',
  },
  guidance: {
    icon: <Sparkles className="w-7 h-7" />,
    title: 'Aucune guidance pour le moment',
    message:
      'Ta lecture du jour arrive bientôt. Les astres prennent leur temps.',
  },
  profile: {
    icon: <User className="w-7 h-7" />,
    title: 'Profil incomplet',
    message:
      'Quelques infos à ajouter pour personnaliser ton expérience astrale.',
  },
  general: {
    icon: <Moon className="w-7 h-7" />,
    title: 'Pas encore de données',
    message: 'Reviens un peu plus tard, le ciel se cherche encore.',
  },
} as const;

export default function EmptyState({
  type,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  const preset = PRESETS[type];
  return (
    <EmptyStateUI
      icon={preset.icon}
      title={title || preset.title}
      description={message || preset.message}
      action={
        action ? (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
}
