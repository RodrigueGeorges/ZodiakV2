# Correction du problème des liens SMS

## Problème identifié

Les SMS envoyés via la fonction `send-guidance-sms.ts` ne contenaient pas de liens vers l'application, contrairement aux SMS envoyés via `send-daily-guidance.ts` qui généraient correctement des liens courts.

## Cause du problème

La fonction `sendSms` dans `_guidanceUtils.ts` ne générait pas de liens courts et envoyait seulement le contenu de la guidance dans le SMS, sans lien vers l'application.

## Solutions implémentées

### 1. Modification de `_guidanceUtils.ts`

- **Ajout du paramètre `userId`** à la fonction `sendSms`
- **Génération de liens courts** quand `userId` est fourni
- **Création de tokens uniques** avec expiration de 24h
- **Sauvegarde en base de données** des tokens et du tracking
- **Contenu SMS adaptatif** : avec lien court ou contenu complet selon le contexte

### 2. Modification de `send-guidance-sms.ts`

- **Passage de l'ID utilisateur** à la fonction `sendSms`
- **Génération automatique des liens courts** pour chaque SMS

### 3. Fonctionnalités ajoutées

#### Génération de liens courts
```typescript
const shortCode = generateShortCode(); // Code de 6 caractères
const token = randomUUID(); // Token unique
const shortLink = `${appUrl}/g/${shortCode}`;
```

#### Tracking des interactions
- **Ouverture du lien** : tracking automatique via image invisible
- **Clic sur le lien** : tracking via requête fetch
- **Statistiques** : stockage en base de données

#### Sécurité
- **Expiration automatique** : 24h après génération
- **Tokens uniques** : un par SMS
- **Validation** : vérification de l'existence et de la validité

## Structure des liens

### Format du lien court
```
https://zodiak.netlify.app/g/{shortCode}
```

### Exemple de SMS
```
✨ Bonjour [Prénom] !

Découvre ta guidance du jour ! 🌟
Les astres ont un message spécial pour toi 👇
https://zodiak.netlify.app/g/AbC123
(Valable 24h)
```

## Flux de fonctionnement

1. **Génération du SMS** : La fonction `sendSms` génère un lien court unique
2. **Sauvegarde** : Le token et le code court sont sauvegardés en base
3. **Envoi SMS** : Le SMS contient le lien court
4. **Réception** : L'utilisateur clique sur le lien
5. **Redirection** : `GuidanceShortRedirect` traite le lien court
6. **Tracking** : Les interactions sont enregistrées
7. **Affichage** : `GuidanceAccess` affiche la guidance personnalisée

## Tables de base de données utilisées

### `guidance_token`
- `user_id` : ID de l'utilisateur
- `token` : Token unique pour accès
- `short_code` : Code court du lien
- `date` : Date de génération
- `expires_at` : Date d'expiration

### `sms_tracking`
- `user_id` : ID de l'utilisateur
- `short_code` : Code court du lien
- `token` : Token associé
- `sent_at` : Date d'envoi du SMS
- `opened_at` : Date d'ouverture du lien
- `clicked_at` : Date de clic sur le lien

## Tests

Un script de test `test-sms-links.mjs` a été créé pour vérifier :
- La génération des liens courts
- La sauvegarde en base de données
- L'accessibilité des liens
- Le contenu des SMS

## Résultat

✅ **Problème résolu** : Les SMS contiennent maintenant des liens courts fonctionnels qui redirigent vers la guidance personnalisée de l'utilisateur.

✅ **Tracking activé** : Les interactions avec les liens sont tracées pour des analyses futures.

✅ **Sécurité renforcée** : Les liens expirent automatiquement et sont uniques par SMS. 