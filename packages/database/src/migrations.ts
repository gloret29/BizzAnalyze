import type { Neo4jClient } from './neo4j';

/**
 * Initialise la base de données avec les contraintes et index nécessaires
 */
export async function initializeDatabase(client: Neo4jClient): Promise<void> {
  const queries = [
    // Contraintes d'unicité
    `CREATE CONSTRAINT repository_id IF NOT EXISTS
     FOR (r:Repository) REQUIRE r.id IS UNIQUE`,

    `CREATE CONSTRAINT object_id IF NOT EXISTS
     FOR (o:Object) REQUIRE o.id IS UNIQUE`,

    // Index pour performance
    `CREATE INDEX object_type IF NOT EXISTS
     FOR (o:Object) ON (o.type)`,

    `CREATE INDEX object_name IF NOT EXISTS
     FOR (o:Object) ON (o.name)`,

    // Full-text index pour recherche
    `CREATE FULLTEXT INDEX object_search IF NOT EXISTS
     FOR (o:Object) ON EACH [o.name, o.description]`,
  ];

  for (const query of queries) {
    try {
      await client.executeQuery(query);
      console.log('✓ Executed:', query.split('\n')[0].trim());
    } catch (error: any) {
      // Ignore les erreurs si l'index/contrainte existe déjà
      if (!error.message?.includes('already exists')) {
        console.error('Error executing migration:', error);
        throw error;
      }
    }
  }
}

