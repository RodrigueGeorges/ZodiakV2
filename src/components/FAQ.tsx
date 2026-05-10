import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export interface FAQItem {
  q: string;
  a: React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
  className?: string;
}

/**
 * FAQ accordéon — accessible (button + aria-expanded), une seule question
 * ouverte à la fois, animation framer-motion respectueuse.
 */
export default function FAQ({ items, className }: FAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <ul className={cn('divide-y divide-white/[0.07]', className)}>
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
              className="w-full flex items-start justify-between gap-5 py-7 md:py-8 text-left group transition-colors duration-200 ease-brutal"
            >
              <span
                className={cn(
                  'font-display font-light text-h2 md:text-h1 transition-colors leading-[1.12]',
                  open
                    ? 'text-aurora-300 italic-editorial'
                    : 'text-ivory-100 group-hover:text-aurora-200/95',
                )}
              >
                {item.q}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex-shrink-0 mt-2 w-9 h-9 rounded-sm border flex items-center justify-center transition-all duration-300 ease-brutal',
                  open
                    ? 'border-aurora-400/50 rotate-45 bg-aurora-400/8'
                    : 'border-white/[0.11] bg-white/[0.02] group-hover:border-white/25',
                )}
              >
                <Plus
                  className={cn(
                    'w-3.5 h-3.5',
                    open ? 'text-aurora-400' : 'text-ivory-300',
                  )}
                />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-8 pr-14 text-body-lg text-ivory-300/95 font-light leading-[1.74] drop-cap-edit">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
