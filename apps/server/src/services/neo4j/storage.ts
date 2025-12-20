import type { Neo4jClient } from '@bizzanalyze/database';
import type {
  Repository,
  BizzDesignObject,
  Relationship,
  DataBlock,
} from '@bizzanalyze/types';
import { chunk, extractObjectName } from '@bizzanalyze/utils';
import { Transaction, int } from 'neo4j-driver';

/**
 * Service de stockage dans Neo4j
 */
export class Neo4jStorage {
  private client: Neo4jClient;

  constructor(client: Neo4jClient) {
    this.client = client;
  }

  /**
   * Sauvegarde un repository avec tous ses objets et relations
   * Mode "annule et remplace" : supprime toutes les données existantes avant d'insérer les nouvelles
   * Optimisé pour les performances avec transactions séparées et préparation des données
   */
  async saveRepository(
    repository: Repository,
    objects: BizzDesignObject[],
    relationships: Relationship[]
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`💾 Sauvegarde dans Neo4j (mode annule et remplace)...`);
    console.log(`📊 ${objects.length} objets, ${relationships.length} relations`);

    // OPTIMISATION 1: Préparer toutes les données AVANT les transactions
    console.log(`⚙️  Préparation des données...`);
    const preparedObjects = objects.map((obj) => {
      const objectNameStr = extractObjectName(obj.objectName) || obj.name || obj.externalId || obj.id || '';
      return {
        id: obj.id,
        type: obj.type,
        name: objectNameStr,
        objectName: obj.objectName ? JSON.stringify(obj.objectName) : null,
        description: obj.description || null,
        properties: JSON.stringify(obj.properties || {}),
        metadata: JSON.stringify(obj.metadata || {}),
        tags: obj.tags || [],
      };
    });

    const preparedRelationships = relationships.map((rel) => ({
      id: rel.id,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      type: rel.type,
      properties: JSON.stringify(rel.properties || {}),
      metadata: JSON.stringify(rel.metadata || {}),
    }));

    // Extraire et préparer les data blocks
    const preparedDataBlocks: Array<{
      id: string; // Format: objectId:namespace:name
      objectId: string;
      namespace: string;
      name: string;
      values: string; // JSON stringifié
      updatedAt: string;
    }> = [];
    
    objects.forEach((obj) => {
      if (obj.documents && obj.documents.length > 0) {
        obj.documents.forEach((doc) => {
          preparedDataBlocks.push({
            id: `${obj.id}:${doc.schemaNamespace}:${doc.schemaName}`,
            objectId: obj.id,
            namespace: doc.schemaNamespace,
            name: doc.schemaName,
            values: JSON.stringify(doc.values || {}),
            updatedAt: doc.updatedAt || new Date().toISOString(),
          });
        });
      }
    });

    // Collecter tous les tags uniques
    const allTags = new Set<string>();
    preparedObjects.forEach((obj) => {
      obj.tags.forEach((tag) => allTags.add(tag));
    });

    console.log(`✓ Données préparées (${allTags.size} tags uniques, ${preparedDataBlocks.length} data blocks)`);

    // OPTIMISATION 2: Transaction séparée pour créer/mettre à jour le Repository
    await this.client.executeTransaction(async (tx: Transaction) => {
      await tx.run(
        `
        MERGE (r:Repository {id: $id})
        SET r.name = $name,
            r.description = $description,
            r.version = $version,
            r.updatedAt = datetime()
        RETURN r
      `,
        {
          id: repository.id,
          name: repository.name,
          description: repository.description || null,
          version: repository.version || null,
        }
      );
    });

    // OPTIMISATION 3: Transaction séparée pour supprimer (requête optimisée - mode annule et remplace)
    console.log(`🗑️  Suppression des données existantes du repository ${repository.id} (mode annule et remplace)...`);
    const deleteStartTime = Date.now();
    await this.client.executeTransaction(async (tx: Transaction) => {
      // Étape 1: Supprimer tous les objets liés au repository via CONTAINS
      // DETACH DELETE supprime les objets et toutes leurs relations (RELATES_TO, HAS_TAG, etc.)
      await tx.run(
        `
        MATCH (r:Repository {id: $repositoryId})-[containsRel:CONTAINS]->(o:Object)
        DETACH DELETE o, containsRel
      `,
        { repositoryId: repository.id }
      );
      
      // Étape 2: Supprimer les objets orphelins qui pourraient avoir les mêmes IDs
      // (cas où un import précédent a échoué partiellement)
      // On supprime les objets qui ne sont liés à aucun repository
      await tx.run(
        `
        MATCH (o:Object)
        WHERE NOT (o)<-[:CONTAINS]-()
        DETACH DELETE o
      `
      );
      
      // Étape 3: Supprimer les data blocks orphelins (ceux qui ne sont plus liés à aucun objet)
      await tx.run(
        `
        MATCH (db:DataBlock)
        WHERE NOT (db)<-[:HAS_DATABLOCK]-()
        DELETE db
      `
      );
      
      // Étape 4: Supprimer les tags orphelins (ceux qui ne sont plus liés à aucun objet)
      await tx.run(
        `
        MATCH (t:Tag)
        WHERE NOT (t)<-[:HAS_TAG]-()
        DELETE t
      `
      );
    });
    console.log(`✓ Données existantes supprimées (${Date.now() - deleteStartTime}ms)`);

