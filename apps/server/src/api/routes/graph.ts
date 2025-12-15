import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';
import { int } from 'neo4j-driver';

export function createGraphRouter(storage: Neo4jStorage): Router {
  const router = Router();

  /**
   * GET /api/graph
   * Récupère les données du graphe pour visualisation
   * Query params:
   * - limit: nombre maximum de nœuds (défaut: 500)
   * - type: filtrer par type d'objet
   * - search: recherche textuelle
   * - repositoryId: ID du repository
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      console.log('[GRAPH API] GET /api/graph - Début');
      console.log('[GRAPH API] Query params:', req.query);
      
      const configStore = getConfigStore();
      const config = configStore.getConfig();
      console.log('[GRAPH API] Config bizzdesign:', config.bizzdesign);
      
      const repositoryId =
        (req.query.repositoryId as string) || config.bizzdesign.repositoryId;
      
      console.log('[GRAPH API] RepositoryId utilisé:', repositoryId);

      if (!repositoryId) {
        console.log('[GRAPH API] Aucun repositoryId - retourne données vides');
        return res.json({
          success: true,
          data: {
            nodes: [],
            edges: [],
          },
        });
      }

      const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 500));
      const type = req.query.type as string | undefined;
      const search = req.query.search as string | undefined;
      const nodeId = req.query.nodeId as string | undefined;

      // Si un nodeId est spécifié, récupérer seulement ce nœud et ses voisins
      if (nodeId) {
        console.log('[GRAPH API] Mode nodeId - récupération des voisins de:', nodeId);
        const graphData = await storage.getNodeWithNeighbors(repositoryId, nodeId, limit);
        console.log('[GRAPH API] Résultat nodeId:', { nodes: graphData.nodes.length, edges: graphData.edges.length });
        return res.json({
          success: true,
          data: graphData,
        });
      }

      // Sinon, récupérer un échantillon du graphe
      console.log('[GRAPH API] Mode sample - récupération avec filters:', { type, search, limit });
      const graphData = await storage.getGraphSample(repositoryId, limit, { type, search });
      console.log('[GRAPH API] Résultat sample:', { nodes: graphData.nodes.length, edges: graphData.edges.length });
      
      if (graphData.nodes.length > 0) {
        console.log('[GRAPH API] Premier nœud:', graphData.nodes[0]);
      }
      if (graphData.edges.length > 0) {
        console.log('[GRAPH API] Première edge:', graphData.edges[0]);
      }

      res.json({
        success: true,
        data: graphData,
      });
    } catch (error: any) {
      console.error('[GRAPH API] Erreur:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/graph/neighbors/:id
   * Récupère les voisins d'un nœud spécifique
   */
  router.get('/neighbors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'Repository ID is required',
        });
      }

      const depth = Math.min(2, Math.max(1, parseInt(req.query.depth as string) || 1));
      const graphData = await storage.getNodeNeighbors(repositoryId, id, depth);

      res.json({
        success: true,
        data: graphData,
      });
    } catch (error: any) {
      console.error('Get neighbors error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}






