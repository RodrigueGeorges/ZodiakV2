import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';
import PageLayout from '../components/PageLayout';
import { GuidanceContent } from '../components/GuidanceContent';
import StreakFlame from '../components/StreakFlame';
import MoodCheck from '../components/MoodCheck';
import BadgesGrid from '../components/BadgesGrid';
import BirthdayBanner from '../components/BirthdayBanner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/hooks/useAuth';
import { useStreak } from '../lib/hooks/useStreak';
import { useMood } from '../lib/hooks/useMood';
import { useBadges } from '../lib/hooks/useBadges';
import { usePushNotifications } from '../lib/hooks/usePushNotifications';
import { useFriends } from '../lib/hooks/useFriends';
import { useChatMemory } from '../lib/hooks/useChatMemory';
import { moonPhaseAt } from '../lib/moonPhase';
import { vibrate } from '../lib/haptics';
import { track } from '../lib/analytics';
import { birthdayInfo } from '../lib/birthday';
import { playSound } from '../lib/sounds';
import { nextSmartPushMoment } from '../lib/smartPush';
import { Bell, BellOff, X, Telescope } from 'lucide-react';

/**
 * Page Guidance v3 :
 *  - Hero éditorial avec streak (flamme cosmique)
 *  - Mood check du matin (avant ou pendant la guidance)
 *  - Bannière push opt-in non-intrusive (1× / 7 jours)
 *  - Guidance content
 *  - Badges (collapsible)
 */
const PUSH_NUDGE_KEY = 'zodiak.push.nudgeAt';
const PUSH_NUDGE_DELAY_DAYS = 7;