    // OPTIMISATION 4: Transactions séparées pour les objets avec batch size augmenté
    const batchSize = 5000; // Augmenté de 1000 à 5000
    const objectBatches = chunk(preparedObjects, batchSize);
    const totalObjects = preparedObjects.length;
    console.log(`📦 Création de ${objectBatches.length} batch(s) d'objets (${batchSize} objets/batch, ${totalObjects} objets au total)...`);

    const objectsStartTime = Date.now();
    let processedObjects = 0;
    for (let i = 0; i < objectBatches.length; i++) {
      const batch = objectBatches[i];
      const batchStartTime = Date.now();
      
      await this.client.executeTransaction(async (tx: Transaction) => {
        // OPTIMISATION 5: Utiliser MERGE pour éviter les conflits d'ID
        // (au cas où la suppression n'aurait pas tout supprimé)
        await tx.run(
          `
          MATCH (r:Repository {id: $repositoryId})
          UNWIND $objects AS obj
          MERGE (o:Object {id: obj.id})
          SET o.type = obj.type,
              o.name = obj.name,
              o.objectName = obj.objectName,
              o.description = obj.description,
              o.properties = obj.properties,
              o.metadata = obj.metadata,
              o.updatedAt = datetime()
          MERGE (r)-[:CONTAINS]->(o)
        `,
          {
            objects: batch,
            repositoryId: repository.id,
          }
        );
      });

      processedObjects += batch.length;
      const batchDuration = Date.now() - batchStartTime;
      const progressPercent = ((processedObjects / totalObjects) * 100).toFixed(1);
      const elapsedTime = Date.now() - objectsStartTime;
      const avgTimePerObject = elapsedTime / processedObjects;
      const remainingObjects = totalObjects - processedObjects;
      const estimatedTimeRemaining = Math.round((remainingObjects * avgTimePerObject) / 1000);
      
      console.log(`  ✓ Batch ${i + 1}/${objectBatches.length}: ${batch.length} objets | Total: ${processedObjects}/${totalObjects} (${progressPercent}%) | ${batchDuration}ms | ETA: ~${estimatedTimeRemaining}s`);
    }
    console.log(`✓ Tous les objets créés (${Date.now() - objectsStartTime}ms)`);

    // OPTIMISATION 5.5: Créer les data blocks avec leurs relations
    if (preparedDataBlocks.length > 0) {
      const dataBlocksStartTime = Date.now();
      console.log(`📦 Création des data blocks (${preparedDataBlocks.length} data blocks)...`);
      const dataBlockBatches = chunk(preparedDataBlocks, batchSize);
      let processedDataBlocks = 0;
      
      for (let i = 0; i < dataBlockBatches.length; i++) {
        const batch = dataBlockBatches[i];
        const batchStartTime = Date.now();
        
        await this.client.executeTransaction(async (tx: Transaction) => {
          // Créer les data blocks et leurs relations avec les objets
          await tx.run(
            `
            UNWIND $dataBlocks AS db
            MATCH (o:Object {id: db.objectId})
            MERGE (datablock:DataBlock {id: db.id})
            SET datablock.namespace = db.namespace,
                datablock.name = db.name,
                datablock.values = db.values,
                datablock.updatedAt = db.updatedAt
            MERGE (o)-[:HAS_DATABLOCK]->(datablock)
          `,
            { dataBlocks: batch }
          );
        });
        
        processedDataBlocks += batch.length;
        const batchDuration = Date.now() - batchStartTime;
        const progressPercent = ((processedDataBlocks / preparedDataBlocks.length) * 100).toFixed(1);
        console.log(`  ✓ Data blocks batch ${i + 1}/${dataBlockBatches.length}: ${batch.length} data blocks | Total: ${processedDataBlocks}/${preparedDataBlocks.length} (${progressPercent}%) | ${batchDuration}ms`);
      }
      console.log(`✓ Tous les data blocks créés (${Date.now() - dataBlocksStartTime}ms)`);
    }

