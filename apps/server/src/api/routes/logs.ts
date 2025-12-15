import { Router, Request, Response } from 'express';
import { bizzDesignLogger } from '../../services/bizzdesign/logger';

export function createLogsRouter(): Router {
  const router = Router();

  /**
   * GET /api/logs/bizzdesign
   * Récupère les logs des appels API BizzDesign
   */
  router.get('/bizzdesign', (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = bizzDesignLogger.getRecentLogs(limit);

      // Sérialiser les logs pour l'API (convertir les dates en strings)
      const serializedLogs = logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      }));

      res.json({
        success: true,
        data: serializedLogs,
      });
    } catch (error: any) {
      console.error('Get logs error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}

