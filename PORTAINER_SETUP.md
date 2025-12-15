# Guide d'installation BizzAnalyze dans Portainer.io

Ce guide vous explique comment déployer BizzAnalyze dans Portainer.io.

## Prérequis

- Portainer.io installé et fonctionnel
- Accès à un environnement Docker
- Au moins 4GB de RAM disponible
- 10GB d'espace disque libre

## Installation

### 1. Préparer les fichiers

1. Téléchargez ou clonez ce repository
2. Créez un fichier `.env` à partir de `env.portainer.example` :
   ```bash
   cp env.portainer.example .env
   ```
3. Modifiez le fichier `.env` avec vos configurations :
   - **NEO4J_PASSWORD** : Mot de passe pour Neo4j (changez le mot de passe par défaut)
   - **BIZZDESIGN_*** : Vos identifiants API BizzDesign

### 2. Déployer dans Portainer.io

#### Option A : Via l'interface Portainer (Stack)

1. Connectez-vous à Portainer.io
2. Allez dans **Stacks** > **Add stack**
3. Donnez un nom à votre stack : `bizzanalyze`
4. Choisissez **Web editor** ou **Upload**
5. Si vous utilisez **Web editor**, copiez le contenu de `docker-compose.portainer.yml`
6. Si vous utilisez **Upload**, sélectionnez le fichier `docker-compose.portainer.yml`
7. Dans la section **Environment variables**, ajoutez les variables de votre fichier `.env`
8. Cliquez sur **Deploy the stack**

#### Option B : Via Git Repository

1. Dans Portainer, allez dans **Stacks** > **Add stack**
2. Sélectionnez **Repository**
3. Remplissez :
   - **Repository URL** : URL de votre repository Git
   - **Compose path** : `docker-compose.portainer.yml`
   - **Reference** : `main` ou `master`
4. Ajoutez les variables d'environnement
5. Cliquez sur **Deploy the stack**

### 3. Vérifier le déploiement

Une fois le déploiement terminé, vérifiez que tous les services sont en cours d'exécution :

1. Allez dans **Stacks** > **bizzanalyze**
2. Vérifiez que les 3 services sont **Running** :
   - `bizzanalyze-neo4j`
   - `bizzanalyze-server`
   - `bizzanalyze-web`

### 4. Accéder à l'application

- **Application Web** : http://votre-serveur:3000
- **API Backend** : http://votre-serveur:3001
- **Neo4j Browser** : http://votre-serveur:7474
- **Avec Nginx** (si activé) : http://votre-serveur

## Configuration Nginx (Optionnel)

Pour utiliser Nginx comme reverse proxy :

1. Déployez la stack avec le profil nginx :
   ```bash
   docker-compose --profile nginx -f docker-compose.portainer.yml up -d
   ```

2. Ou dans Portainer, modifiez la stack et ajoutez dans les variables d'environnement :
   ```
   COMPOSE_PROFILES=nginx
   ```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NEO4J_USER` | Utilisateur Neo4j | `neo4j` |
| `NEO4J_PASSWORD` | Mot de passe Neo4j | `bizzanalyze` |
| `NEO4J_DATABASE` | Base de données Neo4j | `neo4j` |
| `BIZZDESIGN_API_URL` | URL de l'API BizzDesign | - |
| `BIZZDESIGN_CLIENT_ID` | Client ID BizzDesign | - |
| `BIZZDESIGN_CLIENT_SECRET` | Client Secret BizzDesign | - |
| `BIZZDESIGN_REPOSITORY_ID` | ID du repository | - |

## Maintenance

### Voir les logs

Dans Portainer, allez dans **Containers** et cliquez sur un conteneur pour voir ses logs.

### Redémarrer un service

Dans **Stacks** > **bizzanalyze**, cliquez sur le service et sélectionnez **Restart**.

### Sauvegarder Neo4j

Les données Neo4j sont stockées dans le volume `neo4j_data`. Pour sauvegarder :

```bash
docker run --rm -v bizzanalyze_neo4j_data:/data -v $(pwd):/backup alpine tar czf /backup/neo4j-backup.tar.gz /data
```

### Mettre à jour l'application

1. Dans Portainer, allez dans **Stacks** > **bizzanalyze**
2. Cliquez sur **Editor**
3. Modifiez le fichier docker-compose si nécessaire
4. Cliquez sur **Update the stack**

## Dépannage

### Les services ne démarrent pas

1. Vérifiez les logs dans Portainer
2. Vérifiez que les ports ne sont pas déjà utilisés
3. Vérifiez que vous avez assez de ressources (RAM, disque)

### Erreur de connexion à Neo4j

1. Vérifiez que le service `neo4j` est en cours d'exécution
2. Vérifiez les variables d'environnement `NEO4J_*`
3. Attendez que le healthcheck de Neo4j soit vert

### L'application web ne se charge pas

1. Vérifiez que le service `web` est en cours d'exécution
2. Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers le bon serveur
3. Vérifiez les logs du conteneur `web`

## Support

Pour plus d'informations, consultez le README.md principal du projet.

