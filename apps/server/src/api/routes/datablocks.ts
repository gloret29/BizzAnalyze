import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';
import { BizzDesignClient } from '../../services/bizzdesign/client';

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

  /**
   * GET /api/datablocks/all
   * Récupère tous les data blocks du repository (depuis Neo4j)
   */
  router.get('/all', async (req: Request, res: Response) => {
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

      // Récupérer tous les data blocks sans filtres
      const dataBlocks = await storage.getDataBlocks(repositoryId);

      res.json({
        success: true,
        data: dataBlocks,
        count: dataBlocks.length,
      });
    } catch (error: any) {
      console.error('Error fetching all data blocks:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch all data blocks',
      });
    }
  });

  /**
   * GET /api/datablocks/from-api
   * Récupère tous les data blocks directement depuis l'API BizzDesign
   */
  router.get('/from-api', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const config = configStore.getConfig().bizzdesign;
      const repositoryId =
        (req.query.repositoryId as string) || config.repositoryId;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'repositoryId is required',
        });
      }

      const client = new BizzDesignClient(config);
      const repoIdNum = parseInt(repositoryId);
      
      if (isNaN(repoIdNum)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid repositoryId',
        });
      }

      const dataBlocks = await client.getAllDataBlocks(repoIdNum, (current, total) => {
        // Log de progression optionnel
        if (current % 100 === 0 || current === total) {
          console.log(`[API] Récupération des data blocks: ${current}/${total || '?'}`);
        }
      });

      res.json({
        success: true,
        data: dataBlocks,
        count: dataBlocks.length,
      });
    } catch (error: any) {
      console.error('Error fetching data blocks from API:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch data blocks from API',
      });
    }
  });

  /**
   * GET /api/datablocks/definitions
   * Récupère toutes les data block definitions du repository depuis l'API BizzDesign
   */
  router.get('/definitions', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const config = configStore.getConfig().bizzdesign;
      const repositoryId =
        (req.query.repositoryId as string) || config.repositoryId;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'repositoryId is required',
        });
      }

      const client = new BizzDesignClient(config);
      const repoIdNum = parseInt(repositoryId);
      
      if (isNaN(repoIdNum)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid repositoryId',
        });
      }

      const definitions = await client.getAllDataBlockDefinitions(repoIdNum, (offset: number, current: number) => {
        // Log de progression optionnel
        if (current % 10 === 0) {
          console.log(`[API] Récupération des définitions: ${current} récupérées`);
        }
      });

      res.json({
        success: true,
        data: definitions,
        count: definitions.length,
      });
    } catch (error: any) {
      console.error('Error fetching data block definitions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch data block definitions',
      });
    }
  });

  return router;
}






