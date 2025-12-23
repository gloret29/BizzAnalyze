#!/usr/bin/env tsx
/**
 * Script d'amélioration de la structure Neo4j pour un meilleur affichage (Version optimisée)
 * 
 * Ce script enrichit les données existantes dans Neo4j avec :
 * - Des propriétés dérivées (displayName, category, subCategory)
 * - Des métriques (relationshipCount, isHub)
 * - Des enrichissements de relations (fromName, toName)
 * 
 * Version optimisée pour éviter les problèmes de mémoire en traitant par petits batches
 * 
 * Usage: tsx scripts/enhance-neo4j-structure-optimized.ts
 */

import dotenv from 'dotenv';
import { createNeo4jClient } from '@bizzanalyze/database';
import { extractObjectName } from '@bizzanalyze/utils';

dotenv.config({ path: 'apps/server/.env' });

const BATCH_SIZE = 250; // Petits batches pour éviter la mémoire
const FETCH_BATCH_SIZE = 500; // Nombre d'objets à récupérer à la fois

async function enhanceObjects(client: any) {
  console.log('\n📦 Étape 1: Enrichissement des objets...\n');

  // Étape 1.1: Extraire category et subCategory par petits batches
  console.log(`  → Extraction des catégories (par batches de ${BATCH_SIZE})...`);
  
  let categorizedCount = 0;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    // Récupérer un batch d'objets avec leur type
    const fetchBatchQuery = `
      MATCH (o:Object)
      WHERE o.type IS NOT NULL AND o.type CONTAINS ':'
      RETURN o.id as id, o.type as type
      SKIP $offset
      LIMIT $limit
    `;
    
    const batch = await client.executeQuery(fetchBatchQuery, {
      offset,
      limit: FETCH_BATCH_SIZE,
    });
    
    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }
    
    // Préparer les mises à jour avec catégories
    const updates = batch.map((record: any) => {
      const id = record.id;
      const type = record.type || '';
      const parts = type.split(':');
      
      return {
        id,
        category: parts[0] || 'Other',
        subCategory: parts.slice(1).join(':') || 'Unknown',
      };
    });
    
    // Mettre à jour par sous-batches
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const subBatch = updates.slice(i, i + BATCH_SIZE);
      
      const updateQuery = `
        UNWIND $updates AS update
        MATCH (o:Object {id: update.id})
        SET o.category = update.category,
            o.subCategory = update.subCategory
        RETURN count(o) as count
      `;
      
      try {
        const result = await client.executeQuery(updateQuery, { updates: subBatch });
        const count = result[0]?.count || (result[0] as any)?.count || 0;
        categorizedCount += typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
      } catch (error: any) {
        console.error(`    ⚠ Erreur sur batch ${offset + i}:`, error.message);
      }
    }
    
    offset += FETCH_BATCH_SIZE;
    hasMore = batch.length === FETCH_BATCH_SIZE;
    
    if (offset % 5000 === 0 || !hasMore) {
      console.log(`    → ${categorizedCount} objets catégorisés...`);
    }
  }
  
  console.log(`    ✓ ${categorizedCount} objets catégorisés au total`);

  // Étape 1.2: Créer displayName depuis name ou objectName
  console.log(`  → Extraction des noms d'affichage (par batches de ${BATCH_SIZE})...`);
  
  let displayNameCount = 0;
  offset = 0;
  hasMore = true;
  
  while (hasMore) {
    // Récupérer un batch d'objets
    const fetchBatchQuery = `
      MATCH (o:Object)
      RETURN o.id as id, o.name as name, o.objectName as objectName
      SKIP $offset
      LIMIT $limit
    `;
    
    const batch = await client.executeQuery(fetchBatchQuery, {
      offset,
      limit: FETCH_BATCH_SIZE,
    });
    
    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }
    
    // Traiter les noms d'affichage
    const updates = batch.map((record: any) => {
      let displayName = record.name || '';
      
      if (!displayName && record.objectName) {
        try {
          const objectNameObj = typeof record.objectName === 'string' 
            ? JSON.parse(record.objectName) 
            : record.objectName;
          displayName = extractObjectName(objectNameObj) || '';
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      if (!displayName) {
        displayName = (record.id || '').substring(0, 8) + '...';
      }
      
      return {
        id: record.id,
        displayName,
      };
    });
    
    // Mettre à jour par sous-batches
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const subBatch = updates.slice(i, i + BATCH_SIZE);
      
      const updateQuery = `
        UNWIND $updates AS update
        MATCH (o:Object {id: update.id})
        SET o.displayName = update.displayName
        RETURN count(o) as count
      `;
      
      try {
        const result = await client.executeQuery(updateQuery, { updates: subBatch });
        const count = result[0]?.count || (result[0] as any)?.count || 0;
        displayNameCount += typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
      } catch (error: any) {
        console.error(`    ⚠ Erreur sur batch ${offset + i}:`, error.message);
      }
    }
    
    offset += FETCH_BATCH_SIZE;
    hasMore = batch.length === FETCH_BATCH_SIZE;
    
    if (offset % 5000 === 0 || !hasMore) {
      console.log(`    → ${displayNameCount} objets avec displayName...`);
    }
  }
  
  console.log(`    ✓ ${displayNameCount} objets avec displayName au total`);

  // Étape 1.3: Calculer relationshipCount par petits batches
  console.log(`  → Calcul des métriques de relations (par batches de ${BATCH_SIZE})...`);
  
  let metricsCount = 0;
  offset = 0;
  hasMore = true;
  
  while (hasMore) {
    // Récupérer un batch d'IDs d'objets
    const fetchBatchQuery = `
      MATCH (o:Object)
      RETURN o.id as id
      SKIP $offset
      LIMIT $limit
    `;
    
    const batch = await client.executeQuery(fetchBatchQuery, {
      offset,
      limit: FETCH_BATCH_SIZE,
    });
    
    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }
    
    const objectIds = batch.map((record: any) => record.id);
    
    // Traiter par sous-batches pour calculer les métriques
    for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
      const subBatch = objectIds.slice(i, i + BATCH_SIZE);
      
      const metricsQuery = `
        UNWIND $objectIds AS objId
        MATCH (o:Object {id: objId})
        WITH o, 
             size((o)-[:RELATES_TO]->()) as outgoing,
             size((o)<-[:RELATES_TO]-()) as incoming
        SET o.relationshipCount = outgoing + incoming,
            o.outgoingCount = outgoing,
            o.incomingCount = incoming,
            o.isHub = (outgoing + incoming) > 10,
            o.isLeaf = (outgoing + incoming) = 0
        RETURN count(o) as count
      `;
      
      try {
        const result = await client.executeQuery(metricsQuery, { objectIds: subBatch });
        const count = result[0]?.count || (result[0] as any)?.count || 0;
        metricsCount += typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
      } catch (error: any) {
        console.error(`    ⚠ Erreur sur batch ${offset + i}:`, error.message);
      }
    }
    
    offset += FETCH_BATCH_SIZE;
    hasMore = batch.length === FETCH_BATCH_SIZE;
    
    if (offset % 5000 === 0 || !hasMore) {
      console.log(`    → ${metricsCount} objets avec métriques...`);
    }
  }
  
  console.log(`    ✓ ${metricsCount} objets avec métriques au total`);

  return { totalObjects: metricsCount };
}

