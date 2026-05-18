import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Compass, Sparkles, MessageSquare, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/hooks/useAuth';
import { vibrate } from '../lib/haptics';
import { isNavActive } from '../lib/nav';
import { TRANSITION } from '../lib/motion-tokens';

const NAV = [
  { path: '/guidance', icon: Sparkles, label: 'Guidance' },
  { path: '/natal', icon: Compass, label: 'Natal' },
  { path: '/calendar', icon: LayoutGrid, label: 'Explorer' },
  { path: '/guide-astral', icon: MessageSquare, label: 'Guide' },
  { path: '/profile', icon: User, label: 'Profil' },
];

function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || location.pathname === '/') return null;

  return (
    <nav
      aria-label="Navigation mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom"
    >
      {/* Voile de transition pour faire fondre la nav dans la page */}
      <div
        aria-hidden="true"
        className="absolute -top-14 inset-x-0 h-14 bg-gradient-to-t from-black/92 via-black/48 to-transparent pointer-events-none"
      />
      <div className="px-3 pb-3 pt-2">
        <div className="flex items-center justify-around gap-1 rounded-[28px] bg-black/50 backdrop-blur-xl border border-white/[0.11] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_-12px_40px_rgba(0,0,0,0.45)]">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path, location.pathname);
            return (
              <button
                key={item.path}
                onClick={() => {
                  vibrate('tap');
                  navigate(item.path);
                }}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 flex-1 rounded-2xl py-2 px-1 min-h-[48px] transition-colors duration-300 ease-brutal overflow-hidden',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
                  active ? 'text-ivory-50' : 'text-ivory-400 hover:text-ivory-100',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-active"
                    transition={TRANSITION.spring}
                    className="absolute inset-0 rounded-2xl bg-aurora-400/12 border border-aurora-400/35 shadow-[0_0_24px_-6px_rgba(56,189,248,0.4)]"
                    aria-hidden="true"
                  />
                )}
                {active && (
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-gradient-to-r from-transparent via-aurora-400 to-transparent shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn(
                    'relative w-5 h-5 transition-all duration-300',
                    active
                      ? 'text-aurora-400 scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.55)]'
                      : 'group-hover:scale-105',
                  )}
                  aria-hidden="true"
                />
                <span className={cn(
                  'relative text-[10px] font-medium leading-none font-mono tracking-tight transition-colors duration-300',
                  active && 'text-aurora-100',
                )}>
                  {item.label}
                </span>
                {!active && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-aurora-400/60 to-transparent rounded-full transition-all duration-300 group-hover:w-1/2"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default BottomNavBar;
