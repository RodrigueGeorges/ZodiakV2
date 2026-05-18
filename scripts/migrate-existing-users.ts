/**
 * migrate-existing-users.ts — Étape 6
 *
 * Migration manuelle des utilisateurs existants vers le nouveau modèle économique.
 * À exécuter UNE SEULE FOIS en prod, après déploiement de la migration DB.
 *
 * Pré-requis :
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Exécution :
 *   DRY_RUN=true npx ts-node --esm scripts/migrate-existing-users.ts
 *   npx ts-node --esm scripts/migrate-existing-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const DRY_RUN = process.env.DRY_RUN === 'true';

console.log(`\n🚀 Migration utilisateurs — nouveau modèle économique`);
console.log(`   Mode : ${DRY_RUN ? '🟡 DRY RUN (aucune modif)' : '🔴 LIVE'}`);
console.log('─'.repeat(52));

interface Profile {
  id: string;
  name: string;
  plan: string;
  subscription_status: string;
  extra_balance: number;
  messages_included_per_period: number;
}

async function main(): Promise<void> {
  // Récupère tous les profils
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, plan, subscription_status, extra_balance, messages_included_per_period');

  if (error) {
    console.error('❌ Erreur lecture profiles:', error.message);
    process.exit(1);
  }

  const all = (profiles ?? []) as Profile[];

  const premium = all.filter(p => p.plan === 'premium' || p.plan === 'lifetime');
  const free = all.filter(p => p.plan === 'free' || !p.plan);

  console.log(`\n📊 Profils trouvés : ${all.length} total`);
  console.log(`   premium/lifetime : ${premium.length}`);
  console.log(`   free             : ${free.length}`);

  let migratedPremium = 0;
  let migratedFree = 0;
  const errors: string[] = [];

  // ── 1. Migration premium / lifetime → active + cadeau 200 messages ────────
  console.log('\n⬆️  Migration premium/lifetime → active...');
  for (const p of premium) {
    const periodResetsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (DRY_RUN) {
      console.log(`  [DRY] ${p.name} (${p.id.slice(0, 8)}) → active, +200 extras`);
      migratedPremium++;
      continue;
    }

    // Update profile : cadeau de 200 crédits + traçabilité via colonnes
    // dédiées (migration_gift_credits + migration_gift_at) plutôt qu'un
    // extra_purchases fictif (qui violerait les contraintes CHECK).
    const { error: upErr } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        messages_included_per_period: 100,
        extra_balance: (p.extra_balance ?? 0) + 200,
        period_resets_at: periodResetsAt,
        migration_gift_credits: 200,
        migration_gift_at: new Date().toISOString(),
      })
      .eq('id', p.id);

    if (upErr) {
      errors.push(`profile ${p.id}: ${upErr.message}`);
      continue;
    }

    console.log(`  ✅ ${p.name} (${p.id.slice(0, 8)}) → active + 200 crédits cadeau`);
    migratedPremium++;
  }

  // ── 2. Migration free → trial étendu 14 jours ─────────────────────────────
  console.log('\n⬇️  Migration free → trial étendu 14 jours...');
  for (const p of free) {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    if (DRY_RUN) {
      console.log(`  [DRY] ${p.name} (${p.id.slice(0, 8)}) → trial 14j`);
      migratedFree++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt,
        messages_included_per_period: 100,
      })
      .eq('id', p.id);

    if (upErr) {
      errors.push(`profile ${p.id}: ${upErr.message}`);
      continue;
    }

    console.log(`  ✅ ${p.name} (${p.id.slice(0, 8)}) → trial jusqu'au ${trialEndsAt.slice(0, 10)}`);
    migratedFree++;
  }

  // ── Récap ─────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(52));
  console.log(`📋 Récapitulatif${DRY_RUN ? ' (DRY RUN)' : ''} :`);
  console.log(`   premium/lifetime migrés : ${migratedPremium}/${premium.length}`);
  console.log(`   free → trial étendu     : ${migratedFree}/${free.length}`);

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} erreur(s) :`);
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  } else {
    console.log(`\n✅ Migration terminée sans erreur.`);
    if (DRY_RUN) {
      console.log('   Lance sans DRY_RUN=true pour appliquer les changements.\n');
    }
  }
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
