# Script de déploiement BizzAnalyze dans Portainer
# Usage: .\deploy-portainer.ps1 -PortainerUrl "https://192.168.1.115:9443" -ApiToken "VOTRE_TOKEN" -ServerIp "192.168.1.115"

param(
    [Parameter(Mandatory=$true)]
    [string]$PortainerUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiToken,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerIp,
    
    [string]$Neo4jPassword = "bizzanalyze",
    [string]$Neo4jUser = "neo4j",
    [string]$Neo4jDatabase = "neo4j",
    [string]$EndpointId = "3",
    [switch]$Force = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploiement BizzAnalyze dans Portainer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
    "X-API-Key" = $ApiToken
    "Content-Type" = "application/json"
}

# Vérifier la connexion à Portainer
Write-Host "Vérification de la connexion à Portainer..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$PortainerUrl/api/status" -Headers $headers -Method GET
    Write-Host "[OK] Connexion reussie a Portainer" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Erreur de connexion a Portainer: $_" -ForegroundColor Red
    exit 1
}

# Vérifier si la stack existe déjà
Write-Host "Vérification de l'existence de la stack..." -ForegroundColor Yellow
try {
    $stacks = Invoke-RestMethod -Uri "$PortainerUrl/api/stacks" -Headers $headers
    $existingStack = $stacks | Where-Object { $_.Name -eq "BizzAnalyze" }
    
    if ($existingStack) {
        Write-Host "[ATTENTION] Stack 'BizzAnalyze' existe deja (ID: $($existingStack.Id))" -ForegroundColor Yellow
        
        if ($Force) {
            Write-Host "Suppression automatique de la stack existante (--Force)..." -ForegroundColor Yellow
            $shouldDelete = $true
        } else {
            try {
                $response = Read-Host "Voulez-vous la supprimer et la recreer ? (O/N)"
                $shouldDelete = ($response -eq "O" -or $response -eq "o")
            } catch {
                # Mode non-interactif, supprimer automatiquement
                Write-Host "Mode non-interactif detecte. Suppression automatique..." -ForegroundColor Yellow
                $shouldDelete = $true
            }
        }
        
        if ($shouldDelete) {
            Write-Host "Suppression de la stack existante..." -ForegroundColor Yellow
            try {
                Invoke-RestMethod -Uri "$PortainerUrl/api/stacks/$($existingStack.Id)?endpointId=$EndpointId" -Method DELETE -Headers $headers
                Write-Host "[OK] Stack supprimee" -ForegroundColor Green
                
                # Attendre un peu pour que la suppression soit complète
                Start-Sleep -Seconds 2
            } catch {
                Write-Host "[ERREUR] Erreur lors de la suppression: $_" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "Deploiement annule." -ForegroundColor Yellow
            exit 0
        }
    }
} catch {
    Write-Host "[ERREUR] Erreur lors de la verification des stacks: $_" -ForegroundColor Red
    exit 1
}

# Préparer le body pour la création de la stack
$body = @{
    name = "BizzAnalyze"
    repositoryURL = "https://github.com/gloret29/BizzAnalyze.git"
    repositoryReferenceName = "refs/heads/master"
    composeFile = "docker-compose.portainer.yml"
    env = @(
        @{ name = "NEO4J_USER"; value = $Neo4jUser }
        @{ name = "NEO4J_PASSWORD"; value = $Neo4jPassword }
        @{ name = "NEO4J_DATABASE"; value = $Neo4jDatabase }
        @{ name = "NEXT_PUBLIC_API_URL"; value = "http://${ServerIp}:3001" }
    )
} | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "Configuration du déploiement:" -ForegroundColor Cyan
Write-Host "  - Stack: BizzAnalyze" -ForegroundColor White
Write-Host "  - Repository: https://github.com/gloret29/BizzAnalyze.git" -ForegroundColor White
Write-Host "  - Compose file: docker-compose.portainer.yml" -ForegroundColor White
Write-Host "  - Neo4j User: $Neo4jUser" -ForegroundColor White
Write-Host "  - Neo4j Password: $Neo4jPassword" -ForegroundColor White
Write-Host "  - API URL: http://${ServerIp}:3001" -ForegroundColor White
Write-Host ""

if (-not $Force) {
    try {
        $confirm = Read-Host "Confirmer le deploiement ? (O/N)"
        if ($confirm -ne "O" -and $confirm -ne "o") {
            Write-Host "Deploiement annule." -ForegroundColor Yellow
            exit 0
        }
    } catch {
        # Mode non-interactif, continuer automatiquement
        Write-Host "Mode non-interactif detecte. Deploiement automatique..." -ForegroundColor Yellow
    }
}

# Deployer la stack
Write-Host ""
Write-Host "Deploiement de la stack..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$PortainerUrl/api/stacks/create/standalone/repository?endpointId=$EndpointId" -Method POST -Headers $headers -Body $body
    Write-Host "[OK] Stack deployee avec succes !" -ForegroundColor Green
    Write-Host "  Stack ID: $($result.Id)" -ForegroundColor White
    Write-Host ""
    Write-Host "Les services vont demarrer dans quelques instants..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "URLs d'acces:" -ForegroundColor Cyan
    Write-Host "  - Application Web: http://${ServerIp}:3002" -ForegroundColor White
    Write-Host "  - API Backend: http://${ServerIp}:3001" -ForegroundColor White
    Write-Host "  - Neo4j Browser: http://${ServerIp}:7474" -ForegroundColor White
    Write-Host ""
    Write-Host "Vous pouvez suivre le deploiement dans Portainer > Stacks > BizzAnalyze" -ForegroundColor Yellow
} catch {
    Write-Host "[ERREUR] Erreur lors du deploiement: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  Details: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}

