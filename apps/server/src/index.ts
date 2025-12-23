import { config } from './config';
import { createNeo4jClient, initializeDatabase } from '@bizzanalyze/database';
import { BizzDesignClient } from './services/bizzdesign/client';
import { BizzDesignExtractor } from './services/bizzdesign/extractor';
import { Neo4jStorage } from './services/neo4j/storage';
import { createApi } from './api';

async function main() {
  console.log('🚀 Démarrage de BizzAnalyze Server...\n');

  // Initialiser Neo4j
  console.log('📊 Connexion à Neo4j...');
  const neo4jClient = createNeo4jClient(config.neo4j);
  
  const isConnected = await neo4jClient.verifyConnectivity();
  if (!isConnected) {
    console.error('❌ Impossible de se connecter à Neo4j');
    process.exit(1);
  }
  console.log('✓ Connecté à Neo4j\n');

  // Initialiser la base de données (contraintes, index)
  console.log('🔧 Initialisation de la base de données...');
  await initializeDatabase(neo4jClient);
  console.log('✓ Base de données initialisée\n');

  // Initialiser les services
  const storage = new Neo4jStorage(neo4jClient);

  // Créer l'API
  const app = createApi(storage);

  // Démarrer le serveur
  // Écouter sur 0.0.0.0 pour être accessible depuis internet
  const port = config.server.port;
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => {
    console.log(`✅ Serveur démarré sur http://${host}:${port}`);
    console.log(`   Health check: http://${host}:${port}/health`);
    console.log(`   API: http://${host}:${port}/api\n`);
  });

  // Gestion de l'arrêt propre
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    await neo4jClient.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

