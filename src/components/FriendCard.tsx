import { motion } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { GuidanceMeter } from './GuidanceMeter';
import { cn } from '../lib/utils';
import type { Friend, Synastry } from '../lib/types/supabase';

interface FriendCardProps {
  friend: Friend & { synastry?: Synastry | null };
  onClick?: () => void;
  onDelete?: () => void;
  className?: string;
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  partner: 'Partenaire',
  crush: 'Crush',
  family: 'Famille',
  friend: 'Ami·e',
  colleague: 'Collègue',
  other: 'Lien',
};

export default function FriendCard({ friend, onClick, onDelete, className }: FriendCardProps) {
  const score = friend.synastry?.base_score ?? null;
  const verdict = friend.synastry?.summary ?? 'En cours de calcul…';

  const initials = friend.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <Card
      variant="elevated"
      interactive={!!onClick}
      onClick={onClick}
      className={cn('relative overflow-hidden group', className)}
    >
      <div className="relative p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-aurora-400/15 border border-aurora-400/30 flex items-center justify-center font-display text-h3 text-ivory-50">
          {friend.avatar_emoji ? (
            <span aria-hidden="true">{friend.avatar_emoji}</span>
          ) : (
            <span aria-hidden="true">{initials || '✦'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-display text-body-lg text-ivory-50 truncate leading-tight">
              {friend.name}
            </p>
            {friend.relationship && (
              <span className="eyebrow-ritual text-aurora-400/80">
                {RELATIONSHIP_LABEL[friend.relationship] ?? friend.relationship}
              </span>
            )}
          </div>
          <p className="text-caption text-ivory-300/80 italic-editorial truncate">
            {verdict}
          </p>
          {score !== null && (
            <div className="mt-3 flex items-center gap-3">
              <GuidanceMeter score={score} className="max-w-[160px]" />
              <span className="font-display text-caption text-aurora-400 tabular-nums">
                {score}
              </span>
            </div>
          )}
        </div>
        {onDelete && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Supprimer ${friend.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full text-ivory-400 hover:text-magenta-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>
      {!score && (
        <div className="relative px-5 pb-4">
          <div className="flex items-center gap-2 text-micro text-ivory-400">
            <Heart className="w-3 h-3 text-magenta-300" aria-hidden="true" />
            <span>Synastrie en attente — recompute auto</span>
          </div>
        </div>
      )}
    </Card>
  );
}
