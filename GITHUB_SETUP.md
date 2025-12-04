# Configuration du dépôt GitHub pour BizzAnalyze

## 📋 Étapes pour créer le dépôt GitHub

### Option 1 : Via l'interface web GitHub

1. **Créer le dépôt sur GitHub**
   - Allez sur [GitHub](https://github.com)
   - Cliquez sur le bouton "+" en haut à droite
   - Sélectionnez "New repository"
   - Nom du dépôt : `BizzAnalyze`
   - Description : "Plateforme d'analyse et de modélisation d'architecture d'entreprise"
   - Choisissez Public ou Private selon vos préférences
   - **NE PAS** initialiser avec un README, .gitignore ou licence (nous avons déjà ces fichiers)
   - Cliquez sur "Create repository"

2. **Connecter le dépôt local au dépôt GitHub**
   ```bash
   git remote add origin https://github.com/VOTRE_USERNAME/BizzAnalyze.git
   git branch -M main
   git push -u origin main
   ```

### Option 2 : Via GitHub CLI (si installé)

```bash
# Créer le dépôt et le connecter automatiquement
gh repo create BizzAnalyze --public --source=. --remote=origin --push
```

### Option 3 : Via l'API GitHub

Si vous préférez utiliser l'API GitHub directement, vous pouvez utiliser curl :

```bash
# Remplacez YOUR_TOKEN par votre token GitHub et YOUR_USERNAME par votre nom d'utilisateur
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"BizzAnalyze","description":"Plateforme d'analyse et de modélisation d'architecture d'entreprise","private":false}'

# Puis connecter le dépôt local
git remote add origin https://github.com/YOUR_USERNAME/BizzAnalyze.git
git branch -M main
git push -u origin main
```

## ✅ Vérification

Après avoir poussé le code, vérifiez que tout fonctionne :

```bash
git remote -v
git status
```

Vous devriez voir votre dépôt GitHub listé comme `origin`.

## 🔐 Configuration recommandée

1. **Protection de la branche main** (optionnel mais recommandé)
   - Allez dans Settings > Branches
   - Ajoutez une règle pour la branche `main`
   - Activez "Require pull request reviews before merging"

2. **Secrets et variables** (si nécessaire)
   - Allez dans Settings > Secrets and variables > Actions
   - Ajoutez les secrets nécessaires pour CI/CD

3. **Topics et description**
   - Ajoutez des topics pertinents : `architecture`, `enterprise`, `modeling`, `typescript`, `monorepo`

