# BizzAnalyze

Plateforme d'analyse et de modélisation d'architecture d'entreprise.

## 🚀 Vue d'ensemble

BizzAnalyze est une plateforme moderne pour l'analyse et la modélisation d'architecture d'entreprise, conçue pour faciliter la compréhension, la documentation et l'optimisation des architectures organisationnelles.

Le projet permet de :
- **Extraire** les objets d'un modelPackage depuis BizzDesign via l'API v3 (avec gestion de la pagination)
- **Stocker** les objets et leurs relations dans une base de données graph (Neo4j)
- **Analyser** les données via une interface web interactive
- **Exporter** les données dans différents formats (CSV, JSON, Excel, PDF)
- **Exposer** une API pour déclencher des analyses complexes

## 📋 Prérequis

- Node.js >= 18
- npm >= 9

## 🛠️ Installation

```bash
npm install
```

## 🏃 Développement

```bash
# Démarrer tous les services en mode développement
npm run dev

# Lancer le build
npm run build

# Lancer les tests
npm run test

# Vérifier les types
npm run check-types

# Linter le code
npm run lint
```

## 📁 Structure du Projet

```
BizzAnalyze/
├── apps/
│   ├── web/          # Application web frontend
│   └── server/       # API backend
├── packages/
│   ├── ui/           # Composants UI partagés
│   ├── types/        # Types TypeScript partagés
│   └── database/     # Configuration base de données
└── package.json      # Configuration monorepo
```

## 🏗️ Architecture

Ce projet utilise un monorepo basé sur [Turborepo](https://turbo.build/repo) pour gérer plusieurs applications et packages dans un seul dépôt.

### Composants principaux

- **API Server** : Backend Node.js/Express pour l'extraction BizzDesign et l'exposition d'API
- **Web App** : Interface React/Next.js pour la visualisation et l'analyse
- **Graph Database** : Base de données Neo4j pour le stockage des objets et relations
- **Shared Packages** : Packages partagés (types, UI, utils)

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** : Guide de démarrage rapide (5 minutes)
- **[DEV_GUIDE.md](./DEV_GUIDE.md)** : Guide complet pour les développeurs (installation, configuration, développement)
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** : Guide d'implémentation avec architecture détaillée et choix techniques
- **[FEATURES_PROPOSAL.md](./FEATURES_PROPOSAL.md)** : Propositions de fonctionnalités détaillées avec priorités
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** : État actuel de l'implémentation

## 📝 Licence

[À définir]

## 👥 Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou une pull request.

