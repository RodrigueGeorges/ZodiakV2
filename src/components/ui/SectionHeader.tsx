import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * SectionHeader — titrage type apps astro contemporaines :
 * métadonnées mono, titre sans ultra-léger (Co–Star-esque), corps neutre.
 */
interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  size?: 'lg' | 'md' | 'sm';
  className?: string;
  children?: ReactNode;
  /** Si true, le titre est ivoire pur. Si false, il peut accepter des spans
   *  intérieurs avec couleurs personnalisées. Default = true. */
  titlePlain?: boolean;
}

const sizeStyles = {
  lg: 'text-display-xl',
  md: 'text-display',
  sm: 'text-h1',
} as const;

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  size = 'md',
  className,
  children,
  titlePlain = true,
}: SectionHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left',
        'space-y-5',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'protocol-caption text-ivory-400',
            align === 'center'
              ? 'flex items-center justify-center gap-4'
              : 'inline-flex items-center gap-4',
          )}
        >
          <span aria-hidden="true" className="block h-px w-10 bg-white/25" />
          <span>{eyebrow}</span>
          <span aria-hidden="true" className="block h-px w-10 bg-white/25" />
        </p>
      )}

      <h1
        className={cn(
          'font-sans font-extralight leading-[0.98] tracking-tight',
          titlePlain && 'text-ivory-50',
          sizeStyles[size],
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className={cn(
            'text-body-lg text-ivory-400/95 font-light',
            align === 'center' ? 'mx-auto max-w-2xl' : '',
          )}
        >
          {subtitle}
        </p>
      )}

      {children && <div className="pt-3">{children}</div>}
    </motion.header>
  );
}
