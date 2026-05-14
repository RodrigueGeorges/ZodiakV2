/**
 * Wrapper analytics minimaliste, déjà compatible PostHog.
 *
 * Si `VITE_POSTHOG_KEY` n'est pas défini, on no-op silencieusement (idéal en
 * dev local). En prod on charge `posthog-js` dynamiquement pour ne pas alourdir
 * le bundle initial, et on flush à chaque navigation.
 *
 * On expose un set d'événements typés pour que TS rappelle au dev quels noms
 * canoniques utiliser.
 */

export type AnalyticsEvent =
  | '$pageview'
  | 'app_opened'
  | 'guidance_viewed'
  | 'guidance_generated'
  | 'mood_logged'
  | 'streak_incremented'
  | 'streak_broken'
  | 'badge_earned'
  | 'push_enabled'
  | 'push_disabled'
  | 'push_prompt_dismissed'
  | 'pwa_install_prompted'
  | 'pwa_installed'
  | 'pwa_install_dismissed'
  | 'friend_added'
  | 'synastry_viewed'
  | 'synastry_shared'
  | 'story_generated'
  | 'paywall_seen'
  | 'paywall_clicked_subscribe'
  | 'subscribed'
  | 'chat_message_sent'
  | 'onboarding_step'
  | 'onboarding_completed'
  | 'sign_up'
  | 'sign_in'
  | 'sign_out';

interface PostHogLite {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
  opt_in_capturing?: () => void;
  opt_out_capturing?: () => void;
}

let posthog: PostHogLite | null = null;
let initPromise: Promise<void> | null = null;

const KEY = (import.meta.env.VITE_POSTHOG_KEY ?? '') as string;
const HOST = (import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com') as string;

async function ensureInit(): Promise<void> {
  if (posthog) return;
  if (!KEY) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const mod = await import(/* @vite-ignore */ 'posthog-js');
      const ph = (mod.default ?? mod) as PostHogLite;
      ph.init(KEY, {
        api_host: HOST,
        capture_pageview: false,
        autocapture: false,
        persistence: 'localStorage+cookie',
        person_profiles: 'identified_only',
      });
      posthog = ph;
    } catch (err) {
      console.warn('[analytics] posthog-js not loaded:', err);
    }
  })();
  return initPromise;
}

export async function initAnalytics(): Promise<void> {
  await ensureInit();
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!KEY) {
    if (import.meta.env.DEV) console.debug('[analytics]', event, props);
    return;
  }
  ensureInit().then(() => {
    posthog?.capture(event, props);
  });
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!KEY) return;
  ensureInit().then(() => {
    posthog?.identify(userId, traits);
  });
}

export function reset(): void {
  if (!KEY) return;
  ensureInit().then(() => {
    posthog?.reset();
  });
}

export function trackPageView(path: string): void {
  track('$pageview', { path });
}
