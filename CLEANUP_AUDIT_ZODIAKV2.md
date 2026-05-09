# Audit du dossier `ZodiakV2/` dupliqué

> Aucun fichier n'a été supprimé par cet audit.
> Une fois validé, lance les commandes git de la section finale.

## Constat

Le repo contient **deux fois** une grande partie du code source :

| Emplacement              | Rôle apparent                              | Statut       |
| ------------------------ | ------------------------------------------ | ------------ |
| `./src/`                 | **Code de production actuel**              | À conserver  |
| `./ZodiakV2/src/`        | Snapshot historique (avant migration meta) | À supprimer  |
| `./tests/e2e/`           | Tests E2E actifs                           | À conserver  |
| `./ZodiakV2/tests/`      | Tests E2E historiques                      | À supprimer  |
| `./netlify/functions/`   | Functions de production                    | À conserver  |
| `./ZodiakV2/netlify/`    | Functions historiques (encore en SMS)      | À supprimer  |
| `./ZodiakV2/test-*.mjs`  | ~40 scripts de test SMS one-shot           | À supprimer  |
| `./ZodiakV2/*.md`        | ~50 rapports d'optimisation historiques    | À archiver   |

## Indices que `ZodiakV2/` est legacy

1. Beaucoup de fichiers parlent de **SMS** (`send-sms.ts`, `verify-sms.ts`,
   `track-sms.ts`, `SMS_TRACKING_SYSTEM.md`…) alors que la production est
   passée à WhatsApp / Instagram en 2026.
2. Les composants graphiques sont d'**ancienne génération** :
   `LogoTest.tsx`, `MobileOptimizedCard.tsx`, `StarryBackground.tsx`,
   `CosmicLoader.tsx` — qu'on n'utilise plus dans `./src/`.
3. Plus de **40 scripts `test-*.mjs`** one-shot à la racine de
   `ZodiakV2/`, qui datent de la phase de stabilisation.
4. Un `package.json` séparé qui n'est jamais buildé par CI ni Netlify.

## Risques avant suppression (à vérifier)

- [ ] Aucune route Netlify n'importe depuis `./ZodiakV2/netlify/functions/`
      (à vérifier dans `netlify.toml` à la racine).
- [ ] Aucun script `npm` racine ne lance `cd ZodiakV2 && ...`.
- [ ] Aucun import TypeScript ne référence `../ZodiakV2/...`.

```bash
# Pour vérifier (PowerShell) :
rg "ZodiakV2" --type ts --type tsx --type json -g "!ZodiakV2/**"
```

## Suppression proposée

Une fois les vérifications faites :

```bash
# 1. Archiver d'abord (au cas où) sur une branche dédiée
git checkout -b archive/zodiakv2-snapshot-2026-05
git add ZodiakV2/
git commit -m "archive: snapshot du dossier ZodiakV2/ avant suppression"
git push origin archive/zodiakv2-snapshot-2026-05

# 2. Revenir sur main et supprimer
git checkout main
git rm -r ZodiakV2/
git commit -m "chore(cleanup): supprime le dossier ZodiakV2/ (legacy SMS)"
```

## Bénéfices attendus

- ⚡ Recherches `Grep` / IDE ~ 2× plus rapides (moitié de fichiers en moins).
- 🧠 Plus de confusion entre l'ancien et le nouveau code.
- 📦 Repo plus léger à cloner (~ 30 MB économisés au pifomètre).
