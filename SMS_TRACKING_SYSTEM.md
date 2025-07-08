# Système de Tracking SMS - ZodiakV2

## 📋 Vue d'ensemble

Le système de tracking SMS permet de suivre l'engagement des utilisateurs avec les liens de guidance envoyés par SMS. Il capture les ouvertures et les clics pour mesurer l'efficacité des campagnes SMS.

## 🏗️ Architecture

### 1. Base de données
- **Table `sms_tracking`** : Stocke toutes les interactions avec les liens SMS
- **Table `guidance_token`** : Gère les tokens de sécurité pour les liens courts

### 2. Fonctions Netlify
- **`send-daily-guidance.ts`** : Envoie les SMS avec teasing personnalisé
- **`track-sms.ts`** : Gère le tracking des ouvertures et clics

### 3. Frontend
- **`GuidanceShortRedirect.tsx`** : Page de redirection avec tracking intégré
- **`SMSTrackingStats.tsx`** : Dashboard de statistiques pour l'admin

## 📊 Fonctionnalités

### Teasing SMS Personnalisé
Le système génère des messages de teasing basés sur les scores de guidance :

- **Score ≥ 80%** : Messages très engageants ("Une journée d'amour exceptionnelle vous attend !")
- **Score ≥ 70%** : Messages positifs ("Les astres vous réservent de belles surprises !")
- **Score < 70%** : Messages de sagesse ("Découvrez comment naviguer cette journée avec sagesse !")

### Tracking Automatique
- **Ouverture** : Détectée via une image pixel invisible
- **Clic** : Enregistré lors de la redirection
- **Métadonnées** : User agent, IP, timestamp

### Statistiques en Temps Réel
- Taux d'ouverture et de clic
- Activité des 7 derniers jours
- Graphiques visuels dans le dashboard admin

## 🔧 Configuration

### Variables d'environnement requises
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_NETLIFY_URL=https://your-app.netlify.app
```

### Migration de base de données
```sql
-- Exécuter la migration 20250206000000_add_sms_tracking.sql
-- Cette migration crée la table sms_tracking avec tous les index nécessaires
```

## 📱 Format SMS Amélioré

### Avant
```
✨ Bonjour [nom] !

Ta guidance du [date] :
🌞 [résumé]
💖 Amour : [texte]
💼 Travail : [texte]
⚡ Énergie : [texte]

👉 Guidance complète : [lien]

🌟 Mantra : "[mantra]"
```

### Après
```
✨ Bonjour [nom] !

[TEASING PERSONNALISÉ]

📅 Guidance du [date] :
🌞 [résumé]

🔮 Découvrez vos conseils personnalisés :
💖 Amour (XX%) : [texte tronqué]...
💼 Travail (XX%) : [texte tronqué]...
⚡ Énergie (XX%) : [texte tronqué]...

👉 Guidance complète (valable 24h) : [lien]

🌟 Mantra : "[mantra]"

✨ Généré spécialement pour vous avec votre thème natal ✨
```

## 🚀 Utilisation

### 1. Envoi automatique
Les SMS sont envoyés automatiquement via la fonction `send-daily-guidance.ts` qui :
- Génère un teasing personnalisé
- Crée une entrée de tracking
- Envoie le SMS avec le format amélioré

### 2. Tracking automatique
Quand un utilisateur clique sur le lien :
1. `GuidanceShortRedirect.tsx` intercepte la requête
2. Envoie un tracking d'ouverture (pixel invisible)
3. Envoie un tracking de clic
4. Redirige vers la guidance

### 3. Visualisation des stats
Dans le dashboard admin (`/admin`) :
- Statistiques globales en temps réel
- Graphique des 7 derniers jours
- Taux d'engagement détaillés

## 📈 Métriques Disponibles

### Statistiques Globales
- **Total SMS envoyés** : Nombre total de SMS envoyés
- **Total ouvertures** : Nombre de SMS ouverts
- **Total clics** : Nombre de clics sur les liens
- **Taux d'ouverture** : Pourcentage d'ouverture
- **Taux de clic** : Pourcentage de clic

### Statistiques Journalières
- Activité par jour sur les 7 derniers jours
- Comparaison jour par jour
- Tendances d'engagement

## 🔒 Sécurité

### Protection des données
- **RLS (Row Level Security)** : Les utilisateurs ne voient que leurs propres données
- **Tokens uniques** : Chaque lien a un token de sécurité
- **Expiration automatique** : Les liens expirent après 24h

### Validation
- Vérification des tokens avant tracking
- Validation des paramètres d'entrée
- Gestion des erreurs robuste

## 🧪 Tests

### Script de test
```bash
node test-sms-tracking.mjs
```

Ce script teste :
- Création d'entrées de tracking
- Simulation d'ouvertures et clics
- Calcul des statistiques
- Nettoyage des données de test

## 📝 Logs et Monitoring

### Logs automatiques
- Envoi de SMS avec teasing
- Tracking d'ouvertures et clics
- Erreurs de tracking (sans bloquer l'expérience utilisateur)

### Monitoring
- Dashboard admin en temps réel
- Alertes en cas d'erreurs
- Métriques d'engagement

## 🔄 Maintenance

### Nettoyage automatique
- Les entrées de tracking sont conservées pour l'analyse
- Les tokens expirés sont automatiquement invalidés
- Pas de nettoyage automatique des données (pour l'analyse historique)

### Optimisations
- Index sur les colonnes fréquemment consultées
- Requêtes optimisées pour les statistiques
- Cache des métriques fréquentes

## 🎯 Objectifs d'Engagement

### Métriques cibles
- **Taux d'ouverture** : > 60%
- **Taux de clic** : > 15%
- **Engagement quotidien** : Augmentation progressive

### Améliorations continues
- A/B testing des messages de teasing
- Optimisation des heures d'envoi
- Personnalisation accrue des messages

---

*Système développé pour ZodiakV2 - Tracking SMS intelligent et personnalisé* 