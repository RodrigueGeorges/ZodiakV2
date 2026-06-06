const CONSENT_KEY = 'zodiak.analytics.consent';

export type AnalyticsConsent = 'accepted' | 'rejected';

export function getAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === 'accepted' || v === 'rejected') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setAnalyticsConsent(value: AnalyticsConsent): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === 'accepted';
}
