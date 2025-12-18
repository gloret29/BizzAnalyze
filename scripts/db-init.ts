#!/usr/bin/env tsx
/**
 * Script d'initialisation de la base de données Neo4j
 * Usage: tsx scripts/db-init.ts
 */

import dotenv from 'dotenv';
import { createNeo4jClient, initializeDatabase } from '@bizzanalyze/database';

dotenv.config({ path: 'apps/server/.env' });

async function main() {
  const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'bizzanalyze';

  console.log('🔧 Initialisation de la base de données Neo4j...\n');
  console.log(`URI: ${neo4jUri}`);
  console.log(`User: ${neo4jUser}\n`);

  const client = createNeo4jClient({
    uri: neo4jUri,
    user: neo4jUser,
    password: neo4jPassword,
  });

  try {
    const isConnected = await client.verifyConnectivity();
    if (!isConnected) {
      console.error('❌ Impossible de se connecter à Neo4j');
      process.exit(1);
    }

    console.log('✓ Connecté à Neo4j\n');

    await initializeDatabase(client);
    console.log('\n✅ Base de données initialisée avec succès');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();


















