# Guide d'installation BizzAnalyze dans Portainer.io

Ce guide vous explique comment déployer BizzAnalyze dans Portainer.io.

## Configuration actuelle (192.168.1.115)

### Services déployés

| Service | Container | Port | État |
|---------|-----------|------|------|
| Neo4j | bizzanalyze-neo4j | 7474 (HTTP), 7687 (Bolt) | ✅ Healthy |
| API Backend | bizzanalyze-server | 3001 | ✅ Healthy |
| Application Web | bizzanalyze-web | 3002 | ✅ Running |

### URLs d'accès

- **Application Web** : http://192.168.1.115:3002
- **API Backend** : http://192.168.1.115:3001
- **API Health** : http://192.168.1.115:3001/health
- **Neo4j Browser** : http://192.168.1.115:7474

### Identifiants Neo4j

- **Utilisateur** : neo4j
- **Mot de passe** : bizzanalyze

---

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
3. Donnez un nom à votre stack : `BizzAnalyze`
4. Choisissez **Web editor** ou **Upload**
5. Si vous utilisez **Web editor**, copiez le contenu de `docker-compose.portainer.yml`
6. Si vous utilisez **Upload**, sélectionnez le fichier `docker-compose.portainer.yml`
7. Dans la section **Environment variables**, ajoutez les variables :
   ```
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=bizzanalyze
   NEO4J_DATABASE=neo4j
   NEXT_PUBLIC_API_URL=http://VOTRE_IP:3001
   ```
8. Cliquez sur **Deploy the stack**

#### Option B : Via Git Repository

1. Dans Portainer, allez dans **Stacks** > **Add stack**
2. Sélectionnez **Repository**
3. Remplissez :
   - **Repository URL** : `https://github.com/gloret29/BizzAnalyze.git`
   - **Compose path** : `docker-compose.portainer.yml`
   - **Reference** : `refs/heads/master`
4. Ajoutez les variables d'environnement :
   ```
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=bizzanalyze
   NEO4J_DATABASE=neo4j
   NEXT_PUBLIC_API_URL=http://VOTRE_IP:3001
   ```
5. Cliquez sur **Deploy the stack**

#### Option C : Via l'API Portainer (PowerShell)

```powershell
# Configuration
$portainerUrl = "https://192.168.1.115:9443"
$apiToken = "VOTRE_TOKEN_API"
$serverIp = "192.168.1.115"

# Désactiver la vérification SSL (pour certificats auto-signés)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
add-type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint srvPoint, X509Certificate certificate, WebRequest request, int certificateProblem) { return true; }
}
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

$headers = @{ 
    "X-API-Key" = $apiToken
    "Content-Type" = "application/json"
}

$body = @{
    name = "BizzAnalyze"
    repositoryURL = "https://github.com/gloret29/BizzAnalyze.git"
    repositoryReferenceName = "refs/heads/master"
    composeFile = "docker-compose.portainer.yml"
    env = @(
        @{ name = "NEO4J_USER"; value = "neo4j" }
        @{ name = "NEO4J_PASSWORD"; value = "bizzanalyze" }
        @{ name = "NEO4J_DATABASE"; value = "neo4j" }
        @{ name = "NEXT_PUBLIC_API_URL"; value = "http://${serverIp}:3001" }
    )
} | ConvertTo-Json -Depth 5

# Déployer (endpointId=3 pour l'environnement local)
Invoke-RestMethod -Uri "$portainerUrl/api/stacks/create/standalone/repository?endpointId=3" -Method POST -Headers $headers -Body $body
```

### 3. Vérifier le déploiement

Une fois le déploiement terminé, vérifiez que tous les services sont en cours d'exécution :

1. Allez dans **Stacks** > **BizzAnalyze**
2. Vérifiez que les **3 services** sont **Running** :
   - `bizzanalyze-neo4j` - Base de données (healthcheck: healthy)
   - `bizzanalyze-server` - API Backend (healthcheck: healthy)
   - `bizzanalyze-web` - Application Next.js

### 4. Accéder à l'application

- **Application Web** : http://VOTRE_IP:3002
- **API Backend** : http://VOTRE_IP:3001
- **Neo4j Browser** : http://VOTRE_IP:7474

> **Note** : Les ports ont été modifiés pour éviter les conflits avec d'autres services (homepage sur 3000, SWAG sur 80/443).

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NEO4J_USER` | Utilisateur Neo4j | `neo4j` |
| `NEO4J_PASSWORD` | Mot de passe Neo4j | `bizzanalyze` |
| `NEO4J_DATABASE` | Base de données Neo4j | `neo4j` |
| `NEXT_PUBLIC_API_URL` | URL de l'API (pour le build) | `http://192.168.1.115:3001` |
| `BIZZDESIGN_API_URL` | URL de l'API BizzDesign | - |
| `BIZZDESIGN_CLIENT_ID` | Client ID BizzDesign | - |
| `BIZZDESIGN_CLIENT_SECRET` | Client Secret BizzDesign | - |
| `BIZZDESIGN_REPOSITORY_ID` | ID du repository | - |

