# Diagnostic et correction des problèmes OpenAI Guidance

## Problèmes identifiés

### 1. **Gestion d'erreurs insuffisante**
- Pas de logs détaillés pour diagnostiquer les problèmes
- Gestion d'erreur trop générique avec `catch {}`
- Pas de validation des réponses OpenAI

### 2. **Validation des données d'entrée manquante**
- Pas de vérification de la présence des clés API
- Pas de validation des données natal_chart et transits
- Pas de vérification de la structure des données

### 3. **Parsing JSON fragile**
- Pas de gestion des erreurs de parsing JSON
- Pas de validation de la structure de réponse
- Pas de correction automatique des scores invalides

### 4. **Prompt peu robuste**
- Instructions pas assez claires pour le format JSON
- Pas d'exemple concret de scores
- Pas de contrainte stricte sur le format de réponse

## Corrections implémentées

### 1. **Amélioration de la gestion d'erreurs**
```typescript
// Avant
} catch {
  return getDefaultGuidance();
}

// Après
} catch (error) {
  console.log('❌ Erreur générale dans generateGuidanceWithOpenAI:', error.message);
  return getDefaultGuidance();
}
```

### 2. **Validation des données d'entrée**
```typescript
// Vérification de la configuration
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.log('❌ OPENAI_API_KEY non configurée');
  return getDefaultGuidance();
}

// Validation des données
if (!natalChart || !transits) {
  console.log('❌ Données d\'entrée manquantes');
  return getDefaultGuidance();
}
```

### 3. **Validation et correction des réponses**
```typescript
// Validation de la structure
const requiredFields = ['summary', 'love', 'work', 'energy', 'mantra'];
const missingFields = requiredFields.filter(field => !guidance[field]);

if (missingFields.length > 0) {
  console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
  return getDefaultGuidance();
}

// Validation et correction des scores
const scoreFields = ['love', 'work', 'energy'];
const invalidScores = scoreFields.filter(field => {
  const fieldData = guidance[field];
  return !fieldData || typeof fieldData !== 'object' || 
         !fieldData.text || !fieldData.score || 
         typeof fieldData.score !== 'number' || 
         fieldData.score < 0 || fieldData.score > 100;
});

if (invalidScores.length > 0) {
  // Correction automatique des scores invalides
  scoreFields.forEach(field => {
    if (!guidance[field] || typeof guidance[field] !== 'object') {
      guidance[field] = { text: '', score: 75 };
    } else if (!guidance[field].text || !guidance[field].score) {
      guidance[field] = { 
        text: guidance[field].text || '', 
        score: guidance[field].score || 75 
      };
    }
  });
}
```

### 4. **Amélioration du prompt**
```typescript
// Instructions plus claires
IMPORTANT : Tu DOIS répondre exactement dans ce format JSON, sans texte supplémentaire :
{
  "summary": "Résumé général du jour, profond et engageant.",
  "love": { "text": "Conseil amour nuancé et imagé.", "score": 75 },
  "work": { "text": "Conseil travail inspirant et concret.", "score": 80 },
  "energy": { "text": "Conseil bien-être original et subtil.", "score": 70 },
  "mantra": "Mantra, citation ou inspiration du jour."
}
```

### 5. **Logs détaillés pour le diagnostic**
```typescript
console.log(`🔄 Génération de guidance pour ${date}...`);
console.log('📤 Envoi de la requête à OpenAI...');
console.log('✅ Réponse OpenAI reçue');
console.log('✅ Réponse JSON parsée avec succès');
console.log('✅ Guidance validée avec succès');
console.log('💾 Guidance sauvegardée en cache');
```

## Tests de diagnostic

### Script de test créé : `test-openai-guidance.mjs`
Ce script permet de :
- ✅ Vérifier la configuration OpenAI
- ✅ Tester l'API OpenAI directement
- ✅ Valider le parsing JSON
- ✅ Vérifier la structure de la guidance
- ✅ Valider les scores
- ✅ Tester le système de cache
- ✅ Afficher la guidance générée

### Points de vérification
1. **Configuration** : Clé API OpenAI présente
2. **Connectivité** : API OpenAI accessible
3. **Parsing** : Réponse JSON valide
4. **Structure** : Tous les champs requis présents
5. **Scores** : Scores numériques entre 0 et 100
6. **Cache** : Sauvegarde et récupération fonctionnelles

## Améliorations futures

### 1. **Retry automatique**
```typescript
// En cas d'échec, réessayer avec un prompt simplifié
const retryPrompt = `Génère une guidance simple au format JSON...`;
```

### 2. **Fallback intelligent**
```typescript
// Si OpenAI échoue, utiliser un modèle de fallback
if (openaiError) {
  return generateFallbackGuidance(natalChart, transits);
}
```

### 3. **Monitoring avancé**
```typescript
// Métriques de performance
const startTime = Date.now();
// ... génération ...
const duration = Date.now() - startTime;
console.log(`⏱️ Guidance générée en ${duration}ms`);
```

## Résultat attendu

✅ **Robustesse améliorée** : Gestion d'erreurs complète
✅ **Diagnostic facilité** : Logs détaillés pour identifier les problèmes
✅ **Validation renforcée** : Vérification et correction automatique des données
✅ **Cache optimisé** : Sauvegarde et récupération fiables
✅ **Prompt optimisé** : Instructions plus claires pour OpenAI

## Utilisation du script de test

```bash
# Exécuter le test de diagnostic
node test-openai-guidance.mjs
```

Le script affichera :
- ✅/❌ Statut de chaque étape
- 📝 Guidance générée pour vérification
- 🔍 Détails des erreurs éventuelles
- 💾 Statut du système de cache 