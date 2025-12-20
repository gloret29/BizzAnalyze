import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';
import { CentralityAnalyzer } from '../../services/analysis/centrality';
import { PathAnalyzer } from '../../services/analysis/paths';
import { createNeo4jClient } from '@bizzanalyze/database';

export function createAnalyzeRouter(storage: Neo4jStorage): Router {
  const router = Router();

  // Créer les analyseurs
  const getAnalyzerClient = () => {
    const configStore = getConfigStore();
    const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const neo4jUser = process.env.NEO4J_USER || 'neo4j';
    const neo4jPassword = process.env.NEO4J_PASSWORD || 'bizzanalyze';

    return createNeo4jClient({
      uri: neo4jUri,
      user: neo4jUser,
      password: neo4jPassword,
    });
  };

  /**
   * GET /api/analyze/centrality
   * Calcule la centralité (degree ou pagerank)
   */
  router.get('/centrality', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'Repository ID is required',
        });
      }

      const type = (req.query.type as string) || 'degree';
      const analyzer = new CentralityAnalyzer(getAnalyzerClient());

      let results;
      if (type === 'pagerank') {
        results = await analyzer.calculatePageRank(repositoryId);
      } else {
        results = await analyzer.calculateDegreeCentrality(repositoryId);
      }

      res.json({
        success: true,
        data: {
          type,
          results,
        },
      });
    } catch (error: any) {
      console.error('Centrality analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/analyze/paths
   * Trouve les chemins entre deux nœuds
   */
  router.get('/paths', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      const sourceId = req.query.sourceId as string;
      const targetId = req.query.targetId as string;
      const maxDepth = parseInt(req.query.maxDepth as string) || 10;
      const findAll = req.query.findAll === 'true';

      if (!repositoryId || !sourceId || !targetId) {
        return res.status(400).json({
          success: false,
          error: 'Repository ID, sourceId, and targetId are required',
        });
      }

      const analyzer = new PathAnalyzer(getAnalyzerClient());

      if (findAll) {
        const results = await analyzer.findAllPaths(repositoryId, sourceId, targetId, maxDepth);
        res.json({
          success: true,
          data: {
            sourceId,
            targetId,
            paths: results,
          },
        });
      } else {
        const result = await analyzer.findShortestPath(repositoryId, sourceId, targetId, maxDepth);
        res.json({
          success: true,
          data: {
            sourceId,
            targetId,
            path: result,
          },
        });
      }
    } catch (error: any) {
      console.error('Path analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}


















