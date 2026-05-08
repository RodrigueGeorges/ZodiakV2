import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsReturn {
  supported: boolean;
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
  /** Demande la permission + s'abonne. Retourne true si OK. */
  enable: () => Promise<boolean>;
  /** Désabonne et nettoie côté DB. */
  disable: () => Promise<boolean>;
}

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '') as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Hook Web Push complet, niveau prod :
 *   - vérifie le support navigateur
 *   - utilise le SW déjà enregistré (registerSW au boot)
 *   - persiste l'abonnement côté DB pour que le cron Netlify push tout le monde
 *   - idempotent en cas de réabonnement
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  useEffect(() => {
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      } catch (err) {
        console.warn('[usePush] read sub failed:', err);
      }
    })();
  }, [supported]);

  const persist = useCallback(
    async (sub: PushSubscription) => {
      if (!user?.id) return;
      const json = sub.toJSON();
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );
    },
    [user?.id]
  );

  const enable = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    if (!VAPID_PUBLIC_KEY) {
      console.warn(
        '[usePush] VITE_VAPID_PUBLIC_KEY manquant — notifications désactivées.'
      );
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await persist(sub);
      setSubscribed(true);
      return true;
    } catch (err) {
      console.warn('[usePush] enable failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, persist]);

  const disable = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        if (user?.id) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', sub.endpoint);
        }
      }
      setSubscribed(false);
      return true;
    } catch (err) {
      console.warn('[usePush] disable failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, user?.id]);

  return { supported, permission, subscribed, loading, enable, disable };
}
