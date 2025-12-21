# Fonctionnalités restantes à implémenter

Ce document liste les fonctionnalités mentionnées mais pas encore implémentées dans BizzAnalyze.

## 🔴 Priorité Haute

### 1. API BizzDesign - Récupération des relations d'un objet
**Fichier** : `apps/server/src/services/bizzdesign/client.ts:483`
```typescript
/**
 * Récupère les relations d'un objet spécifique
 * TODO: Implémenter selon le swagger de l'API BizzDesign v3
 */
async getObjectRelationships(repositoryId: number, objectId: string): Promise<Relationship[]>
```
**Statut** : Non implémenté (retourne un tableau vide)

---

## 🟠 Priorité Moyenne

### 2. Export PDF
**Fichier** : `apps/server/src/api/routes/export.ts`
**Types** : `packages/types/src/api.ts:49` définit `format: 'csv' | 'json' | 'excel' | 'pdf' | 'graphml'`
**Statut** : Mentionné dans les types mais pas implémenté dans le switch case

**Implémentation nécessaire** :
- Utiliser une bibliothèque comme `pdfkit` ou `jspdf`
- Générer un PDF avec les objets et relations
- Mettre en forme avec tableaux et graphiques

### 3. Export Excel réel
**Fichier** : `apps/server/src/api/routes/export.ts:158`
**Statut** : Actuellement un fallback vers CSV

**Implémentation nécessaire** :
```typescript
// Installer la bibliothèque xlsx
npm install xlsx @types/xlsx

// Implémenter la fonction exportExcel avec des feuilles séparées pour :
// - Objects
// - Relationships
// - Métadonnées (date d'export, repository, etc.)
```

### 4. Export GraphML
**Fichier** : `apps/server/src/api/routes/export.ts`
**Types** : `packages/types/src/api.ts:49` inclut `'graphml'`
**Statut** : Mentionné dans les types mais pas implémenté

**Implémentation nécessaire** :
- Format GraphML pour import dans des outils comme yEd, Gephi
- Structure XML avec nœuds et arêtes

### 5. Analyses de communautés
**Fichier** : `packages/types/src/api.ts:35` définit `type: 'centrality' | 'communities' | 'paths' | 'cycles' | 'dependencies'`
**Mentionné dans** : README.md ligne 39 et page d'accueil
**Statut** : Type défini mais pas d'implémentation

**Implémentation nécessaire** :
- Créer `apps/server/src/services/analysis/communities.ts`
- Implémenter algorithme de détection de communautés (Louvain, Label Propagation)
- Ajouter route dans `apps/server/src/api/routes/analyze.ts`

---

## 🟡 Priorité Basse / Optimisations

### 6. Neo4j GDS (Graph Data Science)
**Fichier** : `apps/server/src/services/analysis/centrality.ts:45`
**Statut** : Commentaire indique que GDS serait idéal mais utilise un algorithme simplifié

**Implémentation nécessaire** :
- Installer le plugin Neo4j GDS dans docker-compose
- Réécrire les analyses de centralité pour utiliser GDS
- Améliorer les performances et la précision

### 7. Analyses de cycles
**Fichier** : `packages/types/src/api.ts:35` inclut `'cycles'` dans AnalysisRequest
**Statut** : Type défini mais pas d'implémentation

**Implémentation nécessaire** :
- Détecter les cycles dans le graphe
- Identifier les dépendances circulaires
- Utiliser des algorithmes comme DFS pour détecter les cycles

### 8. Analyses de dépendances
**Fichier** : `packages/types/src/api.ts:35` inclut `'dependencies'` dans AnalysisRequest
**Statut** : Type défini mais pas d'implémentation

**Implémentation nécessaire** :
- Analyser les chaînes de dépendances
- Détecter les dépendances critiques
- Calculer les niveaux de dépendance

---

## 📚 Documentation manquante

Les fichiers suivants sont mentionnés dans `README.md` mais n'existent pas :

- `QUICKSTART.md` - Guide de démarrage rapide (5 minutes)
- `DEV_GUIDE.md` - Guide complet pour les développeurs
- `IMPLEMENTATION.md` - Guide d'implémentation avec architecture détaillée
- `FEATURES_PROPOSAL.md` - Propositions de fonctionnalités détaillées avec priorités
- `IMPLEMENTATION_STATUS.md` - État actuel de l'implémentation

---

## 🧪 Tests

**Statut** : Aucun fichier de test trouvé
**Script** : `npm run test` existe dans package.json mais pas de tests implémentés

**Implémentation nécessaire** :
- Tests unitaires pour les services
- Tests d'intégration pour les routes API
- Tests E2E pour le frontend
- Configuration Jest/Vitest

---

## 🔧 Améliorations techniques

### 9. PageRank amélioré
**Fichier** : `apps/server/src/services/analysis/centrality.ts:44`
**Statut** : Utilise un algorithme simplifié

**Optimisation** :
- Implémenter le vrai algorithme PageRank itératif
- Ou utiliser Neo4j GDS pour de meilleures performances

### 10. Gestion des erreurs
**Statut** : À améliorer
- Ajouter plus de gestion d'erreurs spécifiques
- Logging structuré (Winston, Pino)
- Monitoring et alerting

### 11. Authentification/Autorisation
**Statut** : Pas d'authentification implémentée
- API publique sans authentification
- Ajouter JWT ou OAuth2
- Gestion des rôles et permissions

### 12. Cache
**Statut** : Pas de système de cache
- Cache Redis pour les requêtes fréquentes
- Cache des résultats d'analyse
- Cache des exports

---

## 📊 Résumé par priorité

| Priorité | Nombre | Fonctionnalités |
|----------|--------|-----------------|
| 🔴 Haute | 1 | Relations d'objet BizzDesign |
| 🟠 Moyenne | 4 | Export PDF/Excel/GraphML, Communautés |
| 🟡 Basse | 5 | Cycles, Dépendances, Optimisations |
| 📚 Docs | 5 | Documentation manquante |
| 🧪 Tests | 1 | Suite de tests complète |
| 🔧 Tech | 4 | Auth, Cache, Monitoring, etc. |

**Total** : ~20 fonctionnalités/améliorations à implémenter

---

## 🎯 Recommandations

1. **Commencer par** : Relations d'objet BizzDesign (priorité haute, bloque certaines fonctionnalités)
2. **Puis** : Exports PDF/Excel (demande fréquente des utilisateurs)
3. **Ensuite** : Tests et documentation (fondation pour le développement futur)
4. **Enfin** : Optimisations et fonctionnalités avancées










