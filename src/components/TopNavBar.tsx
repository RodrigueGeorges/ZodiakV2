import { useAuth } from '../lib/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Compass, MessageSquare, Sparkle } from 'lucide-react';
import { cn } from '../lib/utils';

function TopNavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!user || location.pathname === '/') return null;

  const navItems = [
    { label: 'Profil', icon: <User />, path: '/profile' },
    { label: 'Natal', icon: <Compass />, path: '/natal' },
    { label: 'Guidance', icon: <MessageSquare />, path: '/guidance' },
    { label: 'Guide Astral', icon: <Sparkle />, path: '/guide-astral' },
  ];

  return (
    <nav className="hidden md:flex w-full bg-cosmic-900/80 backdrop-blur-lg border-b border-primary px-6 py-2 z-40">
      <div className="flex gap-4 items-center mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg font-cinzel text-lg transition-colors',
              location.pathname === item.path
                ? 'bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text'
                : 'text-primary hover:text-primary/80'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default TopNavBar; 