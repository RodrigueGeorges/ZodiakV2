# Stripe — Onboarding & déploiement ZodiakV2

Checklist de configuration Stripe pour le modèle économique v2 (forfait 8,90 €/mois + packs extras).

---

## 1. Création du compte Stripe

1. Crée un compte sur https://dashboard.stripe.com/register
2. Active le mode **TEST** (toggle en haut à gauche du dashboard)
3. Renseigne les infos business sous **Settings → Business**

---

## 2. Activation Stripe Tax (TVA OSS)

Le modèle économique utilise **Stripe Tax** pour ventiler la TVA selon le pays du client (OSS UE).

### Pré-requis
- Adresse de l'entreprise renseignée (origine OSS)
- Enregistrement OSS-UE auprès de l'administration française (formulaire en ligne via impots.gouv.fr)

### Configuration
1. Dashboard → **Tax → Settings**
2. **Origin address** : renseigne l'adresse de ton entreprise
3. **Tax registrations** : ajoute "France · OSS scheme · Union OSS" + tous les pays UE où tu vends
4. **Default tax code** : `txcd_10103001` (Digital services standard)
5. Activer **automatic_tax** sur les checkout sessions → déjà fait dans `@/netlify/functions/create-checkout-session.ts`

> ⚠️ Stripe Tax facture 0,5% du CA. Si tu préfères gérer manuellement, désactive `automatic_tax: { enabled: true }` dans `create-checkout-session.ts` et reviens à des prix TTC fixes.

---

## 3. Création des produits & prix

Le script `@/scripts/setup-stripe-products.ts` crée automatiquement :

| Produit | Type | Prix | Description |
|---|---|---|---|
| **Zodiak Premium** | Subscription mensuelle | 8,90 € | 100 messages inclus/cycle + features complètes |
| **Pack Étoile Filante** | One-time | 3,99 € | 10 messages extras |
| **Pack Pleine Lune** | One-time | 9,99 € | 30 messages extras |
| **Pack Constellation** | One-time | 24,99 € | 100 messages extras |
| **Pack Galaxie** | One-time | 59,99 € | 300 messages extras |

### Exécution

```bash
# TEST
export STRIPE_SECRET_KEY=sk_test_...
npx ts-node --esm scripts/setup-stripe-products.ts

# LIVE (après validation)
export STRIPE_SECRET_KEY=sk_live_...
npx ts-node --esm scripts/setup-stripe-products.ts
```

Le script génère `.stripe-prices.env` avec les `STRIPE_PRICE_*` à copier dans Netlify (cf. §5).

---

## 4. Configuration du webhook Stripe

### Création
1. Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL** : `https://zodiakastro.com/.netlify/functions/stripe-webhook`
3. **Events to send** (cocher uniquement ces 6) :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. **Signing secret** → copie `whsec_...` dans `STRIPE_WEBHOOK_SECRET` (cf. §5)

### Smart Retries (paiements échoués)
Dashboard → **Settings → Subscriptions and emails → Smart Retries**
- Active **3 retries** sur 7 jours (recommandé)
- Action après échec final : **Mark subscription as canceled**

> Le code applicatif gère `past_due` comme **isActive=true** pendant les retries (voir `@/src/lib/hooks/useSubscription.ts:55-59`).

---

## 5. Variables d'environnement Netlify

Dans **Netlify → Site settings → Environment variables**, ajoute :

### Côté serveur (functions)
```bash
STRIPE_SECRET_KEY=sk_live_...            # ou sk_test_... en preview
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM=price_...           # Abo mensuel 8,90 €
STRIPE_PRICE_FILANTE=price_...           # Pack 10 msgs
STRIPE_PRICE_LUNE=price_...              # Pack 30 msgs
STRIPE_PRICE_CONSTELLATION=price_...     # Pack 100 msgs
STRIPE_PRICE_GALAXIE=price_...           # Pack 300 msgs
```

