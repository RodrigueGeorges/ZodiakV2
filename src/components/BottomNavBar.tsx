// React import not needed in TSX with jsx: 'react-jsx'
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Compass, MessageSquare, Sparkle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/hooks/useAuth';

function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || location.pathname === '/') return null;

  const navItems = [
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/natal', icon: Compass, label: 'Natal' },
    { path: '/guidance', icon: MessageSquare, label: 'Guidance' },
    { path: '/guide-astral', icon: Sparkle, label: 'Guide Astral' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-cosmic-900/90 backdrop-blur-lg border-t border-blue-400/20 safe-area-inset-bottom md:hidden">
      <div className="flex justify-around items-center px-2 py-1 md:py-2 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 outline-none',
                'text-blue-400 hover:text-blue-300 focus:text-blue-400',
                'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cosmic-900',
                'min-h-[44px] min-w-[44px] justify-center',
                isActive && 'bg-gradient-to-r from-blue-400/10 to-blue-600/10 text-blue-300'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
              role="link"
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavBar; 