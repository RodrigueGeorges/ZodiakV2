// React import not needed in TSX with jsx: 'react-jsx'
import { useLocation, useNavigate } from 'react-router-dom';

import { cn } from '../lib/utils';
import { APP_NAME } from '../lib/constants';

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
    <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/[0.09]">
      <div className="flex items-center justify-between px-6 lg:px-10 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-h3 text-ivory-50 tracking-[-0.02em] font-medium">
            {APP_NAME}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-black/55 border border-white/[0.1] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {tabs.map((tab) => {
            const isActive = getActiveTab() === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-caption transition-colors duration-300 ease-brutal',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
                  isActive ? 'text-ivory-50' : 'text-ivory-400 hover:text-ivory-100',
                )}
              >
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-lg bg-aurora-400/12 border border-aurora-400/35"
                    aria-hidden="true"
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Header; 