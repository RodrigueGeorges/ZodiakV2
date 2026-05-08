/**
 * Enregistre le service worker au démarrage de l'app.
 * À appeler depuis main.tsx, hors composant React.
 *
 * Stratégie : update-on-reload + skipWaiting via postMessage si une nouvelle
 * version est détectée → l'utilisateur n'est jamais bloqué sur l'ancienne.
 */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return; // pas de SW en dev pour ne pas casser HMR

  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    // Si un nouveau SW est en attente, on lui dit de prendre le relais.
    if (reg.waiting) {
      reg.waiting.postMessage('SKIP_WAITING');
    }

    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          // Nouvelle version dispo → on bascule au prochain reload.
          reg.waiting?.postMessage('SKIP_WAITING');
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  } catch (err) {
    console.warn('[SW] registration failed:', err);
  }
}
