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
    <ul className={cn('divide-y divide-night-700/60', className)}>
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
              className="w-full flex items-start justify-between gap-4 py-5 md:py-6 text-left group"
            >
              <span
                className={cn(
                  'font-cinzel text-body-lg md:text-h3 transition-colors',
                  open
                    ? 'text-aurora-200'
                    : 'text-ivory-100 group-hover:text-aurora-200',
                )}
              >
                {item.q}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex-shrink-0 mt-1 w-7 h-7 rounded-full ring-1 flex items-center justify-center transition-all duration-300',
                  open
                    ? 'bg-aurora-500/20 ring-aurora-300/50 rotate-45'
                    : 'ring-night-700 group-hover:ring-aurora-400/40',
                )}
              >
                <Plus
                  className={cn(
                    'w-3.5 h-3.5',
                    open ? 'text-aurora-200' : 'text-ivory-300',
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
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pr-12 text-body text-ivory-200 leading-relaxed">
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
