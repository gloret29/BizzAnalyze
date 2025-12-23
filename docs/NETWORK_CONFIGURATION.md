# Configuration Réseau - Accès depuis Internet

## Problème

Quand vous accédez à l'application depuis internet, vous pouvez rencontrer des erreurs de réseau lors des appels API.

## Solutions

### Solution 1 : Utiliser un Reverse Proxy (Recommandé) ⭐⭐⭐

Utilisez un reverse proxy (SWAG, Nginx, Traefik) pour router automatiquement les requêtes :

**Configuration SWAG/Nginx :**
```nginx
location /api {
    proxy_pass http://192.168.1.115:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    proxy_pass http://192.168.1.115:3002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Avantages :**
- URLs relatives fonctionnent automatiquement
- Pas besoin de configurer `NEXT_PUBLIC_API_URL`
- Gestion SSL/TLS centralisée
- Meilleure sécurité

### Solution 2 : Configurer NEXT_PUBLIC_API_URL

Si vous n'utilisez pas de reverse proxy, configurez l'URL complète de l'API :

**Dans Portainer :**
1. Allez dans **Stacks** > **BizzAnalyze** > **Editor**
2. Ajoutez/modifiez la variable d'environnement :
   ```yaml
   web:
     environment:
       - NEXT_PUBLIC_API_URL=http://votre-domaine.com:3001
       # ou pour HTTPS:
       - NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
   ```

**Exemples selon votre configuration :**

- **Accès local uniquement :**
  ```
  NEXT_PUBLIC_API_URL=http://192.168.1.115:3001
  ```

- **Accès depuis internet avec domaine :**
  ```
  NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
  ```

- **Accès depuis internet avec IP publique :**
  ```
  NEXT_PUBLIC_API_URL=http://votre-ip-publique:3001
  ```

### Solution 3 : Détection Automatique (Déjà implémentée)

L'application détecte automatiquement l'URL de l'API :
- Si vous accédez sur le port **3002**, elle utilise automatiquement le port **3001** pour l'API
- Fonctionne pour les accès locaux (192.168.x.x)
- Nécessite que les deux ports soient accessibles depuis internet

## Vérification

### 1. Vérifier que les ports sont ouverts

```bash
# Depuis internet, tester l'accès à l'API
curl http://votre-ip-publique:3001/health

# Tester l'accès à l'application web
curl http://votre-ip-publique:3002
```

### 2. Vérifier les logs

Dans Portainer, consultez les logs des containers :
- `bizzanalyze-web` : Vérifier les erreurs de connexion API
- `bizzanalyze-server` : Vérifier que l'API répond

### 3. Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez :
- Les erreurs CORS
- Les erreurs de connexion réseau
- Les URLs utilisées pour les appels API

## Problèmes Courants

### Erreur CORS

Si vous voyez des erreurs CORS, vérifiez que :
1. L'API autorise les requêtes depuis votre domaine
2. Les headers CORS sont correctement configurés dans le serveur

**Solution :** Le serveur autorise déjà toutes les origines (`cors()`), mais vérifiez que le firewall n bloque pas les requêtes.

### Erreur "Network Error"

Cela signifie que le navigateur ne peut pas atteindre l'API.

**Causes possibles :**
1. Le port 3001 n'est pas accessible depuis internet
2. Le firewall bloque le port
3. L'URL de l'API est incorrecte

**Solutions :**
1. Ouvrir le port 3001 dans le firewall
2. Configurer `NEXT_PUBLIC_API_URL` avec l'URL correcte
3. Utiliser un reverse proxy

### Erreur "Connection Refused"

Le serveur API n'est pas accessible.

**Vérifications :**
1. Le container `bizzanalyze-server` est-il démarré ?
2. Le port 3001 est-il bien mappé dans docker-compose ?
3. Y a-t-il un conflit de ports ?

## Configuration Recommandée pour Production

### Avec Reverse Proxy (SWAG/Nginx)

1. **Ne pas exposer les ports 3001 et 3002 publiquement**
2. **Exposer uniquement le port 80/443 du reverse proxy**
3. **Laisser `NEXT_PUBLIC_API_URL` vide** (URL relative)

### Sans Reverse Proxy

1. **Exposer les ports 3001 et 3002**
2. **Configurer `NEXT_PUBLIC_API_URL`** avec l'URL publique complète
3. **Utiliser HTTPS** si possible (certificat Let's Encrypt)

## Exemple de Configuration Portainer

```yaml
web:
  environment:
    # Pour accès depuis internet avec domaine
    - NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
    
    # OU pour accès local
    - NEXT_PUBLIC_API_URL=http://192.168.1.115:3001
    
    # OU laisser vide si vous utilisez un reverse proxy
    - NEXT_PUBLIC_API_URL=
```

## Debug

Pour déboguer les problèmes réseau :

1. **Vérifier l'URL utilisée par l'application :**
   - Ouvrir la console du navigateur
   - Regarder les requêtes réseau dans l'onglet Network
   - Vérifier l'URL complète des requêtes API

2. **Tester l'API directement :**
   ```bash
   # Depuis votre machine
   curl http://votre-ip:3001/api/health
   
   # Depuis internet
   curl http://votre-ip-publique:3001/api/health
   ```

3. **Vérifier les logs du serveur :**
   ```bash
   # Dans Portainer
   Stacks > BizzAnalyze > bizzanalyze-server > Logs
   ```

## Support

Si le problème persiste :
1. Vérifiez les logs des containers
2. Vérifiez la configuration du firewall
3. Vérifiez que les ports sont bien mappés dans docker-compose
4. Testez l'accès direct à l'API depuis internet
