// React import not needed in TSX with jsx: 'react-jsx'
import { useLocation, useNavigate } from 'react-router-dom';

import { cn } from '../lib/utils';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: 'profile', label: 'Profil', path: '/profile' },
    { key: 'natal', label: 'Thème Natal', path: '/natal' },
    { key: 'guidance', label: 'Guidance', path: '/guidance' }
  ];

  const getActiveTab = () => {
    if (location.pathname.startsWith('/natal')) return 'natal';
    if (location.pathname.startsWith('/guidance')) return 'guidance';
    if (location.pathname.startsWith('/profile')) return 'profile';
    return 'profile';
  };

  const handleTabChange = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-cosmic-900/80 backdrop-blur-lg border-b border-primary">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
  
          <h1 className="text-lg font-semibold text-blue-300">Zodiak</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = getActiveTab() === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'text-blue-300 hover:text-blue-200',
                  isActive && 'bg-gradient-to-r from-blue-300/10 to-cyan-300/10 text-blue-300'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Header; 