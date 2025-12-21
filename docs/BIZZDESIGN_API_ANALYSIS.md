# Analyse de l'API BizzDesign v3.0 - Recommandations

## Fichier Swagger analysé
- **Source** : https://downloads.bizzdesign.com/Support/api/3.0/Bizzdesign_Open_API_documentation_v3.0.yaml
- **Version** : 3.0.0
- **Date d'analyse** : 2024

## Vue d'ensemble de l'API

L'API BizzDesign v3.0 permet de :
1. **Enrichir les architectures** avec des data blocks (attributs supplémentaires)
2. **Automatiser l'architecture** en ajoutant des collections, entités et liens
3. **Gérer les politiques de données** (editors, readers, schedules)
4. **Consulter les logs d'audit** (nécessite permissions admin)

## État actuel de l'implémentation

### ✅ Déjà implémenté
- Récupération des repositories
- Récupération des objets (avec pagination)
- Récupération des relations
- Stockage dans Neo4j
- Les objets incluent déjà le champ `documents` (data blocks) dans la réponse

### ❌ Non implémenté
- Récupération explicite des data blocks
- Récupération des data block definitions
- Récupération des métriques (metrics)
- Récupération des profils (profiles)
- Récupération des external IDs
- Gestion des collections, containers, entities, links
- Audit events

## Recommandations : Informations à récupérer

### 1. Data Blocks (Priorité HAUTE) ⭐⭐⭐

Les **data blocks** sont des attributs supplémentaires attachés aux objets qui enrichissent les données. Ils sont actuellement inclus dans les objets via le champ `documents`, mais peuvent être récupérés séparément.

#### Endpoints recommandés :

**a) Récupérer tous les data blocks d'un objet**
```
GET /repositories/{repositoryId}/objects/{objectId}/datablocks
```
- **Utilité** : Obtenir tous les data blocks attachés à un objet spécifique
- **Retourne** : Liste de data blocks avec leurs valeurs et métadonnées
- **Cas d'usage** : Affichage détaillé d'un objet, export enrichi

**b) Récupérer un data block spécifique**
```
GET /repositories/{repositoryId}/objects/{objectId}/datablocks/{namespace}/{name}
```
- **Utilité** : Récupérer un data block particulier (ex: "applicationinfo")
- **Retourne** : Un data block avec ses valeurs conformes à la dernière version de la définition
- **Cas d'usage** : Filtrage par type de data block, affichage conditionnel

**c) Récupérer les data blocks des entités**
```
GET /repositories/{repositoryId}/entities/{entityId}/datablocks/{namespace}/{name}
```
- **Utilité** : Pour les entités gérées en dehors d'Enterprise Studio
- **Note** : Utilise external ID ou internal ID

#### Structure d'un Data Block :
```typescript
interface DataBlock {
  objectId: string;
  schemaNamespace: string;  // ex: "default"
  schemaName: string;        // ex: "applicationinfo"
  values: Record<string, any>; // Valeurs des attributs
  updatedAt: string;
}
```

#### Exemple de valeurs :
```json
{
  "usercount": 1337,
  "totalcost": {
    "currency": "EUR",
    "amount": 4711
  }
}
```

### 2. Data Block Definitions (Priorité MOYENNE) ⭐⭐

Les **data block definitions** décrivent la structure des data blocks (schéma, champs, types).

#### Endpoints recommandés :

**a) Récupérer toutes les définitions**
```
GET /repositories/{repositoryId}/schemas
```
- **Utilité** : Connaître tous les types de data blocks disponibles
- **Retourne** : Liste paginée des définitions avec leurs champs et contraintes
- **Cas d'usage** : Génération de formulaires dynamiques, validation

**b) Récupérer une définition spécifique**
```
GET /repositories/{repositoryId}/schemas/{namespace}/{name}
```
- **Utilité** : Obtenir le schéma complet d'un type de data block
- **Retourne** : Définition avec fields, schemas, types applicables

#### Structure d'une Data Block Definition :
```typescript
interface DataBlockDefinition {
  namespace: string;
  name: string;
  label: string;
  fields: Field[];
  schemas: SchemaDefinition[]; // Enum, Reference, List
  types: string[]; // Types d'objets applicables
  createdAt: string;
  updatedAt: string;
}

interface Field {
  name: string;
  schema: string; // "string", "number", "money", etc.
  label: string;
  constraints?: {
    currency?: string;
    // autres contraintes
  };
}
```

### 3. Métriques (Priorité MOYENNE) ⭐⭐

Les **métriques** sont des valeurs calculées ou mesurées attachées aux objets.

#### Endpoint recommandé :
```
GET /repositories/{repositoryId}/objects?includeMetrics=true
```
- **Utilité** : Obtenir les valeurs de métriques pour les objets
- **Note** : Uniquement pour les objets gérés dans Enterprise Studio
- **Cas d'usage** : Tableaux de bord, analyses quantitatives

### 4. Profils (Priorité MOYENNE) ⭐⭐

Les **profils** contiennent des attributs de profil spécifiques.

#### Endpoint recommandé :
```
GET /repositories/{repositoryId}/objects?includeProfiles=true
```
- **Utilité** : Obtenir les valeurs de profil pour les objets
- **Note** : Uniquement pour les objets gérés dans Enterprise Studio
- **Cas d'usage** : Affichage enrichi, filtres avancés

### 5. External IDs (Priorité BASSE) ⭐

Les **external IDs** permettent d'identifier les entités avec des IDs externes.

