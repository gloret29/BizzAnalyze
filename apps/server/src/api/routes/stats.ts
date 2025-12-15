import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';

export function createStatsRouter(storage: Neo4jStorage): Router {
  const router = Router();

  /**
   * GET /api/stats
   * Récupère les statistiques globales
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        // Retourner des stats vides si aucun repository n'est sélectionné
        return res.json({
          success: true,
          data: {
            totalObjects: 0,
            totalRelationships: 0,
            objectsByType: {},
            repositoryId: null,
          },
        });
      }

      try {
        const stats = await storage.getStats(repositoryId);

        res.json({
          success: true,
          data: {
            ...stats,
            repositoryId,
          },
        });
      } catch (storageError: any) {
        // Si le repository n'existe pas dans Neo4j, retourner des stats vides
        console.warn(`Stats not found for repository ${repositoryId}:`, storageError.message);
        res.json({
          success: true,
          data: {
            totalObjects: 0,
            totalRelationships: 0,
            objectsByType: {},
            repositoryId,
          },
        });
      }
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}

