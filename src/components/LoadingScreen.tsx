import React from 'react';
import CosmicLoader from './CosmicLoader';
import AuroraBackground from './ui/AuroraBackground';

interface LoadingScreenProps {
  message?: string;
  error?: string;
}

function LoadingScreen({ message = 'Chargement...', error }: LoadingScreenProps) {
  return (
    <div className="relative min-h-screen w-full bg-night-950 overflow-hidden flex items-center justify-center">
      <AuroraBackground variant="dim" withGrain={false} />
      <div className="relative z-10 text-center">
        <CosmicLoader size="md" />
        {!error && (
          <p
            className="mt-8 eyebrow-ritual text-ivory-300/80"
            aria-live="polite"
          >
            {message}
          </p>
        )}
        {error && (
          <p
            className="mt-8 eyebrow-ritual text-magenta-400"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default React.memo(LoadingScreen);