### Côté client (Vite — préfixe VITE_ obligatoire)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_PREMIUM=price_...
VITE_STRIPE_PRICE_FILANTE=price_...
VITE_STRIPE_PRICE_LUNE=price_...
VITE_STRIPE_PRICE_CONSTELLATION=price_...
VITE_STRIPE_PRICE_GALAXIE=price_...
```

⚠️ Les valeurs `STRIPE_PRICE_*` et `VITE_STRIPE_PRICE_*` doivent être **identiques** (le backend et le frontend partagent les mêmes IDs).

---

## 6. Test end-to-end (mode test)

### Cartes de test
| Cas | Numéro | CVV | Date |
|---|---|---|---|
| Paiement réussi | `4242 4242 4242 4242` | n'importe | future |
| 3DS challenge | `4000 0027 6000 3184` | n'importe | future |
| Refusée | `4000 0000 0000 9995` | n'importe | future |
| Trial sans CB invalide | `4000 0082 6000 3178` | n'importe | future |

### Scénarios à valider
1. **Souscription complète** : `/subscribe` → checkout → retour `?subscribed=1` → toast bienvenue ✓
2. **Achat pack pendant chat** : `/guide-astral` → épuiser quota → modal → achat 9,99 € → +30 msgs ✓
3. **Renouvellement mensuel** : avancer l'horloge Stripe → `invoice.payment_succeeded` → `messages_used_this_period` reset à 0 ✓
4. **Annulation** : `Customer Portal` → cancel at period end → vérifier que `isActive` reste vrai jusqu'à la fin du cycle ✓
5. **Paiement échoué** : carte refusée au renouvellement → `past_due` → accès maintenu pendant 7 jours ✓
6. **Webhook signature invalide** : envoyer un POST sans signature → 400 ✓

---

## 7. Customer Portal (gestion abonnement self-service)

1. Dashboard → **Settings → Customer Portal**
2. Configure :
   - **Cancellations** : `Allow customers to cancel subscriptions` ✓ + `At the end of the billing period`
   - **Subscription updates** : désactiver (un seul plan)
   - **Invoice history** : ✓
   - **Payment method updates** : ✓
3. Branding : logo, couleurs, URL retour (`https://zodiakastro.com/profile`)

Le portal est accessible côté front via une fonction Netlify dédiée (à créer si pas encore : `create-portal-session.ts`).

---

## 8. Checklist de mise en prod

- [ ] Stripe Tax configuré + OSS activé
- [ ] Produits & prix créés en mode LIVE via `setup-stripe-products.ts`
- [ ] Webhook LIVE configuré pointant vers prod Netlify
- [ ] Variables d'env LIVE ajoutées dans Netlify (sans suffixe preview)
- [ ] Migration SQL `20260515000000_economic_model_fixes.sql` appliquée
- [ ] `scripts/migrate-existing-users.ts` exécuté en DRY_RUN puis en LIVE
- [ ] Test end-to-end #1 à #6 validés en TEST
- [ ] CGV/CGU mises à jour (mention OSS, packs valables 12 mois, droit de rétractation)
- [ ] PostHog dashboard "Funnel pack purchase" créé pour suivre les conversions

---

## 9. Dépannage courant

| Symptôme | Cause probable | Fix |
|---|---|---|
| Webhook reçoit 400 | Signature invalide | Vérifier `STRIPE_WEBHOOK_SECRET` correspond à l'endpoint utilisé |
| `automatic_tax` rejette le checkout | Adresse business manquante | Settings → Business → adresse complète |
| Renouvellement non détecté | Webhook event `invoice.payment_succeeded` non coché | Re-créer le webhook avec les 6 events listés §4 |
| Pack acheté mais crédits non ajoutés | `STRIPE_PRICE_*` env vars manquantes dans Netlify | Vérifier `PACK_MAPPING` dans `@/netlify/functions/stripe-webhook.ts:14-19` |
| User passe en `expired` au renouvellement KO | `past_due` mappé en `expired` (ancien bug) | Vérifier que `@/netlify/functions/stripe-webhook.ts:272` retourne `'past_due'` |

---

## 10. Liens utiles

- Dashboard Stripe : https://dashboard.stripe.com
- Stripe CLI (test webhooks local) : `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`
- Stripe API ref : https://stripe.com/docs/api
- Tax codes : https://stripe.com/docs/tax/tax-codes
- OSS scheme info : https://www.impots.gouv.fr/professionnel/guichet-unique-tva-ioss-et-oss