    // OPTIMISATION 6: Créer les tags en une seule transaction séparée
    if (allTags.size > 0) {
      const tagsStartTime = Date.now();
      console.log(`🏷️  Création des tags (${allTags.size} tags)...`);
      
      await this.client.executeTransaction(async (tx: Transaction) => {
        // Créer tous les tags en une seule requête
        await tx.run(
          `
          UNWIND $tags AS tagName
          MERGE (t:Tag {name: tagName})
        `,
          { tags: Array.from(allTags) }
        );
      });

      // Créer les relations HAS_TAG en batch
      const tagRelationships: Array<{ objectId: string; tagName: string }> = [];
      preparedObjects.forEach((obj) => {
        obj.tags.forEach((tag) => {
          tagRelationships.push({ objectId: obj.id, tagName: tag });
        });
      });

      if (tagRelationships.length > 0) {
        const tagRelBatches = chunk(tagRelationships, batchSize);
        const totalTagRels = tagRelationships.length;
        let processedTagRels = 0;
        
        for (let i = 0; i < tagRelBatches.length; i++) {
          const batch = tagRelBatches[i];
          await this.client.executeTransaction(async (tx: Transaction) => {
            await tx.run(
              `
              UNWIND $tagRels AS tagRel
              MATCH (o:Object {id: tagRel.objectId})
              MATCH (t:Tag {name: tagRel.tagName})
              MERGE (o)-[:HAS_TAG]->(t)
            `,
              { tagRels: batch }
            );
          });
          
          processedTagRels += batch.length;
          const progressPercent = ((processedTagRels / totalTagRels) * 100).toFixed(1);
          console.log(`  ✓ Tags batch ${i + 1}/${tagRelBatches.length}: ${batch.length} relations | Total: ${processedTagRels}/${totalTagRels} (${progressPercent}%)`);
        }
      }
      console.log(`✓ Tags créés (${Date.now() - tagsStartTime}ms)`);
    }

    // OPTIMISATION 7: Transactions séparées pour les relations avec batch size augmenté
    if (preparedRelationships.length > 0) {
      const relStartTime = Date.now();
      const totalRelations = preparedRelationships.length;
      console.log(`🔗 Création des relations (${totalRelations} relations)...`);
      const relationshipBatches = chunk(preparedRelationships, batchSize);

      let processedRelations = 0;
      for (let i = 0; i < relationshipBatches.length; i++) {
        const batch = relationshipBatches[i];
        const batchStartTime = Date.now();
        
        await this.client.executeTransaction(async (tx: Transaction) => {
          // OPTIMISATION 8: Utiliser CREATE au lieu de MERGE pour les nouvelles relations
          await tx.run(
            `
            UNWIND $relationships AS rel
            MATCH (source:Object {id: rel.sourceId})
            MATCH (target:Object {id: rel.targetId})
            CREATE (source)-[r:RELATES_TO {id: rel.id}]->(target)
            SET r.type = rel.type,
                r.properties = rel.properties,
                r.metadata = rel.metadata
          `,
            { relationships: batch }
          );
        });

        processedRelations += batch.length;
        const batchDuration = Date.now() - batchStartTime;
        const progressPercent = ((processedRelations / totalRelations) * 100).toFixed(1);
        const elapsedTime = Date.now() - relStartTime;
        const avgTimePerRel = elapsedTime / processedRelations;
        const remainingRels = totalRelations - processedRelations;
        const estimatedTimeRemaining = Math.round((remainingRels * avgTimePerRel) / 1000);
        
        console.log(`  ✓ Batch ${i + 1}/${relationshipBatches.length}: ${batch.length} relations | Total: ${processedRelations}/${totalRelations} (${progressPercent}%) | ${batchDuration}ms | ETA: ~${estimatedTimeRemaining}s`);
      }
      console.log(`✓ Toutes les relations créées (${Date.now() - relStartTime}ms)`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✓ Données sauvegardées dans Neo4j (${totalDuration}ms / ${(totalDuration / 1000).toFixed(2)}s)`);
  }

  /**
   * Récupère les objets avec pagination
   */
  async getObjects(
    repositoryId: string,
    page: number = 0,
    pageSize: number = 50,
    filters?: {
      type?: string;
      search?: string;
    }
  ): Promise<{ objects: any[]; total: number }> {
    try {
      const conditions: string[] = [];
      // Utiliser neo4j.int() pour forcer les entiers (requis par Neo4j)
      const params: any = {
        repositoryId,
        skip: int(Math.floor(page * pageSize)),
        limit: int(Math.floor(pageSize)),
      };

      if (filters?.type) {
        conditions.push('o.type = $type');
        params.type = filters.type;
      }

      if (filters?.search) {
        // Recherche insensible à la casse dans objectName (nom de l'objet) et description
        // Gérer les valeurs null correctement
        conditions.push(`(
          (o.objectName IS NOT NULL AND toLower(o.objectName) CONTAINS toLower($search)) 
          OR (o.name IS NOT NULL AND toLower(o.name) CONTAINS toLower($search))
          OR (o.description IS NOT NULL AND toLower(o.description) CONTAINS toLower($search))
        )`);
        params.search = filters.search;
        console.log(`[SEARCH] Recherche activée avec terme: "${filters.search}"`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
        ${whereClause}
        RETURN o.id as id, o.type as type, o.name as name, o.objectName as objectName, o.description as description, o.properties as properties, o.metadata as metadata
        ORDER BY o.name
        SKIP $skip
        LIMIT $limit
      `;
      
      console.log(`[SEARCH] Requête Cypher:`, query);
      console.log(`[SEARCH] Paramètres:`, params);

      const countQuery = `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
        ${whereClause}
        RETURN count(o) as total
      `;

      // Helper pour convertir les Integer Neo4j en nombres
      const toNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'object' && val.toNumber) return val.toNumber();
        if (typeof val === 'object' && val.low !== undefined) return val.low;
        return parseInt(String(val), 10) || 0;
      };

