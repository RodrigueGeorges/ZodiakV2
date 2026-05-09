import React, { Component, ErrorInfo } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Logger } from '../logging/Logger';
import AppBackdrop from '../../components/AppBackdrop';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Logo from '../../components/Logo';

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
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.setState({ errorId });

    Logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
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
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="page-container relative">
        <AppBackdrop vignette grain />
        <div className="relative z-[1] isolate mx-auto max-w-lg px-4 py-16">
          <div className="flex justify-center mb-8">
            <Logo size="md" />
          </div>
          <Card variant="elevated" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-signal-600/08 to-night-950/90"
            />
            <div className="relative p-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-magenta-500/15 ring-1 ring-magenta-500/30 text-magenta-400">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>

              <div>
                <h1 className="font-cinzel text-h2 text-ivory-50 mb-2">
                  Le ciel s'est troublé
                </h1>
                <p className="text-body text-ivory-300">
                  Une erreur inattendue s'est produite. On a noté l'incident,
                  réessaie dans un instant.
                </p>
              </div>

              {this.state.errorId && (
                <div className="rounded-xl bg-night-900/60 border border-night-700/60 px-4 py-3">
                  <p className="text-micro uppercase tracking-[0.18em] text-ivory-400 mb-1">
                    Identifiant pour le support
                  </p>
                  <code className="text-caption text-aurora-300 font-mono break-all">
                    {this.state.errorId}
                  </code>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={this.handleRetry}
                  iconLeft={<RefreshCw className="w-4 h-4" />}
                >
                  Réessayer
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={this.handleGoHome}
                  iconLeft={<Home className="w-4 h-4" />}
                >
                  Retour à l'accueil
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  fullWidth
                  onClick={this.handleReload}
                >
                  Recharger la page
                </Button>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-caption text-ivory-400 hover:text-aurora-300">
                    Détails techniques (dev)
                  </summary>
                  <div className="mt-2 p-3 rounded-lg bg-night-900/80 text-micro text-magenta-300 font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }
}
