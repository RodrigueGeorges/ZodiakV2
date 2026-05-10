import React from 'react';
import CosmicLoader from './CosmicLoader';
import AppBackdrop from './AppBackdrop';

interface LoadingScreenProps {
  message?: string;
  error?: string;
}

function LoadingScreen({ message = 'Chargement...', error }: LoadingScreenProps) {
  return (
    <div className="relative min-h-screen w-full bg-transparent overflow-hidden flex items-center justify-center">
      <AppBackdrop vignette />
      <div className="relative z-[1] isolate text-center">
        <CosmicLoader size="md" />
        {!error && (
          <p
            className="mt-8 protocol-caption text-ivory-400/90 text-center max-w-[20rem] mx-auto"
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
