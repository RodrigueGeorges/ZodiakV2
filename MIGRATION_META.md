# Migration Zodiak vers Meta (WhatsApp + Instagram)

> **Document de référence** — état actuel du chantier, ce qui est livré, ce
> qu'il reste à faire, configuration requise, et plan de bascule.
>
> Dernière maj : sprints 1 → 9 (refonte DA "Cosmic Editorial" entière + boucle
> d'engagement (streaks, mood, push, badges) + synastrie/liens + onboarding wow
> + premium + chat avec mémoire + landing cinematic + œuvre cosmique
> générative). Reste les étapes manuelles Supabase / Meta côté ops.

---

## 1. Vue d'ensemble

L'envoi de la guidance quotidienne migre du **SMS (Brevo + Vonage)** vers
**WhatsApp Cloud API + Instagram Messaging API**, en passant par
**Meta Cloud API** (un seul webhook unifié).

### Pourquoi

- **Engagement** : ouverture WhatsApp ~95% en moins d'1h, vs ~20% SMS.
- **Coût** : ~0,04 €/conversation WhatsApp en France vs ~0,05–0,08 €/SMS.
- **UX** : conversation possible (chatbot astro intégrable dans le canal).
- **Marketing** : viralité Instagram (re-share story).
- **Tech** : un seul webhook Meta couvre les deux canaux.

### Ce qui change

| Avant | Après |
|---|---|
| SMS (Brevo) | WhatsApp template HSM **OU** Instagram message |
| 1 cron à 8h UTC fixe | Cron horaire, dispatch par fuseau utilisateur |
| `daily_guidance_sms_enabled` | `daily_guidance_enabled` (canal-agnostique) |
| `phone` (E.164) | `whatsapp_wa_id` **ou** `instagram_igsid` |
| `sms_tracking` | `message_log` (multi-canal, idempotent) |
| RLS publiques (fuite) | RLS service_role only |
| `VITE_BREVO_API_KEY` côté client | Tout côté serveur |

---

## 2. Ce qui a été livré (sprint 1)

### 🔒 Sécurité P0
- **Migration SQL** `supabase/migrations/20260508120000_p0_security_and_meta_channel.sql` :
  - Drop des policies `public USING (true)` sur `guidance_token`, `sms_tracking`, `guidance_cache`.
  - Ajout de policies `service_role` only.
  - Fix du bug `get-token.ts` (colonnes `action`, `accessed_at` ajoutées à `sms_tracking`).
- **`src/lib/types/env.d.ts`** : suppression des variables Vite sensibles
  (`VITE_OPENAI_API_KEY`, `VITE_BREVO_API_KEY`, `VITE_VONAGE_*`, `VITE_ASTRO_*`).
- **`src/lib/services/BrevoService.ts`** : supprimé (exposait la clé Brevo).

### 🗃️ Schéma multi-canal
Migration `20260508120000_p0_security_and_meta_channel.sql` ajoute à `profiles` :
- `preferred_channel` ∈ `whatsapp | instagram | null`
- `whatsapp_wa_id` (UNIQUE) — ID WhatsApp Cloud API du user
- `whatsapp_e164` — numéro affiché côté UI
- `instagram_igsid` (UNIQUE) — IG-scoped user ID
- `instagram_username` — handle (informatif)
- `channel_opt_in_at` — preuve consentement Meta
- `timezone` (NOT NULL DEFAULT `'Europe/Paris'`) — fuseau utilisateur
- `guidance_hour` (0..23, default 8) — heure préférée locale
- `daily_guidance_enabled` — toggle universel (remplace `daily_guidance_sms_enabled`)

Et la nouvelle table **`message_log`** :
```
id, user_id, channel, direction, message_type, template_name,
short_code, guidance_token_id, provider_message_id (UNIQUE),
provider_conversation_id, payload, sent_at, delivered_at, read_at,
clicked_at, failed_at, error_code, error_message
```
Avec RLS `auth.uid() = user_id` en lecture, INSERT/UPDATE service_role only,
et **`UNIQUE(provider_message_id)`** pour absorber les retries Meta.

Un trigger **`sync_daily_guidance_enabled`** synchronise pendant la transition
les colonnes `daily_guidance_sms_enabled` ↔ `daily_guidance_enabled` pour ne
pas casser le code legacy.

