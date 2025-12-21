@echo off
echo === RECREATION DU CONTENEUR NEO4J ===
echo.

echo 1. Arret et suppression du conteneur existant...
docker-compose down
docker rm -f bizzanalyze-neo4j 2>nul
echo    OK
echo.

echo 2. Creation du nouveau conteneur Neo4j...
docker-compose up -d neo4j
echo    OK
echo.

echo 3. Attente de 30 secondes que Neo4j demarre...
timeout /t 30 /nobreak >nul
echo    OK
echo.

echo 4. Verification du statut...
docker ps --filter "name=bizzanalyze-neo4j"
echo.

echo 5. Logs Neo4j (dernieres lignes)...
docker logs bizzanalyze-neo4j --tail 15
echo.

echo === RECREATION TERMINEE ===
echo.
echo Acces a Neo4j Browser: http://localhost:7474
echo User: neo4j
echo Password: bizzanalyze
echo.
echo Attendez encore 30-60 secondes si Neo4j vient de demarrer.
echo.

















