@echo off
echo === DEMARRAGE BIZZANALYZE ===
echo.

echo 1. Arret des services...
docker-compose down 2>nul
taskkill /F /IM node.exe 2>nul

echo 2. Demarrage de Neo4j...
docker-compose up -d neo4j

echo 3. Attente de 20 secondes...
timeout /t 20 /nobreak

echo 4. Verification Neo4j...
docker ps --filter "name=bizzanalyze-neo4j"

echo 5. Initialisation de la base...
call npm run db:init

echo 6. Demarrage des services...
echo    Serveur API et Web en cours de demarrage...
echo    - Web App: http://localhost:3000
echo    - API: http://localhost:3001
echo    - Neo4j: http://localhost:7474
echo.
echo Appuyez sur Ctrl+C pour arreter.
call npm run dev











