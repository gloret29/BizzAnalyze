@echo off
echo === RECREATION DU CONTAINER NEO4J ===
echo.

echo 1. Arret et suppression du container...
docker-compose down

echo.
echo 2. Creation du nouveau container...
docker-compose up -d neo4j

echo.
echo 3. Attente de 20 secondes...
timeout /t 20 /nobreak

echo.
echo 4. Verification du statut...
docker ps -a --filter "name=bizzanalyze-neo4j"

echo.
echo 5. Logs Neo4j...
docker logs bizzanalyze-neo4j --tail 15

echo.
echo === FIN ===
echo.
echo Si vous voyez "Started" dans les logs, Neo4j est pret!
echo Sinon, verifiez les erreurs ci-dessus.
echo.
pause
