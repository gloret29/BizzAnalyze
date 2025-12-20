import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';

export function createDataBlocksRouter(storage: Neo4jStorage): Router {
  const router = Router();

  /**
   * GET /api/datablocks
   * Liste les data blocks avec filtres optionnels
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const filters: {
        namespace?: string;
        name?: string;
        objectId?: string;
      } = {};

      if (req.query.namespace) {
        filters.namespace = req.query.namespace as string;
      }

      if (req.query.name) {
        filters.name = req.query.name as string;
      }

      if (req.query.objectId) {
        filters.objectId = req.query.objectId as string;
      }

      const dataBlocks = await storage.getDataBlocks(repositoryId, filters);

      res.json({
        success: true,
        data: dataBlocks,
        count: dataBlocks.length,
      });
    } catch (error: any) {
      console.error('Error fetching data blocks:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch data blocks',
      });
    }
  });

  /**
   * GET /api/datablocks/:id
   * Récupère un data block par son ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dataBlock = await storage.getDataBlockById(id);

      if (!dataBlock) {
        return res.status(404).json({
          success: false,
          error: 'Data block not found',
        });
      }

      res.json({
        success: true,
        data: dataBlock,
      });
    } catch (error: any) {
      console.error('Error fetching data block:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch data block',
      });
    }
  });

  /**
   * GET /api/datablocks/object/:objectId
   * Récupère tous les data blocks d'un objet
   */
  router.get('/object/:objectId', async (req: Request, res: Response) => {
    try {
      const { objectId } = req.params;
      const dataBlocks = await storage.getDataBlocksByObject(objectId);

      res.json({
        success: true,
        data: dataBlocks,
        count: dataBlocks.length,
      });
    } catch (error: any) {
      console.error('Error fetching data blocks for object:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch data blocks for object',
      });
    }
  });

  return router;
}
