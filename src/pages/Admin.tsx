import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  User as UserIcon,
  CreditCard,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import AdminProtection from '../components/AdminProtection';
import type { Profile } from '../lib/types/supabase';
import { cn } from '../lib/utils';
import { useDocumentSeo } from '../lib/documentSeo';

type SubStatus = 'trial' | 'active' | 'expired';
type FilterKey = 'all' | SubStatus;

const STATUS_LABELS: Record<SubStatus, string> = {
  trial: "Période d'essai",
  active: 'Abonné',
  expired: 'Expiré',
};

const STATUS_TONE: Record<SubStatus, string> = {
  trial: 'text-amber-300',
  active: 'text-emerald-300',
  expired: 'text-magenta-300',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'trial', label: 'Essai' },
  { key: 'active', label: 'Actifs' },
  { key: 'expired', label: 'Expirés' },
];

export function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des profils');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleUpdateSubscription = async (userId: string, status: SubStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    if (!profile) return false;

    const haystack = `${profile.name ?? ''} ${profile.phone ?? ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || profile.subscription_status === filter;

    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useDocumentSeo({
    title: loading ? 'Admin · chargement · Zodiak' : error ? 'Admin · erreur · Zodiak' : 'Admin · tableau de bord · Zodiak',
    description:
      'Interface interne réservée à l’équipe Zodiak pour la supervision des profils et abonnements.',
  });

  if (loading) return <LoadingScreen message="Chargement de l'espace admin…" />;

  return (
    <AdminProtection>
      <PageLayout
        eyebrow="Espace admin · accès restreint"
        titlePlain
        title={
          <>
            <span className="block text-ivory-50">Tableau de bord</span>
            <span className="block text-gradient-aurora">Zodiak.</span>
          </>
        }
        subtitle="Utilisateurs, statuts d’abonnement (essai, actif, expiré) et suivi des envois — accès restreint."
        maxWidth="6xl"
        showLogo={false}
        headerSlot={
          <span className="inline-flex items-center gap-2 rounded-full bg-aurora-500/10 border border-aurora-400/30 px-3 py-1 eyebrow-ritual">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            Mode admin
          </span>
        }
      >
        <div className="space-y-8">
          {error && (
            <Card variant="surface" className="border border-magenta-500/30">
              <div className="px-5 py-3 text-caption text-magenta-200">{error}</div>
            </Card>
          )}

          {/* Recherche + filtres */}
          <Card variant="surface">
            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur (nom, téléphone)…"
                  className="input-cosmic !pl-9"
                  aria-label="Rechercher un utilisateur"
                />
              </div>

              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label="Filtrer par statut"
              >
                {FILTERS.map(({ key, label }) => {
                  const isActive = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'px-3.5 h-9 rounded-full text-caption transition-colors border',
                        isActive
                          ? 'bg-aurora-500/15 border-aurora-400/40 text-aurora-100'
                          : 'bg-night-900/50 border-ivory-50/[0.06] text-ivory-300 hover:text-ivory-50 hover:border-aurora-400/30',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Liste des profils */}
          <div className="space-y-4">
            {filteredProfiles.map((profile, i) => {
              if (!profile) return null;
              const status = profile.subscription_status as SubStatus;

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Card variant="surface" className="relative overflow-hidden">
                    <div className="p-5 md:p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <UserIcon className="w-4 h-4 text-aurora-300" aria-hidden="true" />
                              <span className="font-display text-h3 text-ivory-50">
                                {profile.name || '—'}
                              </span>
                            </div>
                            <p className="text-caption text-ivory-300">
                              {profile.phone || 'Pas de téléphone'}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <CreditCard className="w-4 h-4 text-aurora-300" aria-hidden="true" />
                              <span
                                className={cn(
                                  'font-medium text-caption uppercase tracking-wider',
                                  STATUS_TONE[status] ?? 'text-ivory-300',
                                )}
                              >
                                {STATUS_LABELS[status] ?? status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-caption text-ivory-400">
                              <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Expire le {formatDate(profile.trial_ends_at)}</span>
                            </div>
                          </div>

                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-caption text-ivory-400">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Inscrit le {formatDate(profile.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-caption text-ivory-400">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>
                                Dernière guidance ·{' '}
                                {profile.last_guidance_sent
                                  ? formatDate(profile.last_guidance_sent)
                                  : 'Jamais'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 md:items-end justify-end">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={status === 'trial' ? 'primary' : 'ghost'}
                              onClick={() => handleUpdateSubscription(profile.id, 'trial')}
                            >
                              Essai
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'active' ? 'primary' : 'ghost'}
                              onClick={() => handleUpdateSubscription(profile.id, 'active')}
                            >
                              Activer
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteProfile(profile.id)}
                            iconLeft={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {filteredProfiles.length === 0 && (
              <Card variant="surface">
                <EmptyState
                  icon={<Search className="w-7 h-7" />}
                  title="Aucun utilisateur"
                  description={
                    search
                      ? `Aucun résultat pour « ${search} ».`
                      : 'Aucun utilisateur ne correspond à ce filtre.'
                  }
                />
              </Card>
            )}
          </div>

          <p className="eyebrow-ritual text-ivory-400/80 text-center">
            Total · {filteredProfiles.length} utilisateur
            {filteredProfiles.length > 1 ? 's' : ''}
          </p>
        </div>
      </PageLayout>
    </AdminProtection>
  );
}

export default Admin;
