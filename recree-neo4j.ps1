# Script PowerShell pour recréer le conteneur Neo4j
# Ce script arrête, supprime et recrée Neo4j avec la nouvelle configuration

Write-Host "=== RECREATION DU CONTENEUR NEO4J ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Arrêter et supprimer le conteneur existant
Write-Host "1. Arrêt et suppression du conteneur Neo4j existant..." -ForegroundColor Yellow
docker-compose down

# Optionnel: Supprimer aussi les volumes (décommentez si vous voulez repartir de zéro)
# Write-Host "   Suppression des volumes (données seront perdues)..." -ForegroundColor Yellow
# docker-compose down -v

Write-Host "   ✓ Conteneur arrêté" -ForegroundColor Green
Write-Host ""

# Étape 2: Vérifier qu'il n'y a pas de conteneur orphelin
Write-Host "2. Vérification des conteneurs Docker..." -ForegroundColor Yellow
$existing = docker ps -a --filter "name=bizzanalyze-neo4j" --format "{{.Names}}"
if ($existing) {
    Write-Host "   ⚠ Conteneur orphelin détecté: $existing" -ForegroundColor Yellow
    Write-Host "   Suppression du conteneur orphelin..." -ForegroundColor Yellow
    docker rm -f bizzanalyze-neo4j
    Write-Host "   ✓ Conteneur supprimé" -ForegroundColor Green
} else {
    Write-Host "   ✓ Aucun conteneur existant" -ForegroundColor Green
}
Write-Host ""

# Étape 3: Recréer le conteneur avec la nouvelle configuration
Write-Host "3. Création du nouveau conteneur Neo4j..." -ForegroundColor Yellow
docker-compose up -d neo4j

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Erreur lors de la création du conteneur" -ForegroundColor Red
    exit 1
}

Write-Host "   ✓ Conteneur créé" -ForegroundColor Green
Write-Host ""

# Étape 4: Attendre que Neo4j soit prêt
Write-Host "4. Attente du démarrage de Neo4j (30 secondes)..." -ForegroundColor Yellow
$progress = @('|', '/', '-', '\')
for ($i = 0; $i -lt 30; $i++) {
    $spinner = $progress[$i % $progress.Length]
    Write-Host "`r   [$spinner] Attente... ($($i + 1)/30)" -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
}
Write-Host "`r   ✓ Attente terminée" -ForegroundColor Green
Write-Host ""

# Étape 5: Vérifier le statut
Write-Host "5. Vérification du statut..." -ForegroundColor Yellow
$status = docker ps --filter "name=bizzanalyze-neo4j" --format "{{.Status}}"
if ($status) {
    Write-Host "   ✓ Conteneur en cours d'exécution: $status" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Conteneur non trouvé dans la liste des conteneurs actifs" -ForegroundColor Yellow
    Write-Host "   Vérification des conteneurs arrêtés..." -ForegroundColor Yellow
    $allStatus = docker ps -a --filter "name=bizzanalyze-neo4j" --format "{{.Status}}"
    if ($allStatus) {
        Write-Host "   Status: $allStatus" -ForegroundColor Yellow
    }
}
Write-Host ""

# Étape 6: Afficher les logs récents
Write-Host "6. Logs récents de Neo4j..." -ForegroundColor Yellow
Write-Host "   ---" -ForegroundColor Gray
docker logs bizzanalyze-neo4j --tail 15 2>&1 | ForEach-Object {
    if ($_ -match "error|Error|ERROR|failed|Failed|FAILED") {
        Write-Host "   $_" -ForegroundColor Red
    } elseif ($_ -match "started|Started|ready|Ready") {
        Write-Host "   $_" -ForegroundColor Green
    } else {
        Write-Host "   $_" -ForegroundColor Gray
    }
}
Write-Host "   ---" -ForegroundColor Gray
Write-Host ""

# Étape 7: Vérifier la connectivité
Write-Host "7. Test de connectivité..." -ForegroundColor Yellow
$testResult = docker exec bizzanalyze-neo4j cypher-shell -u neo4j -p bizzanalyze "RETURN 1 as test;" 2>&1
if ($LASTEXITCODE -eq 0 -or $testResult -match "1") {
    Write-Host "   ✓ Neo4j est accessible et répond" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Neo4j n'est pas encore prêt (normal si ça vient de démarrer)" -ForegroundColor Yellow
    Write-Host "   Attendez encore 30-60 secondes avant de l'utiliser" -ForegroundColor Yellow
}
Write-Host ""

# Résumé final
Write-Host "=== RECREATION TERMINEE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Accès à Neo4j:" -ForegroundColor White
Write-Host "   - Neo4j Browser: http://localhost:7474" -ForegroundColor Cyan
Write-Host "   - User: neo4j" -ForegroundColor Gray
Write-Host "   - Password: bizzanalyze" -ForegroundColor Gray
Write-Host ""
Write-Host "📌 Prochaines étapes:" -ForegroundColor White
Write-Host "   1. Attendre 30-60 secondes supplémentaires si Neo4j vient de démarrer" -ForegroundColor Gray
Write-Host "   2. Initialiser la base: npm run db:init" -ForegroundColor Gray
Write-Host "   3. Améliorer la structure: npm run db:enhance" -ForegroundColor Gray
Write-Host ""