function shouldShowPushNudge(): boolean {
  try {
    const last = localStorage.getItem(PUSH_NUDGE_KEY);
    if (!last) return true;
    const ms = Date.now() - new Date(last).getTime();
    return ms > PUSH_NUDGE_DELAY_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function Guidance() {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { streak, checkIn, justIncremented, willBreakSoon } = useStreak();
  const { todayMood, logMood } = useMood();
  const { earnedBadges, evaluate } = useBadges();
  const { friends } = useFriends();
  const { recentMessages } = useChatMemory();
  const push = usePushNotifications();
  const [showPushNudge, setShowPushNudge] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  // Auto check-in au mount (idempotent côté hook)
  useEffect(() => {
    if (!profile?.id) return;
    checkIn().then((s) => {
      if (s) track('guidance_viewed', { streak: s.current_count });
    });
  }, [profile?.id, checkIn]);

  // Vibration sur incrément
  useEffect(() => {
    if (justIncremented && streak && streak.current_count > 1) {
      vibrate('streak');
      playSound('chime');
      track('streak_incremented', { count: streak.current_count });
    }
  }, [justIncremented, streak]);

  // Évaluation des badges après update streak/friends
  useEffect(() => {
    if (!streak) return;
    const phase = moonPhaseAt(new Date()).kind;
    evaluate({
      streakCurrent: streak.current_count,
      streakBest: streak.best_count,
      totalDays: streak.total_days,
      friendCount: friends.length,
      synastryHighScoreCount: friends.filter(
        (f) => (f.synastry?.base_score ?? 0) >= 85
      ).length,
      guidanceCount: streak.total_days,
      chatMessageCount: recentMessages.length,
      moonPhase: phase === 'new' || phase === 'full' ? phase : undefined,
      joinedDays: profile?.created_at
        ? Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    });
  }, [streak, friends, recentMessages.length, profile?.created_at, evaluate]);

  useEffect(() => {
    if (push.supported && !push.subscribed && push.permission === 'default') {
      if (shouldShowPushNudge()) {
        const t = window.setTimeout(() => setShowPushNudge(true), 3500);
        return () => window.clearTimeout(t);
      }
    }
  }, [push.supported, push.subscribed, push.permission]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login', { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  const moonToday = useMemo(() => moonPhaseAt(new Date()), []);
  const upcomingMoment = useMemo(() => nextSmartPushMoment(36), []);

  if (isLoading) return <LoadingScreen message="Connexion au ciel…" />;
  if (!profile) return <LoadingScreen message="Chargement de ton profil…" />;

  const firstName = profile.name?.split(' ')[0] || 'voyageur';
  const birthday = birthdayInfo(profile.birth_date, profile.timezone);
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const dismissPush = () => {
    try {
      localStorage.setItem(PUSH_NUDGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    track('push_prompt_dismissed');
    setShowPushNudge(false);
  };

  const acceptPush = async () => {
    const ok = await push.enable();
    if (ok) {
      track('push_enabled');
      vibrate('success');
    }
    setShowPushNudge(false);
  };

  return (
    <PageLayout
      eyebrow={`${today} · ${moonToday.glyph} ${moonToday.label.toLowerCase()}`}
      titlePlain
      title={
        <>
          <span className="block text-ivory-50">Bonjour {firstName},</span>
          <span className="block text-gradient-aurora">voici ta guidance.</span>
        </>
      }
      subtitle="Une lecture du ciel au prisme de ton thème natal."
      maxWidth="6xl"
      showLogo={false}
      headerSlot={
        streak && streak.current_count > 0 ? (
          <StreakFlame
            count={streak.current_count}
            best={streak.best_count}
            willBreakSoon={willBreakSoon}
            pulsing={justIncremented}
            size="md"
          />
        ) : undefined
      }
      dim
    >
      <div className="space-y-8 md:space-y-10">
        {/* Easter egg : révolution solaire le jour de l'anniversaire */}
        {birthday.isToday && (
          <BirthdayBanner firstName={firstName} age={birthday.age} />
        )}

        {/* Smart push : teaser du prochain moment astral notable */}
        {upcomingMoment && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card variant="surface" className="relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-aurora-500/10 via-transparent to-magenta-500/10"
              />
              <div className="relative px-5 py-3 flex items-center gap-3">
                <Telescope
                  className="w-4 h-4 text-aurora-300 flex-shrink-0"
                  aria-hidden="true"
                />
                <p className="text-caption text-ivory-200 leading-snug flex-1">
                  <span className="text-aurora-200 font-medium">
                    {upcomingMoment.title}
                  </span>{' '}
                  · {upcomingMoment.body}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Push nudge */}
        {showPushNudge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          >
            <Card variant="surface" className="relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/12 to-magenta-500/8"
              />
              <div className="relative p-4 md:p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-aurora-500/20 ring-1 ring-aurora-400/40 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-aurora-200" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body text-ivory-50 font-cinzel">
                    Un signal silencieux quand le ciel parle ?
                  </p>
                  <p className="text-caption text-ivory-300">
                    Notifications subtiles, jamais intrusives.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="primary" size="sm" onClick={acceptPush}>
                    Activer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissPush}
                    aria-label="Plus tard"
                    iconLeft={<X className="w-3.5 h-3.5" />}
                  >
                    {''}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Mood check : visible si pas encore de mood aujourd'hui */}
        {!todayMood && (
          <MoodCheck
            current={todayMood?.mood}
            onSelect={async (m) => {
              const r = await logMood(m);
              if (r) {
                vibrate('success');
                track('mood_logged', { mood: m });
              }
            }}
          />
        )}

        {/* Guidance */}
        <GuidanceContent firstName={firstName} />

        {/* Badges (collapsible) */}
        <div className="text-center">
          {!showBadges ? (
            <Button
              variant="text"
              size="sm"
              onClick={() => setShowBadges(true)}
            >
              Voir mes marqueurs cosmiques ({earnedBadges.length})
            </Button>
          ) : (
            <BadgesGrid earned={earnedBadges} />
          )}
        </div>

        {/* Push status compact si déjà actif */}
        {push.subscribed && (
          <p className="text-center text-micro text-ivory-400 flex items-center justify-center gap-1.5">
            <BellOff className="w-3 h-3" aria-hidden="true" />
            Notifications actives — modifiable depuis ton profil.
          </p>
        )}
      </div>
    </PageLayout>
  );
}
