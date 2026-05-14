import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Compass, Sparkles, MessageSquare, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/hooks/useAuth';
import { vibrate } from '../lib/haptics';

const NAV = [
  { path: '/guidance', icon: Sparkles, label: 'Guidance' },
  { path: '/natal', icon: Compass, label: 'Natal' },
  { path: '/friends', icon: Heart, label: 'Liens' },
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
        <div className="flex items-center justify-around gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.11] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_-8px_32px_rgba(0,0,0,0.35)]">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
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
                  'relative flex flex-col items-center justify-center gap-1 flex-1 rounded-lg py-2 px-1 min-h-[48px] transition-colors duration-300 ease-brutal',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
                  active ? 'text-ivory-50' : 'text-ivory-400 hover:text-ivory-100',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-active"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-lg bg-aurora-400/12 border border-aurora-400/35"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn(
                    'relative w-5 h-5 transition-transform',
                    active && 'text-aurora-400 scale-105',
                  )}
                  aria-hidden="true"
                />
                <span className="relative text-[11px] font-medium leading-none font-mono tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default BottomNavBar;
