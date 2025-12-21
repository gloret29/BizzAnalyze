import type {
  Repository,
  BizzDesignObject,
  Relationship,
  SyncResult,
} from '@bizzanalyze/types';
import { BizzDesignClient } from './client';
import progressEmitter from './progressEmitter';

/**
 * Service d'extraction des données depuis BizzDesign
 */
export class BizzDesignExtractor {
  private client: BizzDesignClient;

  constructor(client: BizzDesignClient) {
    this.client = client;
  }

  /**
   * Extrait tous les objets et relations d'un repository
   */
  async extractRepository(
    repositoryId: string
  ): Promise<{
    repository: Repository;
    objects: BizzDesignObject[];
    relationships: Relationship[];
  }> {
    const startTime = new Date();

    const repoIdNum = parseInt(repositoryId);
    if (isNaN(repoIdNum)) {
      throw new Error(`Repository ID invalide: ${repositoryId}`);
    }

    console.log(`🔄 Extraction du repository ${repositoryId}...`);

    // 1. Récupérer les métadonnées du repository
    const repository = await this.client.getRepositoryById(repositoryId);
    console.log(`✓ Repository récupéré: ${repository.name}`);

    // 2. Récupérer tous les objets avec suivi de progression (incluant métriques et profils)
    progressEmitter.emitStart(`Récupération des objets du repository ${repositoryId}...`);
    const objects = await this.client.getAllObjects(
      repoIdNum,
      (offset, current, total) => {
        progressEmitter.emitProgress('objects', current, total, offset);
      },
      {
        includeMetrics: true,
        includeProfiles: true,
        includeExternalIds: true,
      }
    );
    progressEmitter.emitComplete(`Récupération des objets terminée: ${objects.length} objets`);

    // 3. Récupérer TOUTES les relations en une seule fois (beaucoup plus efficace)
    console.log(`📊 Récupération des relations...`);
    progressEmitter.emitStart(`Récupération des relations du repository...`);

    const relationships = await this.client.getAllRelationships(repoIdNum);
    
    progressEmitter.emitComplete(`Récupération des relations terminée: ${relationships.length} relations`);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`✓ Extraction terminée en ${(duration / 1000).toFixed(2)}s`);
    console.log(`  - ${objects.length} objets`);
    console.log(`  - ${relationships.length} relations`);

    return {
      repository,
      objects,
      relationships,
    };
  }

  /**
   * Crée un résultat de synchronisation
   */
  createSyncResult(
    repositoryId: string,
    objectsCount: number,
    relationshipsCount: number,
    startTime: Date,
    endTime: Date,
    errors?: string[]
  ): SyncResult {
    return {
      repositoryId,
      objectsCount,
      relationshipsCount,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      errors,
    };
  }
}

