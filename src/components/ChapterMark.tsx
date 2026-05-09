import { cn } from '../lib/utils';

interface ChapterMarkProps {
  /** Numéro du chapitre (1, 2, 3…). Converti en chiffre romain. */
  number: number;
  /** Label complémentaire (ex: "Chapitre"). Optionnel. */
  label?: string;
  className?: string;
  /** Aligne à gauche, droite ou centre. Défaut: left. */
  align?: 'left' | 'center' | 'right';
}

const ROMANS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV',
] as const;

function toRoman(n: number): string {
  return ROMANS[n] ?? String(n);
}

/**
 * ChapterMark — numérotation de chapitre en chiffres romains.
 *
 * Reproduit la mise en page d'un livre relié : un chiffre romain Fraunces
 * en or, suivi d'un filet horizontal qui s'estompe, et optionnellement
 * un mot ("Chapitre", "Acte", "Partie").
 *
 * Usage typique :
 *   <ChapterMark number={2} label="Chapitre" align="center" />
 */
export default function ChapterMark({
  number,
  label = 'Chapitre',
  className,
  align = 'left',
}: ChapterMarkProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className,
      )}
      aria-label={`${label} ${number}`}
    >
      {label && (
        <span className="eyebrow-ritual text-aurora-400/80">{label}</span>
      )}
      <span className="chapter-number text-h2 leading-none">
        {toRoman(number)}
      </span>
    </div>
  );
}
