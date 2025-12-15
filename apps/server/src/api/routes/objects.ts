import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';

export function createObjectsRouter(storage: Neo4jStorage): Router {
  const router = Router();

  /**
   * GET /api/objects
   * Liste les objets avec pagination et filtres
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const page = Math.max(0, parseInt(req.query.page as string) || 0);
      const pageSize = Math.max(1, Math.min(1000, parseInt(req.query.pageSize as string) || 50));
      const type = req.query.type as string;
      const search = req.query.search as string;
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        // Retourner une liste vide si aucun repository n'est sélectionné
        return res.json({
          success: true,
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }

      try {
        const { objects, total } = await storage.getObjects(
          repositoryId,
          page,
          pageSize,
          { type, search }
        );

        res.json({
          success: true,
          data: objects,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      } catch (storageError: any) {
        // Si le repository n'existe pas dans Neo4j, retourner une liste vide
        console.warn(`Objects not found for repository ${repositoryId}:`, storageError.message);
        res.json({
          success: true,
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }
    } catch (error: any) {
      console.error('Get objects error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/objects/:id
   * Récupère les détails d'un objet
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`[GET /api/objects/:id] Récupération de l'objet ${id}`);
      
      const object = await storage.getObjectById(id);

      if (!object) {
        console.log(`[GET /api/objects/:id] Objet ${id} non trouvé`);
        return res.status(404).json({
          success: false,
          error: 'Object not found',
        });
      }

      console.log(`[GET /api/objects/:id] Objet ${id} trouvé:`, {
        id: object.id,
        type: object.type,
        name: object.name,
        hasRelationships: !!(object.relationships?.outgoing?.length || object.relationships?.incoming?.length),
      });

      res.json({
        success: true,
        data: object,
      });
    } catch (error: any) {
      console.error(`[GET /api/objects/:id] Erreur pour l'objet ${req.params.id}:`, error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}

