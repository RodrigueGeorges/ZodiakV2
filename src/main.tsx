import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './lib/hooks/useAuth'
import { initializeApiSystems } from './lib/api/init'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './lib/errors/ErrorBoundary';
import { PerformanceMonitor } from './lib/performance/PerformanceMonitor';

const queryClient = new QueryClient()

// Initialiser les systèmes API au démarrage
initializeApiSystems()

// Initialiser le monitoring de performance
PerformanceMonitor.init();

// Initialiser la gestion d'erreurs globales
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // Ici on pourrait envoyer à Sentry ou autre service de monitoring
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Ici on pourrait envoyer à Sentry ou autre service de monitoring
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
)

// Register service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'module'
      });

      // Update service worker if new version available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour ?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}