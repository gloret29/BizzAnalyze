# Guide de Développement - BizzAnalyze

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration de l'environnement](#configuration-de-lenvironnement)
4. [Structure du projet](#structure-du-projet)
5. [Installation](#installation)
6. [Développement local](#développement-local)
7. [Architecture des services](#architecture-des-services)
8. [Base de données](#base-de-données)
9. [Configuration](#configuration)
10. [Tests](#tests)
11. [Déploiement](#déploiement)
12. [Dépannage](#dépannage)

## 🎯 Vue d'ensemble

BizzAnalyze est une plateforme complète pour extraire, stocker, analyser et exporter les objets de modelPackage depuis BizzDesign via l'API v3. Le projet est organisé en monorepo utilisant Turborepo.

### Composants principaux

- **API Server** : Backend Node.js/Express pour l'extraction BizzDesign et l'exposition d'API
- **Web App** : Interface React/Next.js pour la visualisation et l'analyse
- **Graph Database** : Base de données Neo4j pour le stockage des objets et relations
- **Shared Packages** : Packages partagés (types, UI, utils)

## 🔧 Prérequis

### Logiciels requis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (ou équivalent)
- **Docker** >= 20.10 (pour Neo4j)
- **Docker Compose** >= 2.0 (optionnel, pour le développement)

### Comptes et accès

- **BizzDesign** : Compte avec accès API v3
  - URL de l'instance BizzDesign
  - Client ID et Client Secret pour OAuth2
  - ID du modelPackage à analyser

## ⚙️ Configuration de l'environnement

### 1. Cloner le dépôt

```bash
git clone https://github.com/VOTRE_USERNAME/BizzAnalyze.git
cd BizzAnalyze
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Créez les fichiers `.env` nécessaires dans chaque application :

#### `apps/server/.env`

```env
# BizzDesign API Configuration
BIZZDESIGN_API_URL=https://votre-instance.bizzdesign.com/api/v3
BIZZDESIGN_CLIENT_ID=votre_client_id
BIZZDESIGN_CLIENT_SECRET=votre_client_secret
BIZZDESIGN_MODEL_PACKAGE_ID=votre_model_package_id

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=votre_mot_de_passe

# Server Configuration
PORT=3001
NODE_ENV=development
API_KEY=votre_api_key_secrete

# JWT Configuration (si authentification)
JWT_SECRET=votre_jwt_secret
JWT_EXPIRES_IN=24h
```

#### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=BizzAnalyze
```

### 4. Démarrer Neo4j avec Docker

```bash
# Option 1 : Docker Compose (recommandé)
docker-compose up -d neo4j

# Option 2 : Docker direct
docker run \
  --name bizzanalyze-neo4j \
  -p7474:7474 -p7687:7687 \
  -e NEO4J_AUTH=neo4j/votre_mot_de_passe \
  -e NEO4J_PLUGINS='["apoc"]' \
  neo4j:latest
```

Accédez à Neo4j Browser : http://localhost:7474

## 📁 Structure du projet

```
BizzAnalyze/
├── apps/
│   ├── server/              # API Backend
│   │   ├── src/
│   │   │   ├── api/         # Routes API
│   │   │   ├── services/    # Services métier
│   │   │   │   ├── bizzdesign/  # Service BizzDesign API
│   │   │   │   └── neo4j/       # Service Neo4j
│   │   │   ├── models/      # Modèles de données
│   │   │   ├── utils/       # Utilitaires
│   │   │   └── index.ts     # Point d'entrée
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── web/                 # Application Web Frontend
│       ├── src/
│       │   ├── app/         # Pages Next.js (App Router)
│       │   ├── components/  # Composants React
│       │   ├── lib/         # Utilitaires client
│       │   └── styles/      # Styles globaux
│       ├── .env.local.example
│       └── package.json
│
├── packages/
│   ├── types/               # Types TypeScript partagés
│   │   ├── src/
│   │   │   ├── bizzdesign.ts
│   │   │   ├── neo4j.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                  # Composants UI partagés
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── database/            # Configuration et clients DB
│   │   ├── src/
│   │   │   ├── neo4j.ts
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── utils/               # Utilitaires partagés
│       ├── src/
│       └── package.json
│
├── docker-compose.yml       # Configuration Docker
├── package.json             # Configuration monorepo
├── turbo.json               # Configuration Turborepo
└── README.md
```

## 🚀 Installation

### Installation complète

```bash
# 1. Installer toutes les dépendances
npm install

# 2. Démarrer Neo4j
docker-compose up -d neo4j

# 3. Attendre que Neo4j soit prêt (environ 10 secondes)
sleep 10

# 4. Initialiser la base de données (créer les contraintes et index)
npm run db:init

# 5. Démarrer tous les services en mode développement
npm run dev
```

Les services seront disponibles sur :
- **Web App** : http://localhost:3000
- **API Server** : http://localhost:3001
- **Neo4j Browser** : http://localhost:7474

## 💻 Développement local

### Commandes principales

```bash
# Démarrer tous les services en mode développement
npm run dev

# Démarrer uniquement le serveur API
npm run dev --filter=server

# Démarrer uniquement l'application web
npm run dev --filter=web

# Build de tous les packages
npm run build

# Linter tous les packages
npm run lint

# Vérifier les types TypeScript
npm run check-types

# Exécuter les tests
npm run test
```

### Workflow de développement

1. **Créer une branche de fonctionnalité**
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```

2. **Développer et tester localement**
   ```bash
   npm run dev
   ```

3. **Vérifier le code**
   ```bash
   npm run lint
   npm run check-types
   npm run test
   ```

4. **Commit et push**
   ```bash
   git add .
   git commit -m "feat: ajout de ma fonctionnalité"
   git push origin feature/ma-fonctionnalite
   ```

## 🏗️ Architecture des services

### API Server (`apps/server`)

**Technologies** :
- Node.js + Express
- TypeScript
- Neo4j Driver
- Axios (pour BizzDesign API)

**Responsabilités** :
- Extraction des données depuis BizzDesign API v3
- Gestion de la pagination
- Stockage dans Neo4j
- Exposition d'API REST pour analyses
- Gestion de l'authentification (optionnel)

**Endpoints principaux** :
- `POST /api/sync` : Synchroniser les données depuis BizzDesign
- `GET /api/objects` : Lister les objets
- `GET /api/objects/:id` : Détails d'un objet
- `POST /api/analyze` : Déclencher une analyse
- `GET /api/export` : Exporter les données

### Web App (`apps/web`)

**Technologies** :
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS (ou équivalent)
- Recharts / D3.js (pour visualisations)
- React Flow / Cytoscape.js (pour graphes)

**Responsabilités** :
- Interface utilisateur pour visualisation
- Tableaux de bord d'analyse
- Export de données (CSV, JSON, PDF)
- Requêtes interactives sur le graphe
- Gestion des filtres et recherches

## 🗄️ Base de données

### Neo4j

**Modèle de données** :

```
(:ModelPackage)-[:CONTAINS]->(:Object)
(:Object)-[:RELATES_TO]->(:Object)
(:Object)-[:HAS_PROPERTY]->(:Property)
(:Object)-[:HAS_TAG]->(:Tag)
```

**Initialisation** :

```bash
# Créer les contraintes et index
npm run db:init

# Ou manuellement via Cypher dans Neo4j Browser
CREATE CONSTRAINT modelPackage_id IF NOT EXISTS
FOR (mp:ModelPackage) REQUIRE mp.id IS UNIQUE;

CREATE CONSTRAINT object_id IF NOT EXISTS
FOR (o:Object) REQUIRE o.id IS UNIQUE;

CREATE INDEX object_type IF NOT EXISTS
FOR (o:Object) ON (o.type);
```

**Requêtes utiles** :

```cypher
// Compter les objets
MATCH (o:Object) RETURN count(o) as total

// Lister les types d'objets
MATCH (o:Object) RETURN DISTINCT o.type as type, count(o) as count

// Trouver les relations
MATCH (a:Object)-[r:RELATES_TO]->(b:Object)
RETURN a, r, b LIMIT 50
```

## 🔐 Configuration

### Variables d'environnement critiques

| Variable | Description | Exemple |
|----------|-------------|---------|
| `BIZZDESIGN_API_URL` | URL de base de l'API BizzDesign | `https://instance.bizzdesign.com/api/v3` |
| `BIZZDESIGN_CLIENT_ID` | Client ID OAuth2 | `abc123...` |
| `BIZZDESIGN_CLIENT_SECRET` | Client Secret OAuth2 | `secret...` |
| `NEO4J_URI` | URI de connexion Neo4j | `bolt://localhost:7687` |
| `NEO4J_PASSWORD` | Mot de passe Neo4j | `password123` |

### Gestion des secrets

⚠️ **Ne jamais commiter les fichiers `.env`** dans Git.

Utilisez `.env.example` comme template et ajoutez `.env` au `.gitignore`.

## 🧪 Tests

### Structure des tests

```
apps/server/
├── src/
└── __tests__/
    ├── unit/
    ├── integration/
    └── e2e/
```

### Exécuter les tests

```bash
# Tous les tests
npm run test

# Tests d'un package spécifique
npm run test --filter=server

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

### Tests d'intégration avec Neo4j

Les tests d'intégration nécessitent une instance Neo4j. Utilisez un conteneur Docker dédié :

```bash
docker run --rm -p 7688:7687 -e NEO4J_AUTH=neo4j/test neo4j:latest
```

Puis configurez `NEO4J_URI=bolt://localhost:7688` pour les tests.

## 🚢 Déploiement

### Préparation

```bash
# Build de production
npm run build

# Tests avant déploiement
npm run test
npm run lint
npm run check-types
```

### Déploiement avec Docker

```bash
# Build des images
docker-compose build

# Démarrer tous les services
docker-compose up -d
```

### Déploiement manuel

#### API Server

```bash
cd apps/server
npm install --production
npm run build
NODE_ENV=production node dist/index.js
```

#### Web App

```bash
cd apps/web
npm install --production
npm run build
npm start
```

### Variables d'environnement en production

Configurez les variables d'environnement dans votre plateforme de déploiement (Heroku, AWS, etc.) ou via un gestionnaire de secrets.

## 🐛 Dépannage

### Problèmes courants

#### Neo4j ne démarre pas

```bash
# Vérifier les logs
docker logs bizzanalyze-neo4j

# Redémarrer
docker-compose restart neo4j
```

#### Erreur de connexion à BizzDesign API

- Vérifier les credentials dans `.env`
- Vérifier que l'URL de l'API est correcte
- Vérifier les permissions du compte BizzDesign

#### Erreurs de build TypeScript

```bash
# Nettoyer et reconstruire
npm run clean
npm install
npm run build
```

#### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001

# Tuer le processus ou changer le port dans .env
```

### Logs

```bash
# Logs du serveur API
npm run dev --filter=server 2>&1 | tee server.log

# Logs Neo4j
docker logs -f bizzanalyze-neo4j
```

## 📚 Ressources supplémentaires

- [Documentation BizzDesign API v3](https://docs.bizzdesign.com/api/v3)
- [Documentation Neo4j](https://neo4j.com/docs/)
- [Documentation Turborepo](https://turbo.build/repo/docs)
- [Documentation Next.js](https://nextjs.org/docs)

## 🤝 Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines de contribution.

## 📝 Notes de développement

### Synchronisation des données

La synchronisation depuis BizzDesign peut prendre du temps selon la taille du modelPackage. Implémentez :
- Un système de queue (Bull/BullMQ)
- Des webhooks pour les mises à jour incrémentales
- Un cache pour éviter les requêtes répétées

### Performance

- Utilisez des transactions batch pour Neo4j
- Implémentez la pagination côté API
- Mettez en cache les résultats d'analyses fréquentes
- Utilisez des index appropriés dans Neo4j

