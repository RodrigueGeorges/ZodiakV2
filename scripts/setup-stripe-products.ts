/**
 * setup-stripe-products.ts
 *
 * Crée les produits et prix Stripe pour le modèle économique ZodiakV2.
 * À exécuter UNE SEULE FOIS par environnement (test puis live).
 *
 * Pré-requis :
 *   STRIPE_SECRET_KEY=sk_test_... (ou sk_live_... pour la prod)
 *
 * Exécution :
 *   npx ts-node --esm scripts/setup-stripe-products.ts
 *
 * Output : affiche les price IDs à copier dans les variables d'environnement Netlify.
 *
 * TVA : auto-entrepreneur sous seuil → "TVA non applicable — art. 293B CGI"
 *       Pas de Stripe Tax activé.
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('❌ STRIPE_SECRET_KEY manquant. Exportez-la avant de lancer ce script.');
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: '2024-11-20.acacia' });

const isLive = secretKey.startsWith('sk_live_');
console.log(`\n🔑 Mode : ${isLive ? '🔴 LIVE (production)' : '🟡 TEST'}`);
console.log('─'.repeat(50));

// ─── Produits à créer ─────────────────────────────────────────────────────────

const SUBSCRIPTION = {
  name: 'Zodiak Premium',
  description: '100 messages chat astral inclus par cycle · Guidance quotidienne illimitée · Synastries illimitées · Calendrier 30j · Alertes push · Essai 7 jours',
  unitAmount: 890,   // 8,90 € en centimes
  currency: 'eur',
  interval: 'month' as const,
  trialDays: 7,
};

const PACKS: Array<{ name: string; label: string; description: string; unitAmount: number; size: number; envKey: string }> = [
  {
    name: 'Zodiak Pack Étoile Filante',
    label: 'Étoile Filante',
    description: '10 messages chat astral supplémentaires · Valables 12 mois',
    unitAmount: 399,
    size: 10,
    envKey: 'STRIPE_PRICE_FILANTE',
  },
  {
    name: 'Zodiak Pack Pleine Lune',
    label: 'Pleine Lune ✨',
    description: '30 messages chat astral supplémentaires · Valables 12 mois · Le plus populaire',
    unitAmount: 999,
    size: 30,
    envKey: 'STRIPE_PRICE_LUNE',
  },
  {
    name: 'Zodiak Pack Constellation',
    label: 'Constellation',
    description: '100 messages chat astral supplémentaires · Valables 12 mois',
    unitAmount: 2499,
    size: 100,
    envKey: 'STRIPE_PRICE_CONSTELLATION',
  },
  {
    name: 'Zodiak Pack Galaxie',
    label: 'Galaxie',
    description: '300 messages chat astral supplémentaires · Valables 12 mois',
    unitAmount: 5999,
    size: 300,
    envKey: 'STRIPE_PRICE_GALAXIE',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateProduct(name: string, description: string): Promise<string> {
  const existing = await stripe.products.search({ query: `name:"${name}"`, limit: 1 });
  if (existing.data.length > 0) {
    console.log(`  ↪ Produit existant : ${existing.data[0].id}`);
    return existing.data[0].id;
  }
  const product = await stripe.products.create({
    name,
    description,
    metadata: { zodiak: 'true' },
  });
  console.log(`  ✅ Produit créé : ${product.id}`);
  return product.id;
}

async function findOrCreatePrice(
  productId: string,
  unitAmount: number,
  currency: string,
  recurring?: Stripe.PriceCreateParams.Recurring
): Promise<string> {
  // Cherche un prix identique existant (actif, même amount, même recurring)
  const existing = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const match = existing.data.find(p => {
    if (p.unit_amount !== unitAmount || p.currency !== currency) return false;
    if (recurring) {
      return p.recurring?.interval === recurring.interval &&
             p.recurring?.interval_count === (recurring.interval_count ?? 1);
    }
    return p.type === 'one_time';
  });
  if (match) {
    console.log(`  ↪ Prix existant : ${match.id}`);
    return match.id;
  }
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    ...(recurring ? { recurring } : {}),
    metadata: { zodiak: 'true' },
  });
  console.log(`  ✅ Prix créé : ${price.id}`);
  return price.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const envLines: string[] = [
    `# Stripe Price IDs — générés le ${new Date().toISOString()}`,
    `# Mode : ${isLive ? 'LIVE' : 'TEST'}`,
    '',
  ];

  // 1. Abonnement Premium
  console.log('\n📦 Produit : Zodiak Premium (abonnement)');
  const subProductId = await findOrCreateProduct(SUBSCRIPTION.name, SUBSCRIPTION.description);
  const subPriceId = await findOrCreatePrice(
    subProductId,
    SUBSCRIPTION.unitAmount,
    SUBSCRIPTION.currency,
    { interval: SUBSCRIPTION.interval }
  );
  envLines.push(`STRIPE_PRICE_PREMIUM=${subPriceId}`);
  console.log(`  💳 Price ID : ${subPriceId}  (${SUBSCRIPTION.unitAmount / 100} €/${SUBSCRIPTION.interval})`);

  // 2. Packs extras (one-time)
  for (const pack of PACKS) {
    console.log(`\n📦 Pack : ${pack.label}`);
    const productId = await findOrCreateProduct(pack.name, pack.description);
    const priceId = await findOrCreatePrice(productId, pack.unitAmount, 'eur');
    envLines.push(`${pack.envKey}=${priceId}`);
    console.log(`  💳 Price ID : ${priceId}  (${pack.unitAmount / 100} €, ${pack.size} messages)`);
  }

  // 3. Affichage résumé
  console.log('\n' + '─'.repeat(50));
  console.log('📋 Variables d\'environnement à ajouter dans Netlify :\n');
  console.log(envLines.join('\n'));

  // 4. Écriture dans un fichier .stripe-prices.env (gitignored)
  const outPath = path.resolve(process.cwd(), '.stripe-prices.env');
  fs.writeFileSync(outPath, envLines.join('\n') + '\n', 'utf-8');
  console.log(`\n💾 Sauvegardé dans : ${outPath}`);
  console.log('⚠️  Ce fichier contient des IDs sensibles — vérifiez qu\'il est bien dans .gitignore.\n');

  // 5. Rappel webhook
  console.log('🔗 N\'oubliez pas de configurer le webhook Stripe :');
  console.log('   URL : https://zodiak.netlify.app/.netlify/functions/stripe-webhook');
  console.log('   Événements : checkout.session.completed, customer.subscription.*,');
  console.log('                invoice.payment_succeeded, invoice.payment_failed,');
  console.log('                customer.subscription.trial_will_end');
  console.log('\n   Puis copiez STRIPE_WEBHOOK_SECRET=whsec_... dans les env vars Netlify.\n');
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
