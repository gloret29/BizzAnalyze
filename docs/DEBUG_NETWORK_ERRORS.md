# Guide de Diagnostic - Erreurs Réseau depuis Internet

## Problème

Vous obtenez une erreur "Network Error" quand vous accédez à l'application depuis internet, mais ça fonctionne en interne.

## Étapes de Diagnostic

### 1. Vérifier les Logs dans la Console du Navigateur

1. **Ouvrez la console du navigateur** (F12 ou Clic droit > Inspecter > Console)
2. **Rechargez la page** depuis internet
3. **Cherchez les logs suivants** :

```
[API] URL détectée: ...
[API] Location actuelle: ...
[API] Protocol: ...
[API] Port: ...
```

Ces logs vous indiquent quelle URL est utilisée pour les appels API.

### 2. Vérifier les Erreurs Réseau

1. **Onglet Network** dans la console (F12 > Network)
2. **Rechargez la page**
3. **Cherchez les requêtes qui échouent** (en rouge)
4. **Cliquez sur la requête** pour voir les détails :
   - **Request URL** : Quelle URL complète est utilisée ?
   - **Status** : Code d'erreur (0, 404, 500, etc.)
   - **Headers** : Vérifiez les headers de la requête

### 3. Scénarios Possibles

#### Scénario A : URL Relative Utilisée (Correct pour SWAG)

Si vous voyez dans les logs :
```
[API] URL détectée: (URL relative - routée par proxy)
[API] Protocol: https:
```

**C'est correct !** L'application utilise une URL relative `/api` qui sera routée par SWAG.

**Si ça ne fonctionne pas :**
- Vérifiez que SWAG route bien `/api` vers `192.168.1.115:3001`
- Vérifiez les logs SWAG pour voir si les requêtes arrivent
- Testez directement : `https://bizzanalyze.votre-domaine.com/api/health`

#### Scénario B : URL Absolue avec Port (Problème)

Si vous voyez dans les logs :
```
[API] URL détectée: https://votre-domaine.com:3001
```

**C'est le problème !** L'application essaie d'accéder directement au port 3001 depuis internet, ce qui ne fonctionne pas avec SWAG.

**Solution :** Configurez `NEXT_PUBLIC_API_URL` à vide dans Portainer pour forcer l'URL relative.

#### Scénario C : Erreur CORS

Si vous voyez dans la console :
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```

**Solution :** Le serveur autorise déjà toutes les origines (`cors()`), mais vérifiez que SWAG transmet bien les headers CORS.

### 4. Test Direct de l'API

Testez si l'API est accessible via SWAG :

```bash
# Depuis votre machine (ou depuis internet)
curl https://bizzanalyze.votre-domaine.com/api/health

# Devrait retourner :
# {"status":"ok","timestamp":"..."}
```

Si ça ne fonctionne pas :
- Vérifiez la configuration SWAG
- Vérifiez que le serveur backend est démarré
- Vérifiez les logs SWAG

### 5. Vérifier la Configuration SWAG

Votre configuration SWAG devrait ressembler à :

```nginx
location /api {
    include /config/nginx/authelia-location.conf;
    include /config/nginx/proxy.conf;
    include /config/nginx/resolver.conf;
    set $upstream_app 192.168.1.115;
    set $upstream_port 3001;
    set $upstream_proto http;
    proxy_pass $upstream_proto://$upstream_app:$upstream_port;
}
```

**Points à vérifier :**
- `$upstream_app` pointe vers la bonne IP (192.168.1.115)
- `$upstream_port` est 3001
- Le serveur backend est accessible depuis SWAG (même réseau Docker ou réseau accessible)

### 6. Vérifier les Logs SWAG

Dans SWAG, vérifiez les logs :
- `/config/log/nginx/error.log`
- `/config/log/nginx/access.log`

Cherchez les erreurs liées à `/api` ou à `192.168.1.115:3001`.

### 7. Test depuis le Container SWAG

Si possible, testez depuis le container SWAG :

```bash
# Depuis le container SWAG
curl http://192.168.1.115:3001/api/health
```

Si ça ne fonctionne pas, le problème est que SWAG ne peut pas atteindre le serveur backend.

## Solutions selon le Problème

### Problème : SWAG ne peut pas atteindre 192.168.1.115:3001

**Causes possibles :**
1. Le serveur backend n'est pas démarré
2. Le port 3001 n'est pas accessible depuis SWAG
3. Problème de réseau entre SWAG et le serveur

**Solutions :**
1. Vérifiez que le container `bizzanalyze-server` est démarré dans Portainer
2. Testez depuis SWAG : `curl http://192.168.1.115:3001/api/health`
3. Si SWAG est dans Docker et le serveur aussi, utilisez le nom du service : `http://bizzanalyze-server:3001`

### Problème : L'application utilise une URL absolue au lieu d'une URL relative

**Solution :** Dans Portainer, configurez `NEXT_PUBLIC_API_URL` à vide :

```yaml
web:
  environment:
    - NEXT_PUBLIC_API_URL=
```

Cela forcera l'utilisation d'URLs relatives.

### Problème : Erreur "Connection Refused"

**Causes possibles :**
1. Le serveur backend n'écoute pas sur 0.0.0.0
2. Le port 3001 est bloqué par le firewall

**Solutions :**
1. Vérifiez que le serveur écoute sur `0.0.0.0` (déjà corrigé)
2. Vérifiez les logs du serveur dans Portainer

### Problème : Timeout

**Solution :** Le timeout a été augmenté à 60s. Si le problème persiste :
1. Vérifiez la latence réseau
2. Vérifiez que SWAG a un timeout suffisant dans sa configuration

## Configuration Recommandée pour SWAG

Si SWAG et les containers sont sur le même réseau Docker, utilisez les noms de services :

```nginx
location /api {
    include /config/nginx/authelia-location.conf;
    include /config/nginx/proxy.conf;
    include /config/nginx/resolver.conf;
    set $upstream_app bizzanalyze-server;  # Nom du service Docker
    set $upstream_port 3001;
    set $upstream_proto http;
    proxy_pass $upstream_proto://$upstream_app:$upstream_port;
}

location / {
    include /config/nginx/authelia-location.conf;
    include /config/nginx/proxy.conf;
    include /config/nginx/resolver.conf;
    set $upstream_app bizzanalyze-web;  # Nom du service Docker
    set $upstream_port 3000;
    set $upstream_proto http;
    proxy_pass $upstream_proto://$upstream_app:$upstream_port;
}
```

**Note :** Cela nécessite que SWAG soit sur le même réseau Docker que les containers BizzAnalyze.

## Commandes Utiles

### Tester l'API directement
```bash
# Depuis internet
curl https://bizzanalyze.votre-domaine.com/api/health

# Depuis le serveur
curl http://localhost:3001/api/health
```

### Vérifier les containers
```bash
# Dans Portainer ou via Docker
docker ps | grep bizzanalyze
docker logs bizzanalyze-server
docker logs bizzanalyze-web
```

### Vérifier la connectivité réseau
```bash
# Depuis SWAG vers le serveur
curl http://192.168.1.115:3001/api/health
```

## Prochaines Étapes

1. **Ouvrez la console du navigateur** (F12)
2. **Rechargez la page** depuis internet
3. **Copiez les logs** `[API]` qui apparaissent
4. **Vérifiez l'onglet Network** pour voir les requêtes qui échouent
5. **Partagez ces informations** pour un diagnostic plus précis

Les logs dans la console vous donneront toutes les informations nécessaires pour identifier le problème exact.
