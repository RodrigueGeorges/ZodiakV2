import React from 'react';
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-lg border-t border-gray-700 safe-area-inset-bottom md:hidden">
      <div className="flex justify-around items-center px-2 py-2 gap-1 border-t border-primary bg-cosmic-900/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 outline-none',
                'text-primary hover:text-primary/80 focus:text-primary',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cosmic-900',
                'min-h-[44px] min-w-[44px] justify-center',
                isActive && 'bg-gradient-to-r from-primary/10 to-secondary/10'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
              role="link"
            >
              <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-primary leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavBar; 