import { useAuth } from '../lib/hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';
import { User, Compass, Sparkles, MessageSquare, Heart, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import Logo from './Logo';
import { vibrate } from '../lib/haptics';
import { isNavActive } from '../lib/nav';
import { TRANSITION } from '../lib/motion-tokens';

const NAV = [
  { label: 'Guidance', icon: Sparkles, path: '/guidance' },
  { label: 'Natal', icon: Compass, path: '/natal' },
  { label: 'Liens', icon: Heart, path: '/friends' },
  { label: 'Mois', icon: CalendarDays, path: '/calendar' },
  { label: 'Guide', icon: MessageSquare, path: '/guide-astral' },
  { label: 'Profil', icon: User, path: '/profile' },
];

function TopNavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/') return null;

  return (
    <header className="hidden md:block sticky top-0 z-40">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/95 via-black/75 to-transparent backdrop-blur-md border-b border-white/[0.09]" />
      <nav
        aria-label="Navigation principale"
        className="relative mx-auto max-w-7xl flex items-center justify-between px-6 lg:px-12 py-5"
      >
        <Link
          to="/guidance"
          className="flex items-center gap-3 group"
          aria-label={`Accueil ${APP_NAME}`}
        >
          <Logo size="sm" />
          <span className="font-display text-h3 text-ivory-50 tracking-[-0.02em] font-medium group-hover:text-aurora-400 transition-colors duration-300 ease-brutal">
            {APP_NAME}
          </span>
        </Link>

        <div
          className="flex items-center gap-1 p-1.5 rounded-lg bg-black/55 border border-white/[0.1] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          role="tablist"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path, location.pathname);
            return (
              <button
                key={item.path}
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  vibrate('tap');
                  navigate(item.path);
                }}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-caption transition-colors duration-300 ease-brutal',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
                  active ? 'text-ivory-50' : 'text-ivory-400 hover:text-ivory-100',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="topnav-active-pill"
                    transition={TRANSITION.spring}
                    className="absolute inset-0 rounded-lg bg-aurora-400/12 border border-aurora-400/35"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn(
                    'relative w-4 h-4',
                    active ? 'text-aurora-400' : '',
                  )}
                  aria-hidden="true"
                />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Spacer pour équilibrer le logo (33% / 33% / 33%) */}
        <span aria-hidden="true" className="w-[140px]" />
      </nav>
    </header>
  );
}

export default TopNavBar;