### ☁️ Netlify Functions
- **`netlify/functions/_metaUtils.ts`** : helpers WhatsApp + Instagram + signature webhook.
  - `sendWhatsAppTemplate({to, templateName, languageCode, bodyParams, buttonUrlSuffix})`
  - `sendWhatsAppText(to, text)` (fenêtre 24h uniquement)
  - `sendInstagramText({to, text, messagingType, tag})`
  - `verifyMetaSignature(rawBody, signatureHeader)` (HMAC-SHA256, comparaison à temps constant)
  - `handleVerify(query)` (challenge GET d'abonnement)
  - `toMetaPhoneFormat(input)`, `buildGuidanceShortLink(shortCode)`, `getMetaConfig()`
- **`netlify/functions/meta-webhook.ts`** : webhook unifié WhatsApp + Instagram.
  - `GET` → challenge `hub.challenge` si `verify_token` matche.
  - `POST` → vérification signature **obligatoire**, parsing payload,
    persistance `inbound_messages` + `message_log`, mise à jour `message_log`
    sur `statuses` (delivered / read / failed), gestion **opt-in conversationnel**
    (mots-clés `START`, `STOP`, etc.) qui lie automatiquement le `wa_id` ou
    `igsid` au profil par matching simple (à étendre avec un code de jumelage).
- **`netlify/functions/send-daily-guidance.ts`** : RÉÉCRIT.
  - Cron horaire `0 * * * *` (au lieu de `0 8 * * *`).
  - Sélection : `daily_guidance_enabled = true` AND `subscription_status ∈ {active, trial}` AND canal configuré.
  - Filtrage app par `getLocalTime(profile.timezone).hour === profile.guidance_hour`.
  - Idempotence via `message_log` (skip si template déjà envoyé aujourd'hui).
  - `getOrCreateGuidanceToken(userId, dateISO)` réutilise une ligne `guidance_token` existante au lieu d'en générer une nouvelle si valide.
  - Dispatch WhatsApp (template HSM avec `{{1}} = prénom`, `{{2}} = lien` + bouton URL) ou Instagram (texte avec `messaging_type: UPDATE`).
  - Log dans `message_log` (succès et échecs).
  - Garde-fou 8.5s pour ne pas dépasser le timeout Netlify.
- **`netlify/functions/generate-guidance.ts`** : mis à jour.
  - Filtre sur `daily_guidance_enabled` (au lieu de `daily_guidance_sms_enabled`).
  - Skip les profils sans canal Meta configuré (économie OpenAI).
  - Date `Europe/Paris` (au lieu d'UTC) pour cohérence avec `send-daily-guidance`.
  - Pré-calcul des transits une fois (mutualisation).
- **`netlify/functions/_astroEngine.ts`** : wrapper STUB pour migration future
  hors Prokerala (calcul local via `astronomy-engine`, voir §7).
- **`netlify.toml`** :
  - Cron `send-daily-guidance` passé à `0 * * * *`.
  - Cron `generate-guidance` passé à `0 23 * * *` (00h Paris).
  - Redirect `/webhook/meta` → `/.netlify/functions/meta-webhook`.

### 🎨 Front
- **`src/components/PrivateRoute.tsx`** : redirige vers `/login?from=…` (fini le chargement infini).
- **`src/components/DailyGuidanceChannel.tsx`** : nouveau composant —
  toggle, sélection canal (WhatsApp / Instagram), heure (0..23), fuseau
  (10 fuseaux préchargés), instructions deep-link `wa.me` / `ig.me`.
- **`src/components/InboundMessages.tsx`** : réécrit pour lire `message_log` direct
  via Supabase (plus de dépendance à `SMSService` côté client).
- **`src/components/ProfileTab.tsx`** : section SMS supprimée, remplacée
  par `<DailyGuidanceChannel />`. Plus de bouton "test SMS", plus de toggle
  "Notifications SMS".
- **`src/lib/types/supabase.ts`** : `Profile.Row` étendu avec les nouvelles colonnes.
- **`index.html`** :
  - Suppression du `<link rel="stylesheet" href="/assets/index.HASH.css">` figé qui cassait après chaque build.
  - Suppression du `<script>` qui désinscrivait tous les service workers (en conflit avec `main.tsx`).
  - Suppression de `user-scalable=no` (anti-WCAG).
  - Suppression de COOP `same-origin` + COEP `require-corp` (cassaient Stripe Pricing Table et fonts tierces).
  - Suppression Montserrat / Open Sans (jamais utilisés dans le design system).
  - Unification `theme-color` à `#0B1120` (plus de `#F5CBA7` doré orphelin).

---

## 3. Configuration requise (variables d'environnement)

### Côté Netlify (serveur, jamais préfixées `VITE_`)

| Variable | Description | Source |
|---|---|---|
| `META_APP_SECRET` | App Secret Meta (signature webhook HMAC-SHA256). | Meta App → Paramètres |
| `META_VERIFY_TOKEN` | Chaîne arbitraire choisie par toi (saisie côté Meta lors de l'abonnement webhook). | Toi |
| `META_GRAPH_VERSION` | Optionnel (default `v21.0`). | — |
| `WHATSAPP_PHONE_NUMBER_ID` | ID du numéro WhatsApp business. | WhatsApp Manager |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID (utile pour gérer les templates par API). | WhatsApp Manager |
| `WHATSAPP_ACCESS_TOKEN` | Token long-lived ou system user token. | Meta Business → System Users |
| `INSTAGRAM_BUSINESS_ID` | ID du compte IG Business connecté à la page FB. | Graph API Explorer |
| `INSTAGRAM_PAGE_ACCESS_TOKEN` | Page Access Token de la page FB liée. | Graph API Explorer |
| `META_GUIDANCE_TEMPLATE_NAME` | Nom du template HSM approuvé (ex: `guidance_quotidienne`). | Toi |
| `META_GUIDANCE_TEMPLATE_LANG` | Code langue (`fr`, `fr_FR`, etc.). | Toi |
| `OPENAI_API_KEY` | Clé OpenAI (déjà existante). | OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` recommandé. | — |
| `PROKERALA_CLIENT_ID` / `PROKERALA_CLIENT_SECRET` / `PROKERALA_BASE_URL` | Tant qu'on n'a pas migré sur `astronomy-engine`. | Prokerala |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | (déjà existant). | Supabase |
| `URL` | Auto-injectée par Netlify. | — |

### Côté client (Vite, publiques OK)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | (déjà existant) |
| `VITE_SENTRY_DSN` | (optionnel, déjà existant) |
| `VITE_NETLIFY_URL` | (optionnel, déjà existant) |
| `VITE_ZODIAK_WHATSAPP_NUMBER` | Numéro business WhatsApp **format E.164 sans le `+`** (ex: `33612345678`). Utilisé pour le deep-link `wa.me`. |
| `VITE_ZODIAK_INSTAGRAM_HANDLE` | Handle Instagram business **sans `@`** (ex: `zodiakastro`). |

---

## 4. Setup Meta — étape par étape

> **Compter 2-4 semaines incompressibles** pour la validation Meta complète
> (vérification business, validation numéro, approbation des templates).

### 4.1. Meta Business Manager
1. Créer un Business Manager sur [business.facebook.com](https://business.facebook.com).
2. Vérifier l'entreprise (KBIS, justificatif, etc.) → ~3-7 jours.
3. Créer une App Meta de type **Business**.

### 4.2. WhatsApp Cloud API
1. Dans l'App, ajouter le produit **WhatsApp**.
2. Ajouter un **numéro de téléphone** (un numéro fixe ou un nouveau dédié — *le numéro associé ne peut plus être utilisé sur l'app WhatsApp grand public*).
3. Récupérer `WHATSAPP_PHONE_NUMBER_ID` et `WHATSAPP_BUSINESS_ACCOUNT_ID`.
4. Générer un **System User Token** longue durée (à mettre dans `WHATSAPP_ACCESS_TOKEN`).
5. **Templates** : aller dans WhatsApp Manager → Message Templates → Créer.
   - Catégorie : **Marketing** (la guidance est promotionnelle).
   - Nom : `guidance_quotidienne` (doit matcher `META_GUIDANCE_TEMPLATE_NAME`).
   - Langue : `fr`.
   - Body :
     ```
     ✦ Bonjour {{1}}, ta guidance cosmique du jour est arrivée.
     Découvre ce que les astres te disent.
     ```
   - Bouton **URL dynamique** : `https://zodiakastro.com/g/{{1}}`
     (le `{{1}}` du bouton sera remplacé par `short_code` envoyé via `buttonUrlSuffix` dans `_metaUtils.ts`).
   - Compter ~24-48h de validation par template.

### 4.3. Instagram Messaging
1. Créer un compte Instagram **Professional** (Business, pas Creator).
2. Le connecter à la **page Facebook** liée au Business Manager.
3. Activer l'accès aux messages dans l'app Meta (champ webhook `messages`).
4. Récupérer `INSTAGRAM_BUSINESS_ID` via Graph API Explorer (`/me/accounts` puis `/{page-id}?fields=instagram_business_account`).
5. Générer un **Page Access Token** longue durée → `INSTAGRAM_PAGE_ACCESS_TOKEN`.

### 4.4. Webhook
1. Dans l'App Meta → Webhooks.
2. Ajouter un produit `WhatsApp Business Account` :
   - URL : `https://zodiakastro.com/webhook/meta`
   - Verify token : ce que tu as mis dans `META_VERIFY_TOKEN`.
   - Champs : `messages`.
3. Ajouter un produit `Instagram` :
   - URL : `https://zodiakastro.com/webhook/meta` (même endpoint, c'est unifié)
   - Champs : `messages`, `messaging_postbacks`, `messaging_reactions`.

---

## 5. Reste à faire (par phase)

### Phase 1 (cette semaine)
- [ ] Configurer toutes les variables d'env Netlify (cf. §3).
- [ ] Créer le compte Meta Business + numéro WA + IG Pro.
- [ ] Soumettre le template `guidance_quotidienne` à validation Meta.
- [ ] Déployer la branche actuelle en preview Netlify, tester le webhook GET avec curl :
      `curl "https://<preview>.netlify.app/webhook/meta?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=42"`
      → doit renvoyer `42`.
- [ ] Tester l'opt-in conversationnel : DM "START" sur le numéro test.

### Phase 2 — Migration users existants & nettoyage SMS ✅ LIVRÉ (code)
- [x] **Code de jumelage 6 chiffres** : `channel_pairing_codes` + RPC
      `generate_pairing_code(user_id)` + composant React `<PairingCode />`
      intégré à `<DailyGuidanceChannel />`. Le webhook reconnaît le code
      en DM et lie automatiquement le canal.
- [x] **Suppression des fonctions Netlify SMS** : `send-sms`, `send-guidance-sms`,
      `send-test-sms`, `inbound-sms`, `dlr`, `verify-sms`, `server.js`.
- [x] **Suppression du code SMS front** : `src/lib/sms.ts`, `GuidanceService`,
      `TrialExpiryService`, `GuidanceWorkflow`, `RegistrationWorkflow`,
      `useGuidanceScheduler`, `PhoneAuth`, pages `Test`/`RegisterConfirmation`.
- [x] **Fonction admin `meta-test-send.ts`** : envoi de test WA/IG (mode template
      ou texte libre) protégé par JWT Supabase + `ADMIN_EMAILS`.
- [x] **Cleanup repo** : 38 `test-*.mjs` + 47 `.md` de patch supprimés à la racine.
- [ ] **Reste à faire (ops, hors code)** :
      campagne email "Le SMS s'arrête, choisis ton canal" + monitoring
      des opt-ins Meta sur 4 semaines de coexistence.

### Phase 3 — Astronomy-engine ✅ LIVRÉ (code)
- [x] `astronomy-engine ^2.1.19` ajouté à `package.json`. Reste à faire :
      `npm install` côté ops.
- [x] `computeDailyTransitsLocal(date)` réelle (Soleil + Lune + 5 planètes,
      retrograde calculé sur ±1 jour) dans `_astroEngine.ts`.
- [x] `computeNatalChart(date, lat, lon)` avec Ascendant + MC + maisons
      Whole-sign (Placidus laissé en TODO formel — Whole-sign est
      astrologiquement légitime et plus stable aux hautes latitudes).
- [x] `_guidanceUtils.calculateDailyTransits` branchée sur le moteur local :
      Prokerala n'est plus appelé pour la guidance quotidienne. Coût runtime
      transits = 0 €.
- [x] `health.ts` mis à jour (checks Meta WhatsApp / Instagram).

### Phase 4 — Design "Cosmic Editorial" ✅ FONDATIONS LIVRÉES
- [x] **Nouveaux design tokens** dans `tailwind.config.js` v2 :
      palette `night-*` (fond), `ivory-*` (texte), `aurora-*` (accent),
      `magenta-*`, `amber-*`. Anciens `primary`/`secondary`/`cosmic-*`
      gardés en aliases pour la rétrocompat.
- [x] Échelle typographique modulaire : `display-xl`, `display`, `h1`-`h3`,
      `body-lg`/`body`, `caption`, `micro`.
- [x] Animations sobres : `aurora-drift` (24s), `breath` (6s).
- [x] **`src/index.css` réduit** de 804 → ~140 lignes (suppression `!important`,
      doublons keyframes, utilitaires mobile-* jamais utilisés). Ajout d'un
      `@media (prefers-reduced-motion)` pour l'accessibilité.
- [x] **`src/lib/constants/design.ts` supprimé** (anti-pattern Tailwind JIT).
- [x] **`src/styles/animations.css` supprimé** (orphelin).
- [x] **Composants morts supprimés** : `CosmicPageTransition`, `PageTransition`,
      `AnimatedAstroLogo`, `UserListTest`, `useStore` zustand.
- [x] **Dépendances retirées** : `react-query` v3, `zustand`,
      `@vonage/server-sdk`, `algoliasearch`, `cors`, `express`. Reste à faire :
      `npm install` côté ops pour purger `node_modules`.
- [x] **Page `Home` refondue** dans la nouvelle DA (référence) : hero éditorial,
      4 cards features, modale auth aurora, halos animés.
- [ ] **À faire en sprint design dédié** : refonte `Guidance`, `Natal`,
      `Profile`, `ChatAstro`, `Subscribe` dans la même DA. La page Home sert
      de référence visuelle.

---

## 6. Migration des users existants

### Stratégie recommandée

1. **Snapshot** : avant déploiement Phase 2, sauvegarder un export de
   `profiles` (CSV avec `id`, `phone`, `daily_guidance_sms_enabled`).
2. **Communication** : envoyer un email à tous les users actifs avec un
   message du type :

   > *Bonjour, à partir du \[DATE\], ta guidance quotidienne sera envoyée sur
   > **WhatsApp** ou **Instagram** plutôt que par SMS. Choisis ton canal en
   > 1 clic dans ton profil — c'est plus joli, plus rapide, et tu pourras
   > même me poser des questions !*

3. **Période de transition** (4 semaines) : les deux pipelines tournent en
   parallèle, avec une priorité au canal Meta si configuré, sinon fallback
   SMS legacy.
4. **Coupure SMS** : après 4 semaines, retirer le pipeline SMS et facturer
   uniquement Meta.

### Points d'attention
- Les profils sans `phone` valide aujourd'hui doivent quand même pouvoir
  s'inscrire et activer un canal (WhatsApp ou Instagram).
- Le `phone` ne sera plus utilisé pour l'envoi mais reste utile pour
  les notifications transactionnelles ponctuelles (vérification compte,
  mot de passe oublié) — à décider.

---

## 7. Stack astrologique : pourquoi `astronomy-engine` ?

| Solution | Précision | Coût | Compat Netlify | Verdict |
|---|---|---|---|---|
| Prokerala | Excellente | $$ ($9-49/mois + facturation à la requête) | ✅ HTTP | Cher à grande échelle |
| AstrologyAPI.com | Bonne | $ (~$9/mois pour 1500 calls) | ✅ HTTP | Moins cher mais même problème |
| Swiss Ephemeris (`swisseph`) | Référence (~0.1") | Gratuit GPL / 700€ pro | ❌ Bindings C++ natifs | Compliqué à packager |
| Swiss Ephemeris WASM | Référence | Idem GPL/pro | ⚠️ Capricieux à packager | Possible mais lourd |
| **`astronomy-engine`** | **~1 arcminute** (largement suffisant grand public) | **0€** | ✅ JS pur, MIT | **🎯 Choix retenu** |
| `astronomia` | ~5" (variable) | 0€ | ✅ JS pur | Moins maintenu |

À long terme, `astronomy-engine` est la **bonne décision CTO** : 0€ runtime,
scalable à l'infini, indépendance technique. Le wrapper `_astroEngine.ts` est
déjà en place — il suffit d'`npm i astronomy-engine` et d'implémenter
`computeDailyTransitsLocal`.

---

## 8. Variables d'environnement supprimées (à révoquer côté providers)

Une fois la migration validée, **révoquer les clés suivantes** dans les dashboards :

- **Brevo** : révoquer la clé qui était dans `VITE_BREVO_API_KEY` (elle a fuité dans le bundle JS pendant la durée de vie du code legacy).
- **Vonage** : révoquer `VITE_VONAGE_API_KEY` / `VITE_VONAGE_API_SECRET` (idem).
- **OpenAI** : révoquer la clé qui était dans `VITE_OPENAI_API_KEY` ; en générer une nouvelle pour `OPENAI_API_KEY` côté serveur.
- **Prokerala / Astro** : idem.

---

## 9. Tests / Vérification

### Sur la migration P0 (à faire avant tout déploiement prod)
```sql
-- Vérifier que les RLS publiques ont bien été supprimées
SELECT polname, polcmd, polqual, polroles FROM pg_policy
WHERE polrelid IN ('guidance_token'::regclass, 'sms_tracking'::regclass, 'guidance_cache'::regclass);
-- Aucune ligne ne doit avoir polqual = 'true' avec polroles incluant le rôle 'public'.
```

### Sur le webhook Meta (preview Netlify)
```bash
# 1. Verify GET
curl "https://<preview>.netlify.app/webhook/meta?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=ping"
# Attendu : "ping"

# 2. POST sans signature
curl -X POST -H "Content-Type: application/json" -d '{"object":"whatsapp_business_account"}' \
  "https://<preview>.netlify.app/webhook/meta"
# Attendu : 401 "Invalid signature"

# 3. POST avec signature (test local en bash)
BODY='{"object":"whatsapp_business_account","entry":[]}'
SIG="sha256=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$META_APP_SECRET" -hex | awk '{print $2}')"
curl -X POST -H "Content-Type: application/json" -H "X-Hub-Signature-256: $SIG" -d "$BODY" \
  "https://<preview>.netlify.app/webhook/meta"
# Attendu : 200 "EVENT_RECEIVED"
```

### Sur le cron `send-daily-guidance` (manuel)
```bash
# Forcer un run :
curl -X POST "https://<preview>.netlify.app/.netlify/functions/send-daily-guidance"
# Lire le body retourné : { total, dispatched, skipped, errors, reasons, elapsedMs }
```

---

## 10. Changelog des fichiers

### Ajoutés (sprints 1 + 2 + 3 + 4)
- `supabase/migrations/20260508120000_p0_security_and_meta_channel.sql`
- `supabase/migrations/20260508130000_pairing_code.sql` *(sprint 2 — table `channel_pairing_codes` + RPC `generate_pairing_code`)*
- `netlify/functions/_metaUtils.ts`
- `netlify/functions/meta-webhook.ts`
- `netlify/functions/meta-test-send.ts` *(sprint 2 — admin only, JWT requis)*
- `netlify/functions/_astroEngine.ts` *(sprint 3 — implémentation réelle astronomy-engine)*
- `src/components/DailyGuidanceChannel.tsx`
- `src/components/PairingCode.tsx` *(sprint 2 — UI code 6 chiffres)*
- `MIGRATION_META.md` (ce fichier)

### Modifiés
- `package.json` *(sprint 3 + 4 : ajout `astronomy-engine`, retrait `react-query` v3, `zustand`, `@vonage/server-sdk`, `algoliasearch`, `cors`, `express`)*
- `tailwind.config.js` *(sprint 4 — palette aurora, échelle typo modulaire)*
- `src/index.css` *(sprint 4 — réduit de 804 → 140 lignes)*
- `src/pages/Home.tsx` *(sprint 4 — refonte complète DA Cosmic Editorial)*
- `src/App.tsx` *(retrait route `/test` et import `Test`)*
- `src/components/ShareModal.tsx` *(suppression partage SMS)*
- `src/components/PrivateRoute.tsx`
- `src/components/InboundMessages.tsx`
- `src/components/ProfileTab.tsx`
- `src/lib/types/env.d.ts`
- `src/lib/types/supabase.ts`
- `src/lib/hooks/index.ts` *(retrait export useGuidanceScheduler)*
- `netlify/functions/send-daily-guidance.ts` (réécrit complet, sprint 1)
- `netlify/functions/generate-guidance.ts` (sprint 1)
- `netlify/functions/_guidanceUtils.ts` *(sprint 3 — Prokerala remplacé par astronomy-engine)*
- `netlify/functions/health.ts` *(sprint 3 — checks Meta + retrait Prokerala)*
- `netlify/functions/meta-webhook.ts` *(sprint 2 — reconnaissance code de jumelage)*
- `netlify.toml`
- `index.html`

### Supprimés (sprints 2 + 3 + 4)
**Backend / Netlify Functions (SMS legacy)** :
- `netlify/functions/send-sms.ts`
- `netlify/functions/send-guidance-sms.ts`
- `netlify/functions/send-test-sms.ts`
- `netlify/functions/inbound-sms.ts`
- `netlify/functions/dlr.ts`
- `netlify/functions/verify-sms.ts`
- `server.js` (Express legacy Vonage)

**Frontend (SMS legacy + dead code)** :
- `src/lib/services/BrevoService.ts` *(sprint 1 — fuite VITE_BREVO_API_KEY)*
- `src/lib/sms.ts`
- `src/lib/services/GuidanceService.ts`
- `src/lib/services/TrialExpiryService.ts`
- `src/lib/workflows/GuidanceWorkflow.ts`
- `src/lib/workflows/RegistrationWorkflow.ts`
- `src/lib/hooks/useGuidanceScheduler.ts`
- `src/lib/store.ts` *(zustand orphelin)*
- `src/lib/api.ts` *(dead code mock data)*
- `src/lib/utils/guidance.ts` *(consommait `design.ts`)*
- `src/lib/constants/design.ts` *(anti-pattern Tailwind JIT)*
- `src/styles/animations.css` *(orphelin)*
- `src/components/PhoneAuth.tsx`
- `src/components/CosmicPageTransition.tsx`
- `src/components/PageTransition.tsx`
- `src/components/AnimatedAstroLogo.tsx`
- `src/components/UserListTest.tsx`
- `src/pages/Test.tsx`
- `src/pages/RegisterConfirmation.tsx`
- `src/__tests__/services/SMSService.test.ts`
- `src/__tests__/services/GuidanceService.test.ts`
- `src/lib/tests/TrialExpiryService.test.ts`

**Hygiène repo** :
- 38 `test-*.{mjs,cjs,js,html}` à la racine
- 47 `.md` de patch obsolètes à la racine (toute la série `CORRECTION_*.md`,
  `RAPPORT_*.md`, `SMS_*_REPORT.md`, `OPTIMISATION_*.md`, etc.)

**Sprint 5 — composants legacy retirés / réécrits** :
- `src/components/Logo/LogoElements.tsx` *(non utilisé)*
- `src/components/constants/LogoConfig.ts` *(non utilisé)*
- `src/components/SMSTest.tsx` *(orphelin)*
- `src/components/LoginButton.tsx` *(orphelin, test cassé)*
- `src/lib/tests/LoginButton.test.tsx`
- `src/components/MobileOptimizedLayout.tsx` *(non utilisé)*
- `src/components/Tabs.tsx` *(non utilisé)*
- `src/components/NatalChartSVG.tsx` *(remplacé par `ZodiacWheel`)*

---

## 11. Sprint 5 — DA "Cosmic Editorial" appliquée à toute l'app ✅

> Référence visuelle : la page Home redessinée en sprint 4 + la palette
> aurora de `tailwind.config.js`. Sprint 5 = on applique partout, avec un
> design system primitives en `src/components/ui/`.

### Système de design (nouveau)

Tous les composants partent désormais de primitives unifiées dans
`src/components/ui/` :

- **`AuroraBackground.tsx`** — fond immersif (3 halos aurora drift + canvas
  étoiles DPR-aware + grain SVG inline + voile de contraste). Variants :
  `default` / `dim` (pour les pages denses).
- **`Card.tsx`** — primitive surface, variants `surface` / `elevated` /
  `ghost`, props `interactive` (hover lift + ring focus) et `glow`.
  Sub-composants : `CardHeader`, `CardBody`, `CardFooter`.
- **`Button.tsx`** — variants `primary` (CTA aurora), `secondary` (action
  douce), `ghost`, `danger` (magenta), `text`. Tailles `sm`/`md`/`lg`,
  `loading` avec spinner, `iconLeft`/`iconRight`, `fullWidth`.
- **`Skeleton.tsx`** — placeholder shimmer aurora + helper `SkeletonText`.
- **`SectionHeader.tsx`** — eyebrow / titre Cinzel display / subtitle, deux
  alignements (`center`/`left`).
- **`EmptyState.tsx`** — état vide cohérent (icône, titre, description, CTA).

### Composants partagés réécrits (DA aurora)

- **`CosmicLoader`** v2 — anneaux aurora ouverts + cœur breath, sans cyan.
- **`Logo`** + **`Logo/CosmicSymbol`** v2 — glyphe minimaliste (cercle ouvert
  + axes + cœur lumineux), prop `withWordmark` pour afficher "Zodiak".
- **`PageLayout`** v2 — squelette éditorial unifié pour les pages
  post-login, basé sur `AuroraBackground` + `SectionHeader`. Props
  `eyebrow`, `headerSlot`, `dim`, `fullHeight`.
- **`LoadingScreen`** v2 — `AuroraBackground variant="dim"` + `CosmicLoader`.
- **`StarryBackground`** — devient un alias de `AuroraBackground` pour la
  rétrocompat (pages `Admin`, `AdminProtection`).
- **`TopNavBar`** v2 — header sticky desktop, "pill" actif animé via
  `motion.layoutId`, glass + halo.
- **`BottomNavBar`** v2 — barre flottante mobile glass aurora, `safe-bottom`,
  pill actif animé identique au top.
- **`InteractiveCard`** — devient un wrapper de `Card` v2.
- **`SkeletonLoader`** — devient un wrapper de `Skeleton` v2.
- **`EmptyState` (legacy)** — wrapper de `ui/EmptyState` avec presets
  `natal` / `guidance` / `profile` / `general`.
- **`ShareButton`** — DA aurora, Web Share API en priorité, menu clean
  (Copier · WhatsApp · X · Instagram).
- **`GuidanceMeter`** — barre fine aurora gradient (au lieu de
  vert/orange/rouge).
- **`GuidanceScoreBadge`** — palette aurora/magenta/amber + label éditorial
  (Rayonnant / Vibrant / Doux / Recueilli).
- **`ZodiacWheel`** v2 — roue zodiacale aurora, planètes avec halo, hub
  central, tooltips au survol, accessible (`role="img"`).
- **`NatalSignature`** v2 — Soleil/Lune/Ascendant en boutons interactifs
  qui ouvrent un toast custom au clic.
- **`NatalChartTab`** v2 — carte du ciel + signature + résumé éditorial +
  interprétation détaillée, tout en cards aurora avec `Skeleton`.
- **`GuidanceDisplay`** v2 — hero éditorial (résumé + date du jour),
  3 sections (Cœur / Chantiers / Vitalité), mantra typographique central
  avec halos.
- **`GuidanceContent`** v2 — états (loading / erreur / vide / loaded) tous
  cohérents avec la DA, CTA "Recevoir ma guidance" éditorial.
- **`PairingCode`** v2 — DA aurora, deep link élégant, compte à rebours,
  Button v2.
- **`DailyGuidanceChannel`** v2 — toggle aurora, segments WhatsApp/Instagram,
  layout 2 colonnes heure/fuseau.
- **`ProfileTab`** v2 — avatar gradient aurora, lignes infos, mode édition
  inline, abonnement, guidance quotidienne, logout. Supprime les vieux
  effets `from-blue-300` / `bg-cosmic-700`.
- **`AuthLayout`** (nouveau) — wrapper aurora pour `Login`, `Register`,
  `RegisterComplete` : header logo + carte glass centrée.
- **`AdminProtection`** v2 — UI accès refusé aurora (était cassée :
  `Logo`/`AlertTriangle` non importés).
- **`ErrorBoundary`** v2 — UI erreur aurora avec ID support, dev details,
  Buttons v2.

### Pages réécrites

| Page | État | Notes |
|---|---|---|
| `Home` | ✅ Sprint 4 | Référence visuelle DA |
| `Login` | ✅ Sprint 5 | `AuthLayout`, eye toggle, autocomplete |
| `Register` | ✅ Sprint 5 | `AuthLayout`, validation 8 chars min |
| `RegisterComplete` | ✅ Sprint 5 | `AuthLayout`, FieldGroup, helper text |
| `Guidance` | ✅ Sprint 5 | `PageLayout` + `GuidanceContent` v2 |
| `Natal` | ✅ Sprint 5 | `PageLayout` + `NatalChartTab` v2 |
| `Profile` | ✅ Sprint 5 | `PageLayout` + `ProfileTab` v2 |
| `ChatAstro` | ✅ Sprint 5 | bulles aurora, suggestions horizontales, typing |
| `Subscribe` | ✅ Sprint 5 | Card pricing 2 colonnes, garanties |
| `GuidanceAccess` | ✅ Sprint 5 | `AuroraBackground` + `SectionHeader` |
| `GuidanceShortRedirect` | ✅ Sprint 5 | Splash `LoadingScreen` aurora |
| `Admin` | ⚠️ Legacy | Fonctionnel mais skin pas refondu (non user-facing) |

### Polish global

- **`App.tsx`** : `AnimatePresence` + `motion.div` autour des routes pour
  fades + slides légers entre pages (respecte `prefers-reduced-motion`).
- **`index.css`** : ajout helper `.scrollbar-thin` pour les zones de
  défilement (chat, suggestions).
- **Accessibilité** : tous les boutons primitifs ont des focus rings
  visibles (`ring-aurora-300`), tous les éléments interactifs ont des
  `aria-label` / `aria-pressed` / `aria-current` pertinents, les SVG
  décoratifs sont `aria-hidden="true"`, les SVG informatifs ont
  `role="img"` + `aria-label`.

---

## 12. Sprint 6 — Boucle d'engagement (streak, mood, push, analytics) ✅

Objectif : transformer Zodiak d'app "consultation" en app "rituel quotidien".

**Migration `20260509000000_engagement_streak_mood_push.sql`** :

- `streaks` (1 ligne / user) — `current_count`, `best_count`, `last_check_in`,
  `total_days`, `freeze_used_at`. Auto check-in chaque ouverture de
  `/guidance` ; +1 si dernier check-in = hier (timezone user), reset sinon.
- `mood_logs` (1 ligne / user / jour) — `mood` (radiant/calm/pensive/tense/
  tired/inspired), `intensity 0-100`, `note`. Unique sur (user_id, date).
- `push_subscriptions` — endpoint + clés VAPID, `last_used_at` pour cleanup.
- `user_badges` — gain idempotent (UNIQUE user_id, badge_id), evaluated
  côté client à chaque update streak/friends/mood.

**Front nouveau** :

- `useStreak`, `StreakFlame` (3 paliers visuels — small/7+/30+ — avec halos
  amber/aurora/magenta + état `willBreakSoon`).
- `useMood`, `MoodCheck` (6 humeurs en grille, tap pour logger).
- `useBadges`, `BadgesGrid`, `lib/badges.ts` (10 badges silencieux : Première
  respiration, Trois aurores, Une lunaison, Cycle complet, Constellation
  fidèle, Premier lien, Lien magnétique, Voix curieuse, Gardien·ne de
  nouvelles lunes, Témoin de pleine lune). Toast cinzel + haptic au gain.
- `usePushNotifications`, `registerServiceWorker.ts`, `PWAInstallPrompt`,
  `public/service-worker.js` (notifications branded + cache shell).
- `lib/analytics.ts` (PostHog wrapper, console.log en dev) — events
  canoniques : `app_opened`, `guidance_viewed`, `streak_incremented`,
  `mood_logged`, `chat_message_sent`, `synastry_shared`, `story_generated`,
  `pwa_installed`, `paywall_seen`, `badge_earned`, etc.
- `lib/haptics.ts` — patterns ('tap', 'success', 'warning', 'streak'),
  respect `prefers-reduced-motion`, throttle 60ms.

**Backend nouveau** :

- `netlify/functions/_pushUtils.ts` — wrapper web-push (VAPID, expiration
  410 → cleanup row).
- `netlify/functions/push-subscribe.ts` — POST endpoint pour persister
  l'abonnement.
- `netlify/functions/send-daily-push.ts` — cron horaire `5 * * * *` qui
  match `guidance_hour` (timezone user) avec UTC+1, fetch summary du jour,
  push branded.

**Page Guidance refondue** :

- `headerSlot` = StreakFlame (auto check-in au mount).
- Push opt-in non-intrusif (Card aurora, dismiss 7j cooldown).
- MoodCheck visible si pas encore de mood aujourd'hui.
- BadgesGrid collapsible en bas, evaluated à chaque update.
- Vibration + analytics sur chaque incrément streak.

---

## 13. Sprint 7 — Synastrie + Liens + Stories ✅

**Migration `20260509000100_synastry_friends_chat_memory.sql`** :

- `friends` — name, relationship, birth data, natal_chart en JSON, avatar emoji.
- `synastries` — base_score 0-100, daily_score, aspects en JSON, summary,
  highlights JSON. UNIQUE (user_id, friend_id).
- `chat_messages` — historique full (role, content, metadata).
- `chat_memory` — résumé condensé long-terme (summary text, facts JSON, topics).

**Front nouveau** :

- `lib/synastry.ts` — calcul local des aspects (conjonction/opposition/
  trine/square/sextile), score 0-100 pondéré (Sun-Moon = poids fort,
  asc-asc, etc.), `pickHighlights` (3 harmonies + 3 frictions).
- `useFriends` — fetch + add (avec calcul natal via Netlify) + remove +
  recompute.
- `netlify/functions/compute-friend-chart.ts` — calcule la carte natale
  d'un proche via `_astroEngine.ts` (ré-utilise la même logique que pour
  l'user lui-même).
- `FriendCard`, `AddFriendForm`, `pages/Friends.tsx`, `pages/SynastryDetail.tsx`.
- `lib/storyGenerator.ts` — render canvas 1080×1920, 3 templates (guidance,
  natal, synastry), branding aurora.
- `StoryShareButton` — modal preview, download PNG, Web Share API,
  Instagram deep-link fallback.
- `AnimatedCounter` — compteur springy (`useSpring` framer-motion) utilisé
  pour les scores synastrie.

**Pages câblées** :

- `BottomNavBar` + `TopNavBar` — ajout entrée "Liens" (Heart) et "Mois"
  (CalendarDays).
- `App.tsx` — routes `/friends`, `/synastry/:id`, `/calendar` (lazy + private).
- `SynastryDetail` — score animé springy + `StoryShareButton` synastry.

---

## 14. Sprint 8 — Onboarding wow + Premium + PWA ✅

**Migration `20260509000200_premium_tier.sql`** :

- `profiles.plan` (free/premium/lifetime) + `plan_renews_at` + `stripe_customer_id`.
- `usage_quotas` (user_id, date, feature, count) + RPC `increment_usage`
  (atomique, retourne `{ allowed, current_count }`).

**Front nouveau** :

- `usePremium` — single source of truth (`isPremium`, `quotas`,
  `trialDaysLeft`). Quotas free : 5 messages chat/jour, 1 ami, 1 story/jour.
  Premium : illimité.
- `PremiumGate` — paywall aurora avec bouton subscribe, mode "preview"
  (blur le contenu derrière). Tracking `paywall_seen` / `paywall_clicked_subscribe`.
- `PWAInstallPrompt` — bannière non-bloquante (`beforeinstallprompt`),
  cooldown 7j, tracking complet.
- `NatalRevealSplash` — splash full-screen post-onboarding qui révèle
  Soleil/Lune/Asc en cascade puis la roue complète (intégré au flow
  `RegisterComplete` après calcul de la carte).
- `index.html` + `manifest.json` — branding cosmic, shortcuts (Guidance,
  Natal, Chat), `theme-color` aurora dark.
- `Logo/CosmicSymbol` v3 — animation `composeOnLoad` (cercle qui se trace,
  cœur qui apparaît, axes qui surgissent), respiration 5s en boucle.

**ChatAstro v3** :

- Quota 5 msg/jour côté front (compteur visible top-right).
- Suggestions contextuelles (mood + phase lunaire) en magenta, suggestions
  génériques en aurora.
- Persistance via `useChatMemory.appendMessage` (toutes les paires
  user/assistant).
- Replay des 10 derniers messages au mount (continuité de session multi-device).
- Si quota atteint → CTA Premium en lieu et place du bouton Send.

---

## 15. Sprint 9 — Cosmic calendar + Mémoire long-terme + Wow visuels ✅

**Cosmic Calendar (premium)** :

- `lib/moonPhase.ts` — calcul pur JS (Brown's lunation simplifiée),
  `moonPhaseAt(date)` retourne `{ kind, label, glyph, illumination }`.
- `pages/Calendar.tsx` — 30j à venir, key dates highlightées (new/full),
  `PremiumGate` strict pour les non-premium.

**Chat Memory** :

- `useChatMemory` — fetch chat_memory.summary + 50 derniers messages,
  `appendMessage(role, content, metadata)`.
- ChatAstro injecte les 6 derniers messages dans le payload OpenAI pour
  contextualiser, plus mood + phase lunaire.

**Wow visuels — la pivot DA** :

- `AuroraShader` — fragment shader WebGL2 plein-écran (~3kB), 3 halos
  procéduraux qui dérivent + simplex noise 2 octaves animé. Pas de
  Three.js. Respect `prefers-reduced-motion` (statique).
- `KineticTitle` — kinetic typography (mots qui rentrent un par un avec
  blur+slide+spring), utilisé sur la landing.
- `NatalArt` — œuvre générative dérivée des longitudes planétaires
  (mandala canvas 2D, signature unique par user). Toggle "Œuvre / Carte"
  dans `NatalChartTab`. Export PNG 1080×1080 pour stories.
- `Home.tsx` v3 — landing en 6 chapitres : hero shader / "Le ciel ce soir"
  (live moon phase) / "Trois rituels" / "Œuvre cosmique" / Pricing 4,99€ /
  CTA final. Parallax léger via `useScroll`/`useTransform`.

**Polish micro-interactions** :

- Springs physiques sur transitions de pages (`stiffness: 220, damping: 28`)
  remplaçant les cubic-bezier.
- `AnimatedCounter` springy sur scores synastrie + streak.
- Vibrations haptic sur taps clés (nav, success, streak +1).
- `service-worker.js` cache `no-cache, no-store` côté Netlify pour update
  immédiat des nouvelles versions.

**ENV ajoutés** :

- `VITE_VAPID_PUBLIC_KEY` (public, pour `pushManager.subscribe`).
- `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST` (analytics).
- Côté serveur : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  (mailto:contact@…) pour `web-push`.

**netlify.toml** :

- `[functions."send-daily-push"] schedule = "5 * * * *"`.
- Cache headers spécifiques pour `/service-worker.js`.
- `external_node_modules += ["web-push"]`.

**package.json** :

- Ajout : `posthog-js`, `web-push`, `@types/web-push`.

---

## 16. Étapes manuelles à ta charge (ops)

1. **Supabase** — appliquer les migrations dans l'ordre :
   ```bash
   supabase db push
   # OU via le dashboard SQL :
   # 1. supabase/migrations/20260508120000_p0_security_and_meta_channel.sql
   # 2. supabase/migrations/20260508130000_pairing_code.sql
   # 3. supabase/migrations/20260509000000_engagement_streak_mood_push.sql
   # 4. supabase/migrations/20260509000100_synastry_friends_chat_memory.sql
   # 5. supabase/migrations/20260509000200_premium_tier.sql
   ```
   Puis vérifier que les RLS publiques ont disparu (cf. §9).

2. **Meta Business Manager** — suivre §4 :
   - Créer App + numéro WhatsApp + Instagram Pro.
   - Soumettre le template `guidance_quotidienne` en français à validation Meta (24-48h).
   - Configurer le webhook : `https://<ton-domaine>/webhook/meta`.

3. **VAPID keys (Web Push)** :

   ```bash
   npx web-push generate-vapid-keys
   # → publicKey  → VITE_VAPID_PUBLIC_KEY (Netlify env, exposé client)
   # → privateKey → VAPID_PRIVATE_KEY     (Netlify env, server only)
   # + VAPID_PUBLIC_KEY (server) = même valeur que la VITE_…
   # + VAPID_SUBJECT = mailto:contact@zodiakastro.com
   ```

4. **PostHog (optionnel mais recommandé)** :
   - Créer projet sur https://eu.posthog.com
   - Récupérer la project key
   - Coller dans Netlify : `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST` (par défaut
     `https://eu.i.posthog.com`).

5. **Variables d'environnement Netlify** — coller toutes celles de §3 + ci-dessus
   dans les Site Settings → Environment Variables.

6. **`npm install`** côté local + redeploy Netlify pour récupérer les nouveaux
   packages (`web-push`, `posthog-js`, `@types/web-push`) et purger les
   packages SMS legacy.

7. **Révoquer les anciennes clés** côté providers (Brevo, Vonage, OpenAI v1,
   Prokerala) — cf. §8.

8. **Communication users** : envoyer la campagne email de bascule
   (cf. §6 pour le template).

9. **Génération icônes PWA** (si pas encore fait) — `public/icon-192.png`,
   `public/icon-512.png`, `public/icon-maskable-512.png`. Utilisez
   l'Œuvre cosmique générative comme inspiration.
