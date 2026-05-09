import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  hint: string;
}

/**
 * Évalue la robustesse d'un mot de passe selon des critères standards :
 *  - longueur (>= 8 / 12 / 16)
 *  - mélange (minuscules + majuscules + chiffres + symboles)
 *  - pénalité si patterns communs (1234, qwerty, password)
 *
 * Score 0..4 :
 *   0 = vide ou < 8 chars
 *   1 = très faible
 *   2 = faible
 *   3 = bon
 *   4 = excellent
 */
function evaluate(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '', hint: '' };
  }

  if (password.length < 8) {
    return {
      score: 0,
      label: 'Trop court',
      color: 'bg-magenta-500',
      hint: 'Minimum 8 caractères.',
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Pénalités sur patterns évidents
  const lower = password.toLowerCase();
  const commonPatterns = [
    '1234',
    'azerty',
    'qwerty',
    'password',
    'motdepasse',
    'admin',
    'zodiak',
  ];
  if (commonPatterns.some((p) => lower.includes(p))) {
    score = Math.max(0, score - 2);
  }

  // Pénalité si répétitions (aaaa, 1111)
  if (/(.)\1{3,}/.test(password)) {
    score = Math.max(0, score - 1);
  }

  // Map score raw (0-6) → score affiché (1-4)
  let displayScore: 1 | 2 | 3 | 4;
  if (score <= 2) displayScore = 1;
  else if (score <= 3) displayScore = 2;
  else if (score <= 4) displayScore = 3;
  else displayScore = 4;

  const presets: Record<1 | 2 | 3 | 4, Omit<StrengthResult, 'score'>> = {
    1: {
      label: 'Très faible',
      color: 'bg-magenta-500',
      hint: 'Mélange minuscules, majuscules, chiffres et symboles.',
    },
    2: {
      label: 'Faible',
      color: 'bg-amber-500',
      hint: 'Allonge un peu et ajoute des symboles.',
    },
    3: {
      label: 'Bon',
      color: 'bg-aurora-400',
      hint: 'Solide. Tu peux y aller.',
    },
    4: {
      label: 'Excellent',
      color: 'bg-emerald-400',
      hint: 'Imparable. ✦',
    },
  };

  return { score: displayScore, ...presets[displayScore] };
}

export default function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const result = useMemo(() => evaluate(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('mt-2', className)}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <motion.div
            key={bar}
            initial={{ scaleX: 0.4 }}
            animate={{ scaleX: bar <= result.score ? 1 : 0.4 }}
            transition={{ duration: 0.25, delay: (bar - 1) * 0.04 }}
            className={cn(
              'h-1 flex-1 rounded-full origin-left transition-colors duration-300',
              bar <= result.score ? result.color : 'bg-night-700',
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <span className="text-micro text-ivory-300">{result.hint}</span>
        <span
          className={cn('text-micro font-medium', {
            'text-magenta-300': result.score === 1,
            'text-amber-300': result.score === 2,
            'text-aurora-200': result.score === 3,
            'text-emerald-300': result.score === 4,
          })}
        >
          {result.label}
        </span>
      </div>
    </div>
  );
}
