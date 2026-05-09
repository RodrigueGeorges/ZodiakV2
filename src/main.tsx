import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './fonts';
import App from './App.tsx';
import { AuthProvider } from './lib/hooks/useAuth';
import { initializeApiSystems } from './lib/api/init';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './lib/errors/ErrorBoundary';
import { PerformanceMonitor } from './lib/performance/PerformanceMonitor';
import { registerServiceWorker } from './lib/registerServiceWorker';
import { initAnalytics } from './lib/analytics';

const queryClient = new QueryClient();

initializeApiSystems();
PerformanceMonitor.init();
void initAnalytics();

if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
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
);

void registerServiceWorker();
