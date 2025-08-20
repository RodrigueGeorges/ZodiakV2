import React, { Component, ErrorInfo } from 'react';
import { Logger } from '../logging/Logger';
import { ButtonZodiak } from '../../components/ButtonZodiak';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Générer un ID unique pour cette erreur
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({ errorId });

    // Journaliser l'erreur avec plus de contexte
    Logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Appeler le callback personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En production, envoyer à un service de monitoring (Sentry, etc.)
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, {
      //   extra: {
      //     componentStack: errorInfo.componentStack,
      //     errorId,
      //     url: window.location.href
      //   }
      // });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-cosmic-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-cosmic-800 rounded-xl shadow-xl border border-primary/20 p-8 text-center">
            {/* Icône d'erreur animée */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Titre et message */}
            <h1 className="text-2xl font-bold text-primary mb-4 font-cinzel">
              Oups ! Une erreur est survenue
            </h1>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              Nous sommes désolés, mais quelque chose s'est mal passé.
              Notre équipe a été notifiée et travaille sur le problème.
            </p>

            {/* ID d'erreur pour le support */}
            {this.state.errorId && (
              <div className="mb-6 p-3 bg-cosmic-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">ID d'erreur pour le support :</p>
                <code className="text-xs text-primary font-mono break-all">
                  {this.state.errorId}
                </code>
              </div>
            )}

            {/* Actions de récupération */}
            <div className="space-y-3">
              <ButtonZodiak
                onClick={this.handleRetry}
                className="w-full bg-primary hover:bg-primary/90 text-cosmic-900 font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </ButtonZodiak>

              <ButtonZodiak
                onClick={this.handleGoHome}
                className="w-full bg-cosmic-700 hover:bg-cosmic-600 text-primary font-semibold"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </ButtonZodiak>

              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-primary transition-colors"
              >
                Recharger la page
              </button>
            </div>

            {/* Informations de debug en développement */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-primary">
                  Détails techniques (développement)
                </summary>
                <div className="mt-2 p-3 bg-cosmic-700 rounded text-xs text-red-300 font-mono overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}