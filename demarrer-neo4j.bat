@echo off
echo === DEMARRAGE NEO4J ===
echo.

echo 1. Arret de Neo4j s'il est deja en cours...
docker-compose down

echo.
echo 2. Demarrage de Neo4j...
docker-compose up -d neo4j

echo.
echo 3. Attente de 25 secondes que Neo4j soit pret...
timeout /t 25 /nobreak >nul

echo.
echo 4. Verification du statut...
docker ps --filter "name=bizzanalyze-neo4j"

echo.
echo 5. Logs Neo4j (dernieres lignes)...
docker logs bizzanalyze-neo4j --tail 10

echo.
echo === NEO4J DEVRAIT ETRE PRET ===
echo.
echo Vous pouvez maintenant:
echo - Acceder au Neo4j Browser: http://localhost:7474
echo - User: neo4j
echo - Password: bizzanalyze
echo.
echo Ou executer: npm run db:enhance
echo.










