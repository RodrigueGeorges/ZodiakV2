import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { captureException } from '../lib/sentry'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
      <div className="max-w-md w-full p-6 bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 rounded-lg shadow-lg border border-primary/20">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-4">Une erreur est survenue</h2>
        <p className="text-primary mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-gradient-to-r from-primary to-secondary text-cosmic-900 py-2 px-4 rounded font-semibold hover:opacity-90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        captureException(error)
      }}
      onReset={() => {
        // Réinitialiser l'état de l'application si nécessaire
        window.location.reload()
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}

export default ErrorBoundary; 