async function enhanceRelationships(client: any) {
  console.log('\n🔗 Étape 2: Enrichissement des relations...\n');

  console.log(`  → Ajout des noms source et target (par batches de ${BATCH_SIZE})...`);
  
  let enrichedCount = 0;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    // Récupérer un batch de relations
    const fetchBatchQuery = `
      MATCH (source:Object)-[r:RELATES_TO]->(target:Object)
      RETURN r.id as relationId, source.id as sourceId, target.id as targetId
      SKIP $offset
      LIMIT $limit
    `;
    
    const batch = await client.executeQuery(fetchBatchQuery, {
      offset,
      limit: FETCH_BATCH_SIZE,
    });
    
    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }
    
    // Traiter par sous-batches
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const subBatch = batch.slice(i, i + BATCH_SIZE);
      
      const enrichQuery = `
        UNWIND $relations AS rel
        MATCH (source:Object {id: rel.sourceId})-[r:RELATES_TO]->(target:Object {id: rel.targetId})
        WHERE r.id = rel.relationId
        SET r.fromName = coalesce(source.displayName, source.name, source.id),
            r.toName = coalesce(target.displayName, target.name, target.id)
        RETURN count(r) as count
      `;
      
      try {
        const result = await client.executeQuery(enrichQuery, { relations: subBatch });
        const count = result[0]?.count || (result[0] as any)?.count || 0;
        enrichedCount += typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
      } catch (error: any) {
        console.error(`    ⚠ Erreur sur batch ${offset + i}:`, error.message);
      }
    }
    
    offset += FETCH_BATCH_SIZE;
    hasMore = batch.length === FETCH_BATCH_SIZE;
    
    if (offset % 10000 === 0 || !hasMore) {
      console.log(`    → ${enrichedCount} relations enrichies...`);
    }
  }
  
  console.log(`    ✓ ${enrichedCount} relations enrichies au total`);

  return { totalRelations: enrichedCount };
}