## Architecture des ports

```
┌─────────────────────────────────────────────────────────────┐
│                    Serveur 192.168.1.115                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  SWAG (existant)│  │   Homepage      │                  │
│  │  Port 80, 443   │  │   Port 3000     │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Stack BizzAnalyze                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │   Neo4j     │ │   Server    │ │    Web      │    │   │
│  │  │ 7474, 7687  │ │    3001     │ │    3002     │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  │         ↑               ↑               ↑           │   │
│  │         └───────────────┴───────────────┘           │   │
│  │              bizzanalyze-network                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Configuration SWAG (optionnel)

Si vous souhaitez accéder à BizzAnalyze via SWAG avec un nom de domaine, créez un fichier de configuration proxy :

```nginx
# /config/nginx/proxy-confs/bizzanalyze.subdomain.conf

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name bizzanalyze.*;

    include /config/nginx/ssl.conf;
    client_max_body_size 0;

    location / {
        include /config/nginx/proxy.conf;
        include /config/nginx/resolver.conf;
        set $upstream_app bizzanalyze-web;
        set $upstream_port 3000;
        set $upstream_proto http;
        proxy_pass $upstream_proto://$upstream_app:$upstream_port;
    }

    location /api {
        include /config/nginx/proxy.conf;
        include /config/nginx/resolver.conf;
        set $upstream_app bizzanalyze-server;
        set $upstream_port 3001;
        set $upstream_proto http;
        proxy_pass $upstream_proto://$upstream_app:$upstream_port;
    }
}
```

## Maintenance

### Voir les logs

Dans Portainer, allez dans **Containers** et cliquez sur un conteneur pour voir ses logs.

### Redémarrer un service

Dans **Stacks** > **BizzAnalyze**, cliquez sur le service et sélectionnez **Restart**.

### Sauvegarder Neo4j

Les données Neo4j sont stockées dans le volume `neo4j_data`. Pour sauvegarder :

```bash
docker run --rm -v bizzanalyze_neo4j_data:/data -v $(pwd):/backup alpine tar czf /backup/neo4j-backup.tar.gz /data
```

### Mettre à jour l'application

1. Dans Portainer, allez dans **Stacks** > **BizzAnalyze**
2. Cliquez sur **Pull and redeploy** (si Git Repository)
3. Ou cliquez sur **Editor** pour modifier manuellement

### Supprimer et recréer la stack

Via PowerShell :

```powershell
# Supprimer la stack existante
$stacks = Invoke-RestMethod -Uri "$portainerUrl/api/stacks" -Headers $headers
$bizzStack = $stacks | Where-Object { $_.Name -eq "BizzAnalyze" }
if ($bizzStack) {
    Invoke-RestMethod -Uri "$portainerUrl/api/stacks/$($bizzStack.Id)?endpointId=3" -Method DELETE -Headers $headers
}

# Nettoyer le réseau orphelin
$networks = Invoke-RestMethod -Uri "$portainerUrl/api/endpoints/3/docker/networks" -Headers $headers
$networks | Where-Object { $_.Name -match "bizzanalyze" } | ForEach-Object {
    Invoke-RestMethod -Uri "$portainerUrl/api/endpoints/3/docker/networks/$($_.Id)" -Method DELETE -Headers $headers
}
```

## Dépannage

### Erreur "port is already allocated"

Les ports sont en conflit avec d'autres services. Vérifiez les ports utilisés :

```powershell
$containers = Invoke-RestMethod -Uri "$portainerUrl/api/endpoints/3/docker/containers/json" -Headers $headers
$containers | ForEach-Object {
    $_.Ports | Where-Object { $_.PublicPort } | ForEach-Object {
        Write-Host "Port $($_.PublicPort): $($containers.Names[0])"
    }
}
```

### Erreur "Network Error" dans l'interface

Le frontend ne peut pas communiquer avec le backend :

1. Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers la bonne IP
2. Testez l'API : `http://VOTRE_IP:3001/health`
3. Vérifiez les logs du serveur

### Les services ne démarrent pas

1. Vérifiez les logs dans Portainer
2. Vérifiez que les ports ne sont pas déjà utilisés
3. Vérifiez que vous avez assez de ressources (RAM, disque)

### Erreur de connexion à Neo4j

1. Vérifiez que le service `neo4j` est en cours d'exécution
2. Vérifiez les variables d'environnement `NEO4J_*`
3. Attendez que le healthcheck de Neo4j soit vert (peut prendre 30-60 secondes)

## Informations API Portainer

- **URL** : https://192.168.1.115:9443
- **Endpoint ID** : 3 (local)
- **Documentation API** : https://docs.portainer.io/api/docs

Pour créer un token API :
1. Portainer > Settings > Users > votre utilisateur
2. Access tokens > Add access token

## Support

Pour plus d'informations, consultez le README.md principal du projet.
