# Guide de déploiement rapide dans Portainer

## Méthode 1 : Script PowerShell (Recommandé)

### Prérequis
- PowerShell installé
- Token API Portainer (Settings > Users > votre utilisateur > Access tokens)

### Déploiement

```powershell
.\deploy-portainer.ps1 `
  -PortainerUrl "https://192.168.1.115:9443" `
  -ApiToken "VOTRE_TOKEN_API" `
  -ServerIp "192.168.1.115"
```

### Options supplémentaires

```powershell
.\deploy-portainer.ps1 `
  -PortainerUrl "https://192.168.1.115:9443" `
  -ApiToken "VOTRE_TOKEN_API" `
  -ServerIp "192.168.1.115" `
  -Neo4jPassword "mon_mot_de_passe" `
  -EndpointId "3"
```

## Méthode 2 : Interface Portainer

### Via l'interface web

1. Connectez-vous à Portainer
2. Allez dans **Stacks** > **Add stack**
3. Donnez un nom : `BizzAnalyze`
4. Sélectionnez **Repository**
5. Remplissez :
   - **Repository URL** : `https://github.com/gloret29/BizzAnalyze.git`
   - **Compose path** : `docker-compose.portainer.yml`
   - **Reference** : `refs/heads/master`
6. Ajoutez les variables d'environnement :
   ```
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=bizzanalyze
   NEO4J_DATABASE=neo4j
   NEXT_PUBLIC_API_URL=http://192.168.1.115:3001
   ```
7. Cliquez sur **Deploy the stack**

### Via Web Editor

1. Connectez-vous à Portainer
2. Allez dans **Stacks** > **Add stack**
3. Donnez un nom : `BizzAnalyze`
4. Sélectionnez **Web editor**
5. Copiez le contenu de `docker-compose.portainer.yml`
6. Ajoutez les variables d'environnement (voir ci-dessus)
7. Cliquez sur **Deploy the stack**

## Vérification du déploiement

Une fois déployé, vérifiez que les 3 services sont en cours d'exécution :

- `bizzanalyze-neo4j` - Base de données (healthcheck: healthy)
- `bizzanalyze-server` - API Backend (healthcheck: healthy)
- `bizzanalyze-web` - Application Next.js

## URLs d'accès

- **Application Web** : http://192.168.1.115:3002
- **API Backend** : http://192.168.1.115:3001
- **Neo4j Browser** : http://192.168.1.115:7474

## Mise à jour

Pour mettre à jour l'application après un push Git :

1. Dans Portainer, allez dans **Stacks** > **BizzAnalyze**
2. Cliquez sur **Pull and redeploy**

Ou utilisez le script PowerShell qui supprimera et recréera la stack automatiquement.

## Variables d'environnement BizzDesign (optionnel)

Si vous avez des identifiants BizzDesign, ajoutez-les dans Portainer :

1. **Stacks** > **BizzAnalyze** > **Editor**
2. Ajoutez dans la section `environment` du service `server` :
   ```yaml
   - BIZZDESIGN_API_URL=https://arkea.horizzon.cloud/api/3.0
   - BIZZDESIGN_CLIENT_ID=votre_client_id
   - BIZZDESIGN_CLIENT_SECRET=votre_client_secret
   - BIZZDESIGN_REPOSITORY_ID=votre_repository_id
   ```
3. Cliquez sur **Update the stack**

## Dépannage

### Les services ne démarrent pas
- Vérifiez les logs dans Portainer > Containers
- Vérifiez que les ports 3001, 3002, 7474, 7687 ne sont pas utilisés
- Vérifiez que vous avez assez de RAM (minimum 4GB)

### Erreur de connexion à Neo4j
- Attendez que le healthcheck de Neo4j soit vert (30-60 secondes)
- Vérifiez les variables d'environnement NEO4J_*

### Erreur "Network Error" dans l'interface
- Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers la bonne IP
- Testez l'API : http://192.168.1.115:3001/health

Pour plus de détails, consultez `PORTAINER_SETUP.md`.






