import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';

export function createMetricsRouter(storage: Neo4jStorage): Router {
  const router = Router();

  /**
   * GET /api/metrics
   * Récupère toutes les métriques du repository avec filtres optionnels
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
        objectType?: string;
        objectId?: string;
      } = {};

      if (req.query.objectType) {
        filters.objectType = req.query.objectType as string;
      }

      if (req.query.objectId) {
        filters.objectId = req.query.objectId as string;
      }

      const metrics = await storage.getAllMetrics(repositoryId, filters);

      res.json({
        success: true,
        data: metrics,
        count: metrics.length,
      });
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch metrics',
      });
    }
  });

  /**
   * GET /api/metrics/by-type
   * Récupère toutes les métriques agrégées par type d'objet
   */
  router.get('/by-type', async (req: Request, res: Response) => {
    try {
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        return res.json({
          success: true,
          data: {},
        });
      }

      const metricsByType = await storage.getMetricsByType(repositoryId);

      res.json({
        success: true,
        data: metricsByType,
        types: Object.keys(metricsByType),
        totalTypes: Object.keys(metricsByType).length,
        totalObjects: Object.values(metricsByType).reduce((sum, arr) => sum + arr.length, 0),
      });
    } catch (error: any) {
      console.error('Error fetching metrics by type:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch metrics by type',
      });
    }
  });

  /**
   * GET /api/metrics/object/:objectId
   * Récupère les métriques d'un objet spécifique
   */
  router.get('/object/:objectId', async (req: Request, res: Response) => {
    try {
      const { objectId } = req.params;
      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'repositoryId is required',
        });
      }

      const metrics = await storage.getAllMetrics(repositoryId, { objectId });

      if (metrics.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Metrics not found for this object',
        });
      }

      res.json({
        success: true,
        data: metrics[0],
      });
    } catch (error: any) {
      console.error('Error fetching metrics for object:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch metrics for object',
      });
    }
  });

  return router;
}




