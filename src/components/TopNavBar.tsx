import { useAuth } from '../lib/hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Compass, Sparkles, MessageSquare, Heart, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import Logo from './Logo';
import { vibrate } from '../lib/haptics';

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
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-night-950/85 via-night-950/65 to-transparent backdrop-blur-md" />
      <nav
        aria-label="Navigation principale"
        className="relative mx-auto max-w-7xl flex items-center justify-between px-6 lg:px-10 py-4"
      >
        <Link
          to="/guidance"
          className="flex items-center gap-3 group"
          aria-label="Accueil Zodiak"
        >
          <Logo size="sm" />
          <span className="font-cinzel text-h3 text-ivory-50 tracking-wide group-hover:text-aurora-300 transition-colors">
            Zodiak
          </span>
        </Link>

        <div
          className="flex items-center gap-1 p-1.5 rounded-full bg-night-900/70 border border-night-700/80 backdrop-blur-md shadow-card"
          role="tablist"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
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
                  'relative flex items-center gap-2 px-3.5 py-2 rounded-full font-cinzel text-caption transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
                  active
                    ? 'text-ivory-50'
                    : 'text-ivory-300 hover:text-ivory-50'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="topnav-active-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-aurora-500/30 via-aurora-500/15 to-magenta-500/20 ring-1 ring-aurora-400/30"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn(
                    'relative w-4 h-4',
                    active ? 'text-aurora-200' : ''
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