#### Endpoint recommandé :
```
GET /repositories/{repositoryId}/objects?includeExternalIds=true
```
- **Utilité** : Obtenir les IDs externes pour faciliter l'intégration
- **Note** : Uniquement pour les entités (pas tous les objets)
- **Cas d'usage** : Synchronisation avec systèmes externes

### 6. Collections, Containers, Entities, Links (Priorité BASSE) ⭐

Pour les objets gérés en dehors d'Enterprise Studio.

#### Endpoints recommandés :
- `GET /repositories/{repositoryId}/collections` - Liste des collections
- `GET /repositories/{repositoryId}/collections/{collectionId}/entities` - Entités d'une collection
- `GET /repositories/{repositoryId}/collections/{collectionId}/links` - Liens d'une collection

**Cas d'usage** : Architecture hybride, intégration de données externes

### 7. Audit Events (Priorité BASSE) ⭐

Les **audit events** permettent de suivre les événements importants.

#### Endpoint recommandé :
```
GET /auditevents?since={date}&until={date}
```
- **Utilité** : Traçabilité, conformité, debugging
- **Note** : Nécessite permissions admin
- **Cas d'usage** : Logs d'activité, audit de sécurité

## Plan d'implémentation recommandé

### Phase 1 : Data Blocks (Essentiel)
1. ✅ Les data blocks sont déjà inclus dans les objets via `documents`
2. 🔄 **À faire** : Extraire et stocker les data blocks séparément dans Neo4j
3. 🔄 **À faire** : Créer des nœuds DataBlock dans Neo4j avec relations vers les objets
4. 🔄 **À faire** : Exposer les data blocks dans l'API REST

### Phase 2 : Data Block Definitions (Important)
1. 🔄 **À faire** : Récupérer les définitions de data blocks
2. 🔄 **À faire** : Stocker les définitions pour référence
3. 🔄 **À faire** : Utiliser les définitions pour valider/afficher les data blocks

### Phase 3 : Métriques et Profils (Enrichissement)
1. 🔄 **À faire** : Récupérer les métriques avec `includeMetrics=true`
2. 🔄 **À faire** : Récupérer les profils avec `includeProfiles=true`
3. 🔄 **À faire** : Stocker dans Neo4j comme propriétés des objets

### Phase 4 : External IDs (Intégration)
1. 🔄 **À faire** : Récupérer les external IDs avec `includeExternalIds=true`
2. 🔄 **À faire** : Utiliser pour améliorer les recherches et intégrations

## Structure Neo4j recommandée pour les Data Blocks

### Option 1 : Nœuds séparés (Recommandé)
```
(Object)-[:HAS_DATABLOCK]->(DataBlock)
(DataBlock)-[:CONFORMS_TO]->(DataBlockDefinition)
```

**Avantages** :
- Recherche efficace des objets par type de data block
- Requêtes Cypher simples pour filtrer par valeurs
- Facilite les mises à jour

**Structure du nœud DataBlock** :
```cypher
CREATE (db:DataBlock {
  id: "objectId:namespace:name",
  objectId: "...",
  namespace: "default",
  name: "applicationinfo",
  values: {...},
  updatedAt: "..."
})
```

### Option 2 : Propriétés sur les objets
Stocker les data blocks comme propriétés JSON sur les objets.

**Avantages** :
- Plus simple
- Moins de relations

**Inconvénients** :
- Recherche moins efficace
- Difficile de filtrer par valeurs de data block

## Exemples de requêtes Cypher utiles

### Trouver tous les objets avec un data block spécifique
```cypher
MATCH (o:Object)-[:HAS_DATABLOCK]->(db:DataBlock)
WHERE db.namespace = 'default' AND db.name = 'applicationinfo'
RETURN o, db
```

### Filtrer par valeur dans un data block
```cypher
MATCH (o:Object)-[:HAS_DATABLOCK]->(db:DataBlock)
WHERE db.namespace = 'default' 
  AND db.name = 'applicationinfo'
  AND db.values.usercount > 1000
RETURN o, db.values.usercount
```

### Compter les data blocks par type
```cypher
MATCH (db:DataBlock)
RETURN db.namespace, db.name, count(db) as count
ORDER BY count DESC
```

## Endpoints API à ajouter

### Backend (Express)
```typescript
// GET /api/datablocks?objectId=...
// GET /api/datablocks/definitions
// GET /api/datablocks/definitions/:namespace/:name
// GET /api/objects/:id/datablocks
```

### Frontend
- Page dédiée aux data blocks
- Filtres par namespace/name
- Affichage des valeurs structurées
- Recherche dans les valeurs

## Notes importantes

1. **Rate Limiting** : L'API peut retourner 429 (Too Many Requests)
2. **Pagination** : Utiliser offset/limit (max 20000 pour objects, 10000 pour audit)
3. **updatedAtAggregated** : Timestamp le plus récent entre l'objet et ses data blocks
4. **External IDs** : Peuvent être utilisés à la place des internal IDs pour les entités/liens
5. **Collections** : Limite de 5000 objets par container, 500 liens par entité

## Prochaines étapes

1. ✅ Analyser le Swagger (fait)
2. 🔄 Implémenter la récupération des data blocks
3. 🔄 Implémenter la récupération des data block definitions
4. 🔄 Adapter le stockage Neo4j pour les data blocks
5. 🔄 Créer les endpoints API REST
6. 🔄 Créer l'interface utilisateur pour visualiser les data blocks