      // Vérifier d'abord si le repository existe et a des objets
      const checkQuery = `MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object) RETURN count(o) as total`;
      const checkResult = await this.client.executeQuery(checkQuery, { repositoryId });
      const totalObjects = toNumber(checkResult[0]?.total);
      console.log(`[SEARCH] Repository ${repositoryId} contient ${totalObjects} objet(s) au total`);

      const [objects, countResult] = await Promise.all([
        this.client.executeQuery(query, params),
        this.client.executeQuery(countQuery, params),
      ]);

      const total = toNumber(countResult[0]?.total);

      // Log pour debug
      console.log(`[SEARCH] Requête exécutée: ${objects.length} objet(s) retourné(s), total: ${total}`);
      if (filters?.search) {
        console.log(`[SEARCH] Recherche "${filters.search}" : ${total} résultat(s) trouvé(s) sur ${totalObjects} objet(s) total`);
      }

      return {
        objects: objects.map((record: any) => {
          // La requête retourne maintenant directement les propriétés
          try {
            // Parser objectName depuis JSON si nécessaire
            let parsedObjectName: string | null = null;
            if (record.objectName) {
              try {
                const objectNameObj = typeof record.objectName === 'string' 
                  ? JSON.parse(record.objectName) 
                  : record.objectName;
                parsedObjectName = extractObjectName(objectNameObj) || null;
              } catch (e) {
                // Si ce n'est pas du JSON, utiliser directement
                parsedObjectName = record.objectName;
              }
            }
            
            const finalName = parsedObjectName || record.name || '';
            
            // Log pour debug si le nom est vide
            if (!finalName && objects.indexOf(record) === 0) {
              console.warn(`[getObjects] Objet ${record.id} sans nom - parsedObjectName:`, parsedObjectName, 'record.name:', record.name, 'record.objectName:', record.objectName);
            }
            
            const result = {
              id: record.id || '',
              type: record.type || '',
              name: finalName,
              objectName: finalName, // Pour compatibilité avec le frontend
              description: record.description || null,
              properties: record.properties 
                ? (typeof record.properties === 'string' ? JSON.parse(record.properties) : record.properties) 
                : {},
              metadata: record.metadata 
                ? (typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata) 
                : {},
            };
            
            // Log le premier objet pour debug
            if (objects.indexOf(record) === 0) {
              console.log(`[SEARCH] Exemple d'objet retourné:`, JSON.stringify(result, null, 2));
            }
            
            return result;
          } catch (e) {
            console.warn(`[SEARCH] Erreur de désérialisation:`, e, record);
            return {
              id: record?.id || '',
              type: record?.type || '',
              name: record?.name || '',
              description: record?.description || null,
              properties: {},
              metadata: {},
            };
          }
        }),
        total,
      };
    } catch (error: any) {
      // Si le repository n'existe pas dans Neo4j, retourner une liste vide
      if (error.message?.includes('NodeNotFound') || error.message?.includes('PathNotFound') || error.message?.includes('not found')) {
        console.warn(`Repository ${repositoryId} not found in Neo4j, returning empty objects list.`);
        return {
          objects: [],
          total: 0,
        };
      }
      // Re-lancer les autres erreurs
      throw error;
    }
  }

  /**
   * Récupère tous les data blocks d'un repository
   */
  async getDataBlocks(
    repositoryId: string,
    filters?: {
      namespace?: string;
      name?: string;
      objectId?: string;
    }
  ): Promise<any[]> {
    try {
      const conditions: string[] = [
        '(r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)-[:HAS_DATABLOCK]->(db:DataBlock)'
      ];
      const params: any = { repositoryId };

      if (filters?.namespace) {
        conditions.push('db.namespace = $namespace');
        params.namespace = filters.namespace;
      }

      if (filters?.name) {
        conditions.push('db.name = $name');
        params.name = filters.name;
      }

      if (filters?.objectId) {
        conditions.push('o.id = $objectId');
        params.objectId = filters.objectId;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)-[:HAS_DATABLOCK]->(db:DataBlock)
        ${whereClause}
        RETURN db.id as id,
               db.namespace as namespace,
               db.name as name,
               db.values as values,
               db.updatedAt as updatedAt,
               o.id as objectId,
               o.name as objectName
        ORDER BY o.name, db.namespace, db.name
      `;

      const result = await this.client.executeQuery(query, params);

      return result.map((record: any) => {
        let values = {};
        if (record.values) {
          try {
            values = typeof record.values === 'string' 
              ? JSON.parse(record.values) 
              : record.values;
          } catch (e) {
            console.warn(`[getDataBlocks] Erreur de parsing des values pour ${record.id}:`, e);
            values = {};
          }
        }

        return {
          id: record.id,
          objectId: record.objectId,
          objectName: record.objectName,
          namespace: record.namespace,
          name: record.name,
          values,
          updatedAt: record.updatedAt,
        };
      });
    } catch (error: any) {
      console.error('[getDataBlocks] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère un data block par son ID
   */
  async getDataBlockById(dataBlockId: string): Promise<any | null> {
    try {
      const result = await this.client.executeQuery(
        `
        MATCH (o:Object)-[:HAS_DATABLOCK]->(db:DataBlock {id: $dataBlockId})
        RETURN db.id as id,
               db.namespace as namespace,
               db.name as name,
               db.values as values,
               db.updatedAt as updatedAt,
               o.id as objectId,
               o.name as objectName,
               o.type as objectType
      `,
        { dataBlockId }
      );

      if (result.length === 0) {
        return null;
      }

      const record = result[0];
      let values = {};
      if (record.values) {
        try {
          values = typeof record.values === 'string' 
            ? JSON.parse(record.values) 
            : record.values;
        } catch (e) {
          console.warn(`[getDataBlockById] Erreur de parsing des values pour ${dataBlockId}:`, e);
          values = {};
        }
      }

      return {
        id: record.id,
        objectId: record.objectId,
        objectName: record.objectName,
        objectType: record.objectType,
        namespace: record.namespace,
        name: record.name,
        values,
        updatedAt: record.updatedAt,
      };
    } catch (error: any) {
      console.error(`[getDataBlockById] Erreur pour le data block ${dataBlockId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère tous les data blocks d'un objet
   */
  async getDataBlocksByObject(objectId: string): Promise<any[]> {
    try {
      const result = await this.client.executeQuery(
        `
        MATCH (o:Object {id: $objectId})-[:HAS_DATABLOCK]->(db:DataBlock)
        RETURN db.id as id,
               db.namespace as namespace,
               db.name as name,
               db.values as values,
               db.updatedAt as updatedAt
        ORDER BY db.namespace, db.name
      `,
        { objectId }
      );

      return result.map((record: any) => {
        let values = {};
        if (record.values) {
          try {
            values = typeof record.values === 'string' 
              ? JSON.parse(record.values) 
              : record.values;
          } catch (e) {
            console.warn(`[getDataBlocksByObject] Erreur de parsing des values pour ${record.id}:`, e);
            values = {};
          }
        }

        return {
          id: record.id,
          namespace: record.namespace,
          name: record.name,
          values,
          updatedAt: record.updatedAt,
        };
      });
    } catch (error: any) {
      console.error(`[getDataBlocksByObject] Erreur pour l'objet ${objectId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère un objet par son ID
   */
  async getObjectById(objectId: string): Promise<any | null> {
    try {
      const result = await this.client.executeQuery(
        `
        MATCH (o:Object {id: $objectId})
        OPTIONAL MATCH (o)-[:HAS_TAG]->(t:Tag)
        OPTIONAL MATCH (o)-[r:RELATES_TO]->(target:Object)
        OPTIONAL MATCH (source:Object)-[r2:RELATES_TO]->(o)
        OPTIONAL MATCH (o)-[:HAS_DATABLOCK]->(db:DataBlock)
        RETURN o.id as id, o.type as type, o.name as name, o.objectName as objectName, o.description as description, 
               o.properties as properties, o.metadata as metadata,
               collect(DISTINCT t.name) as tags,
               collect(DISTINCT {id: target.id, name: target.name, type: r.type}) as outgoing,
               collect(DISTINCT {id: source.id, name: source.name, type: r2.type}) as incoming,
               collect(DISTINCT {
                 id: db.id,
                 namespace: db.namespace,
                 name: db.name,
                 values: db.values,
                 updatedAt: db.updatedAt
               }) as dataBlocks
      `,
        { objectId }
      );

      if (result.length === 0) {
        return null;
      }

      const record = result[0];
      
      // Parser objectName depuis JSON si nécessaire
      let parsedObjectName: string | null = null;
      if (record.objectName) {
        try {
          const objectNameObj = typeof record.objectName === 'string' 
            ? JSON.parse(record.objectName) 
            : record.objectName;
          parsedObjectName = extractObjectName(objectNameObj) || null;
        } catch (e) {
          // Si ce n'est pas du JSON, utiliser directement
          parsedObjectName = typeof record.objectName === 'string' ? record.objectName : null;
        }
      }
      
      // Désérialiser les propriétés JSON
      let properties = {};
      if (record.properties) {
        try {
          properties = typeof record.properties === 'string' 
            ? JSON.parse(record.properties) 
            : record.properties;
        } catch (e) {
          console.warn(`[getObjectById] Erreur de parsing des properties pour ${objectId}:`, e);
          properties = {};
        }
      }
      
      let metadata = {};
      if (record.metadata) {
        try {
          metadata = typeof record.metadata === 'string' 
            ? JSON.parse(record.metadata) 
            : record.metadata;
        } catch (e) {
          console.warn(`[getObjectById] Erreur de parsing des metadata pour ${objectId}:`, e);
          metadata = {};
        }
      }
      
      // Filtrer les valeurs null des relations
      const outgoing = (record.outgoing || []).filter((rel: any) => rel.id && rel.id !== null);
      const incoming = (record.incoming || []).filter((rel: any) => rel.id && rel.id !== null);

      // Parser les data blocks
      const dataBlocks = (record.dataBlocks || [])
        .filter((db: any) => db && db.id && db.id !== null)
        .map((db: any) => {
          let values = {};
          if (db.values) {
            try {
              values = typeof db.values === 'string' 
                ? JSON.parse(db.values) 
                : db.values;
            } catch (e) {
              console.warn(`[getObjectById] Erreur de parsing des values pour data block ${db.id}:`, e);
              values = {};
            }
          }
          return {
            id: db.id,
            namespace: db.namespace,
            name: db.name,
            values,
            updatedAt: db.updatedAt,
          };
        });

      const finalName = parsedObjectName || record.name || '';
      
      // Log pour debug si le nom est vide
      if (!finalName) {
        console.warn(`[getObjectById] Objet ${objectId} sans nom - parsedObjectName:`, parsedObjectName, 'record.name:', record.name, 'record.objectName:', record.objectName);
      }
      
      return {
        id: record.id || objectId,
        type: record.type || '',
        name: finalName,
        objectName: finalName,
        description: record.description || null,
        properties,
        metadata,
        tags: (record.tags || []).filter((tag: any) => tag !== null),
        dataBlocks,
        relationships: {
          outgoing,
          incoming,
        },
      };
    } catch (error: any) {
      console.error(`[getObjectById] Erreur pour l'objet ${objectId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques
   */
  async getStats(repositoryId: string): Promise<any> {
    const queries = {
      totalObjects: `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
        RETURN count(o) as total
      `,
      totalRelationships: `
        MATCH (repo:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
        MATCH (o)-[rel:RELATES_TO]->()
        RETURN count(rel) as total
      `,
      objectsByType: `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
        RETURN o.type as type, count(o) as count
        ORDER BY count DESC
      `,
    };

    const [totalObjects, totalRelationships, objectsByType] = await Promise.all([
      this.client.executeQuery(queries.totalObjects, { repositoryId }),
      this.client.executeQuery(queries.totalRelationships, { repositoryId }),
      this.client.executeQuery(queries.objectsByType, { repositoryId }),
    ]);

    // Convertir les Integer Neo4j en nombres JavaScript
    const toNumber = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val.toNumber) return val.toNumber();
      if (typeof val === 'object' && val.low !== undefined) return val.low;
      return parseInt(String(val), 10) || 0;
    };

    return {
      totalObjects: toNumber(totalObjects[0]?.total),
      totalRelationships: toNumber(totalRelationships[0]?.total),
      objectsByType: objectsByType.reduce(
        (acc: Record<string, number>, item: any) => {
          if (item.type) {
            acc[item.type] = toNumber(item.count);
          }
          return acc;
        },
        {}
      ),
    };
  }

  /**
   * Récupère un échantillon du graphe pour visualisation
   */
  async getGraphSample(
    repositoryId: string,
    limit: number = 500,
    filters?: { type?: string; search?: string }
  ): Promise<{ nodes: any[]; edges: any[] }> {
    try {
      const conditions: string[] = [`(r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)`];
      const params: any = {
        repositoryId,
        limit: int(Math.floor(limit)),
      };

      if (filters?.type) {
        conditions.push('o.type = $type');
        params.type = filters.type;
      }

      if (filters?.search) {
        conditions.push(`(
          (o.objectName IS NOT NULL AND toLower(o.objectName) CONTAINS toLower($search)) 
          OR (o.name IS NOT NULL AND toLower(o.name) CONTAINS toLower($search))
        )`);
        params.search = filters.search;
      }

      // Récupérer les nœuds
      const nodesQuery = `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
        ${filters?.type ? 'WHERE o.type = $type' : ''}
        ${filters?.search ? (filters?.type ? 'AND' : 'WHERE') + ` (
          (o.objectName IS NOT NULL AND toLower(o.objectName) CONTAINS toLower($search)) 
          OR (o.name IS NOT NULL AND toLower(o.name) CONTAINS toLower($search))
        )` : ''}
        WITH o
        LIMIT $limit
        RETURN o.id as id, 
               coalesce(o.displayName, o.name, o.objectName, o.id) as label,
               o.type as type,
               o.category as category,
               o.subCategory as subCategory
      `;

      const nodesResult = await this.client.executeQuery(nodesQuery, params);
      const nodeIds = nodesResult.map((record: any) => record.id);

      if (nodeIds.length === 0) {
        return { nodes: [], edges: [] };
      }

      // Récupérer les relations entre ces nœuds
      const edgesQuery = `
        MATCH (source:Object)-[r:RELATES_TO]->(target:Object)
        WHERE source.id IN $nodeIds AND target.id IN $nodeIds
        RETURN r.id as id,
               source.id as from,
               target.id as to,
               r.type as type,
               coalesce(r.fromName, source.displayName, source.name, source.id) as fromName,
               coalesce(r.toName, target.displayName, target.name, target.id) as toName
        LIMIT 2000
      `;

      const edgesResult = await this.client.executeQuery(edgesQuery, {
        nodeIds,
      });

      const nodes = nodesResult.map((record: any) => ({
        id: record.id,
        label: record.label || record.id,
        type: record.type,
        category: record.category,
        subCategory: record.subCategory,
      }));

      const edges = edgesResult.map((record: any) => ({
        id: record.id,
        from: record.from,
        to: record.to,
        type: record.type || 'RELATES_TO',
        label: record.type || '',
        fromName: record.fromName,
        toName: record.toName,
      }));

      return { nodes, edges };
    } catch (error: any) {
      console.error('[getGraphSample] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère un nœud et ses voisins
   */
  async getNodeWithNeighbors(
    repositoryId: string,
    nodeId: string,
    maxNeighbors: number = 50
  ): Promise<{ nodes: any[]; edges: any[] }> {
    try {
      const query = `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(center:Object {id: $nodeId})
        OPTIONAL MATCH (center)-[r1:RELATES_TO]-(neighbor:Object)
        WHERE (r:Repository {id: $repositoryId})-[:CONTAINS]->(neighbor)
        WITH center, collect(DISTINCT neighbor)[..$maxNeighbors] as neighbors, 
             collect(DISTINCT r1)[..$maxNeighbors] as relationships
        OPTIONAL MATCH (neighbors)-[r2:RELATES_TO]-(neighbor2:Object)
        WHERE (r:Repository {id: $repositoryId})-[:CONTAINS]->(neighbor2)
          AND neighbor2.id <> $nodeId
          AND NOT neighbor2 IN neighbors
        WITH center, neighbors, relationships,
             collect(DISTINCT neighbor2)[..$maxNeighbors] as neighbors2,
             collect(DISTINCT r2)[..$maxNeighbors] as relationships2
        RETURN 
          collect(DISTINCT {
            id: center.id,
            label: coalesce(center.displayName, center.name, center.objectName, center.id),
            type: center.type,
            category: center.category,
            subCategory: center.subCategory
          }) + 
          [n IN neighbors | {
            id: n.id,
            label: coalesce(n.displayName, n.name, n.objectName, n.id),
            type: n.type,
            category: n.category,
            subCategory: n.subCategory
          }] +
          [n IN neighbors2 | {
            id: n.id,
            label: coalesce(n.displayName, n.name, n.objectName, n.id),
            type: n.type,
            category: n.category,
            subCategory: n.subCategory
          }] as nodes,
          [r IN relationships | {
            id: r.id,
            from: startNode(r).id,
            to: endNode(r).id,
            type: r.type,
            label: r.type,
            fromName: coalesce(startNode(r).displayName, startNode(r).name, startNode(r).id),
            toName: coalesce(endNode(r).displayName, endNode(r).name, endNode(r).id)
          }] +
          [r IN relationships2 | {
            id: r.id,
            from: startNode(r).id,
            to: endNode(r).id,
            type: r.type,
            label: r.type,
            fromName: coalesce(startNode(r).displayName, startNode(r).name, startNode(r).id),
            toName: coalesce(endNode(r).displayName, endNode(r).name, endNode(r).id)
          }] as edges
      `;

      const result = await this.client.executeQuery(query, {
        repositoryId,
        nodeId,
        maxNeighbors: int(Math.floor(maxNeighbors)),
      });

      if (result.length === 0) {
        return { nodes: [], edges: [] };
      }

      const record = result[0];
      return {
        nodes: record.nodes || [],
        edges: record.edges || [],
      };
    } catch (error: any) {
      console.error('[getNodeWithNeighbors] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère les voisins d'un nœud avec une profondeur spécifiée
   */
  async getNodeNeighbors(
    repositoryId: string,
    nodeId: string,
    depth: number = 1
  ): Promise<{ nodes: any[]; edges: any[] }> {
    try {
      if (depth === 1) {
        return this.getNodeWithNeighbors(repositoryId, nodeId, 50);
      }

      // Pour depth > 1, utiliser une requête récursive
      const query = `
        MATCH path = (r:Repository {id: $repositoryId})-[:CONTAINS]->(start:Object {id: $nodeId})-[*1..${depth}]-(end:Object)
        WHERE (r)-[:CONTAINS]->(end)
        WITH nodes(path) as pathNodes, relationships(path) as pathRels
        UNWIND pathNodes as node
        WITH DISTINCT node, pathRels
        OPTIONAL MATCH (node)-[rel:RELATES_TO]-(connected:Object)
        WHERE (r:Repository {id: $repositoryId})-[:CONTAINS]->(connected)
          AND connected IN pathNodes
        WITH collect(DISTINCT {
          id: node.id,
          label: coalesce(node.displayName, node.name, node.objectName, node.id),
          type: node.type,
          category: node.category,
          subCategory: node.subCategory
        }) as nodes,
        [r IN pathRels + collect(DISTINCT rel) | {
          id: r.id,
          from: startNode(r).id,
          to: endNode(r).id,
          type: r.type,
          label: r.type
        }] as edges
        RETURN nodes, edges
        LIMIT 1
      `;

      const result = await this.client.executeQuery(query, {
        repositoryId,
        nodeId,
      });

      if (result.length === 0) {
        return { nodes: [], edges: [] };
      }

      const record = result[0];
      return {
        nodes: record.nodes || [],
        edges: record.edges || [],
      };
    } catch (error: any) {
      console.error('[getNodeNeighbors] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère les relations pour l'export
   */
  async getRelationshipsForExport(
    repositoryId: string,
    filters?: { type?: string; search?: string }
  ): Promise<any[]> {
    try {
      const conditions: string[] = ['(r)-[:CONTAINS]->(o2)'];
      const params: any = { repositoryId };

      if (filters?.type) {
        conditions.push('(o1.type = $type OR o2.type = $type)');
        params.type = filters.type;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o1:Object)-[rel:RELATES_TO]->(o2:Object)
        ${whereClause}
        RETURN rel.id as id,
               o1.id as sourceId,
               o2.id as targetId,
               rel.type as type,
               coalesce(o1.displayName, o1.name, o1.objectName, o1.id) as sourceName,
               coalesce(o2.displayName, o2.name, o2.objectName, o2.id) as targetName,
               o1.type as sourceType,
               o2.type as targetType
        LIMIT 100000
      `;

      const result = await this.client.executeQuery(query, params);

      return result.map((record: any) => ({
        id: record.id,
        sourceId: record.sourceId,
        targetId: record.targetId,
        type: record.type,
        sourceName: record.sourceName,
        targetName: record.targetName,
        sourceType: record.sourceType,
        targetType: record.targetType,
      }));
    } catch (error: any) {
      console.error('[getRelationshipsForExport] Error:', error);
      throw error;
    }
  }
}