async function createIndexes(client: any) {
  console.log('\n📇 Étape 3: Création des index...\n');

  const indexes = [
    {
      name: 'object_category',
      query: `CREATE INDEX object_category IF NOT EXISTS FOR (o:Object) ON (o.category)`,
    },
    {
      name: 'object_subcategory',
      query: `CREATE INDEX object_subcategory IF NOT EXISTS FOR (o:Object) ON (o.subCategory)`,
    },
    {
      name: 'object_displayname',
      query: `CREATE INDEX object_displayname IF NOT EXISTS FOR (o:Object) ON (o.displayName)`,
    },
    {
      name: 'object_hub',
      query: `CREATE INDEX object_hub IF NOT EXISTS FOR (o:Object) ON (o.isHub)`,
    },
  ];

  for (const index of indexes) {
    try {
      await client.executeQuery(index.query);
      console.log(`    ✓ Index ${index.name} créé`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`    ⚠ Index ${index.name} existe déjà`);
      } else {
        console.error(`    ✗ Erreur pour ${index.name}:`, error.message);
      }
    }
  }
}

async function showStatistics(client: any) {
  console.log('\n📊 Statistiques finales:\n');

  const statsQuery = `
    MATCH (o:Object)
    OPTIONAL MATCH (o)-[r:RELATES_TO]->()
    WITH count(DISTINCT o) as totalObjects,
         count(DISTINCT r) as totalRelations,
         collect(DISTINCT o.category) as categories
    RETURN 
      totalObjects,
      totalRelations,
      size(categories) as categoryCount,
      CASE 
        WHEN totalObjects > 0 THEN round(toFloat(totalRelations) / totalObjects * 100) / 100
        ELSE 0
      END as avgRelationsPerObject
  `;

  try {
    const stats = await client.executeQuery(statsQuery);
    const stat = stats[0] as any;

    if (stat) {
      console.log(`  📦 Objets totaux: ${stat.totalObjects || 0}`);
      console.log(`  🔗 Relations totales: ${stat.totalRelations || 0}`);
      console.log(`  📂 Catégories: ${stat.categoryCount || 0}`);
      console.log(`  📈 Relations moyennes par objet: ${stat.avgRelationsPerObject || 0}`);
    }

    // Distribution par catégorie
    const distributionQuery = `
      MATCH (o:Object)
      WHERE o.category IS NOT NULL
      RETURN o.category as category, count(o) as count
      ORDER BY count DESC
      LIMIT 10
    `;

    const distribution = await client.executeQuery(distributionQuery);
    
    if (distribution && distribution.length > 0) {
      console.log('\n  📊 Top 10 catégories:');
      distribution.forEach((item: any) => {
        const category = item.category;
        const count = item.count || 0;
        if (category) {
          console.log(`    - ${category}: ${count} objets`);
        }
      });
    }
  } catch (error: any) {
    console.error('  ⚠ Erreur lors de la récupération des statistiques:', error.message);
  }
}

async function main() {
  const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'bizzanalyze';

  console.log('🚀 Amélioration de la structure Neo4j pour BizzAnalyze (Version optimisée)\n');
  console.log(`URI: ${neo4jUri}`);
  console.log(`User: ${neo4jUser}`);
  console.log(`Batch size: ${BATCH_SIZE} objets/batch\n`);

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

    const startTime = Date.now();

    // Étape 1: Enrichir les objets
    await enhanceObjects(client);

    // Étape 2: Enrichir les relations
    await enhanceRelationships(client);

    // Étape 3: Créer les index
    await createIndexes(client);

    // Étape 4: Afficher les statistiques
    await showStatistics(client);

    const duration = Date.now() - startTime;

    console.log(`\n✅ Amélioration terminée en ${(duration / 1000).toFixed(2)}s (${(duration / 60000).toFixed(2)} minutes)\n`);
  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'amélioration:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();



























