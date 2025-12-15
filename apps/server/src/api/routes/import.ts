import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';
import { FileStorage } from '../../services/storage/fileStorage';

export function createImportRouter(
  storage: Neo4jStorage
): Router {
  const router = Router();
  const fileStorage = new FileStorage();

  /**
   * POST /api/import
   * Importe les données depuis les fichiers locaux dans Neo4j (mode annule et remplace)
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { repositoryId } = req.body;
      const configStore = getConfigStore();
      const config = configStore.getConfig().bizzdesign;
      const targetRepositoryId = repositoryId || config.repositoryId;

      if (!targetRepositoryId) {
        return res.status(400).json({
          success: false,
          error: 'repositoryId is required',
        });
      }

      // Vérifier que les fichiers d'extraction existent
      const hasExtraction = await fileStorage.hasExtraction(targetRepositoryId);
      if (!hasExtraction) {
        return res.status(404).json({
          success: false,
          error: `Aucune extraction trouvée pour le repository ${targetRepositoryId}. Veuillez d'abord effectuer une extraction.`,
        });
      }

      const startTime = new Date();

      // Charger les données depuis les fichiers
      const { repository, objects, relationships } =
        await fileStorage.loadExtraction(targetRepositoryId);

      // Importer dans Neo4j (mode annule et remplace)
      await storage.saveRepository(repository, objects, relationships);

      const endTime = new Date();

      // Créer un résultat d'import
      const result = {
        repositoryId: repository.id,
        objectsCount: objects.length,
        relationshipsCount: relationships.length,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
      };

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/import/status
   * Vérifie si une extraction existe pour le repository sélectionné
   */
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const config = configStore.getConfig().bizzdesign;
      const repositoryId = config.repositoryId;

      if (!repositoryId) {
        return res.json({
          success: true,
          data: {
            hasExtraction: false,
            message: 'Aucun repository sélectionné',
          },
        });
      }

      const hasExtraction = await fileStorage.hasExtraction(repositoryId);

      res.json({
        success: true,
        data: {
          hasExtraction,
          repositoryId,
        },
      });
    } catch (error: any) {
      console.error('Import status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}

