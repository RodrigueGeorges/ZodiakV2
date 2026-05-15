import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Compass,
  Calendar,
  Heart,
  MessageSquare,
  User,
  Command as CommandIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useBodyScrollLock, useFocusTrap } from '../lib/hooks/useFocusTrap';
import { TRANSITION } from '../lib/motion-tokens';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  section: string;
  action: () => void;
  keywords?: string;
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useBodyScrollLock(open);
  useFocusTrap(containerRef, open, { autoFocus: false });

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items: CommandItem[] = useMemo(() => {
    const base: CommandItem[] = [
      { id: 'guidance', label: 'Guidance du jour', icon: <Sparkles className="w-4 h-4" />, section: 'Navigation', action: () => { navigate('/guidance'); onOpenChange(false); } },
      { id: 'natal', label: 'Thème natal', icon: <Compass className="w-4 h-4" />, section: 'Navigation', action: () => { navigate('/natal'); onOpenChange(false); } },
      { id: 'calendar', label: 'Calendrier lunaire', icon: <Calendar className="w-4 h-4" />, section: 'Navigation', action: () => { navigate('/calendar'); onOpenChange(false); } },
      { id: 'friends', label: 'Mes liens', icon: <Heart className="w-4 h-4" />, section: 'Navigation', action: () => { navigate('/friends'); onOpenChange(false); } },
      { id: 'chat', label: 'Guide astral', icon: <MessageSquare className="w-4 h-4" />, section: 'Navigation', action: () => { navigate('/guide-astral'); onOpenChange(false); } },
      { id: 'profile', label: 'Mon profil', icon: <User className="w-4 h-4" />, section: 'Navigation', action: () => { navigate('/profile'); onOpenChange(false); } },
    ];
    return base;
  }, [navigate, onOpenChange]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) =>
      i.label.toLowerCase().includes(q) ||
      i.section.toLowerCase().includes(q) ||
      (i.keywords?.toLowerCase().includes(q) ?? false)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = useMemo(() => filtered, [filtered]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatItems[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [flatItems, selectedIndex, onOpenChange]
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" aria-hidden={!open}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.ui}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={TRANSITION.springSoft}
            className="relative w-full max-w-lg rounded-2xl premium-surface premium-surface-elevated border border-white/[0.12] shadow-5 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.1]">
              <Search className="w-4 h-4 text-ivory-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Rechercher une page, une action…"
                className="flex-1 bg-transparent text-body text-ivory-50 placeholder:text-ivory-500/60 focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-ivory-400 bg-white/[0.06] border border-white/[0.1]">
                <CommandIcon className="w-3 h-3" />K
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {grouped.length === 0 ? (
                <div className="px-4 py-8 text-center text-caption text-ivory-400">
                  Aucun résultat pour « {query} »
                </div>
              ) : (
                grouped.map(([section, sectionItems]) => (
                  <div key={section}>
                    <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-ivory-500">
                      {section}
                    </div>
                    {sectionItems.map((item) => {
                      const flatIdx = flatItems.findIndex((i) => i.id === item.id);
                      const active = flatIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(flatIdx)}
                          onClick={item.action}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100',
                            active ? 'bg-aurora-500/10 text-ivory-50' : 'text-ivory-300 hover:text-ivory-100 hover:bg-white/[0.04]'
                          )}
                        >
                          <span className={cn('shrink-0', active ? 'text-aurora-300' : 'text-ivory-400')}>{item.icon}</span>
                          <span className="flex-1 text-body">{item.label}</span>
                          {item.shortcut && (
                            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-ivory-400 bg-white/[0.06] border border-white/[0.1]">
                              {item.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.08] text-[10px] font-mono text-ivory-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/[0.06] border border-white/[0.1]">↑</kbd>
                <kbd className="px-1 rounded bg-white/[0.06] border border-white/[0.1]">↓</kbd>
                <span className="ml-1">naviguer</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 rounded bg-white/[0.06] border border-white/[0.1]">↵</kbd>
                <span className="ml-1">ouvrir</span>
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <kbd className="px-1 rounded bg-white/[0.06] border border-white/[0.1]">esc</kbd>
                <span className="ml-1">fermer</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
