import express, { Express } from 'express';
import cors from 'cors';
import { createSyncRouter } from './routes/sync';
import { createImportRouter } from './routes/import';
import { createObjectsRouter } from './routes/objects';
import { createStatsRouter } from './routes/stats';
import { createConfigRouter } from './routes/config';
import { createLogsRouter } from './routes/logs';
import { createProgressRouter } from './routes/progress';
import { createGraphRouter } from './routes/graph';
import { createExportRouter } from './routes/export';
import { createAnalyzeRouter } from './routes/analyze';
import { createDataBlocksRouter } from './routes/datablocks';
import type { Neo4jStorage } from '../services/neo4j/storage';

export function createApi(
  storage: Neo4jStorage
): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check (accessible via / et /api)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/config', createConfigRouter());
  app.use('/api/sync', createSyncRouter());
  app.use('/api/import', createImportRouter(storage));
  app.use('/api/objects', createObjectsRouter(storage));
  app.use('/api/datablocks', createDataBlocksRouter(storage));
  app.use('/api/stats', createStatsRouter(storage));
  app.use('/api/logs', createLogsRouter());
  app.use('/api/progress', createProgressRouter());
  app.use('/api/graph', createGraphRouter(storage));
  app.use('/api/export', createExportRouter(storage));
  app.use('/api/analyze', createAnalyzeRouter(storage));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

