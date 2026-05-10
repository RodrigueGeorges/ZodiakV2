import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * SectionHeader — titrage unifié avec la landing : Fraunces display + mono protocole.
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
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
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
              ? 'flex flex-wrap items-center justify-center gap-x-4 gap-y-2'
              : 'inline-flex flex-wrap items-center gap-x-4 gap-y-2',
          )}
        >
          <span
            aria-hidden="true"
            className="block h-px w-11 shrink-0 bg-gradient-to-r from-transparent via-aurora-400/35 to-transparent"
          />
          <span className="inline-flex max-w-[min(92vw,36rem)] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
            {eyebrow}
          </span>
          <span
            aria-hidden="true"
            className="block h-px w-11 shrink-0 bg-gradient-to-r from-transparent via-aurora-400/35 to-transparent"
          />
        </p>
      )}

      <h1
        className={cn(
          'font-display font-extralight leading-[0.98] tracking-[-0.02em]',
          titlePlain && 'text-ivory-50',
          sizeStyles[size],
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className={cn(
            'text-body-lg text-ivory-400/92 font-light leading-[1.72]',
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
