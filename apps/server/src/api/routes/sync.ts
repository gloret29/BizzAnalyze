import { Router, Request, Response } from 'express';
import { getConfigStore } from '../../services/config/configStore';
import { BizzDesignClient } from '../../services/bizzdesign/client';
import { BizzDesignExtractor } from '../../services/bizzdesign/extractor';
import { FileStorage } from '../../services/storage/fileStorage';

export function createSyncRouter(): Router {
  const router = Router();
  const fileStorage = new FileStorage();

  /**
   * POST /api/sync
   * Extrait les données depuis BizzDesign et les sauvegarde dans des fichiers locaux
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

      // Créer un nouveau client avec la configuration actuelle
      const bizzDesignClient = new BizzDesignClient(config);
      const extractor = new BizzDesignExtractor(bizzDesignClient);

      const startTime = new Date();

      // Extraire les données depuis BizzDesign
      const { repository, objects, relationships } =
        await extractor.extractRepository(targetRepositoryId);

      // Sauvegarder dans des fichiers locaux
      const { repositoryPath, objectsPath, relationshipsPath } =
        await fileStorage.saveExtraction(repository, objects, relationships);

      const endTime = new Date();

      const result = extractor.createSyncResult(
        repository.id,
        objects.length,
        relationships.length,
        startTime,
        endTime
      );

      res.json({
        success: true,
        data: {
          ...result,
          files: {
            repository: repositoryPath,
            objects: objectsPath,
            relationships: relationshipsPath,
          },
        },
      });
    } catch (error: any) {
      console.error('Extraction error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}

