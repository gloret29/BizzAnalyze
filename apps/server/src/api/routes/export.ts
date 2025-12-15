import { Router, Request, Response } from 'express';
import type { Neo4jStorage } from '../../services/neo4j/storage';
import { getConfigStore } from '../../services/config/configStore';
import type { ExportRequest, ObjectQuery } from '@bizzanalyze/types';
import { int } from 'neo4j-driver';

export function createExportRouter(storage: Neo4jStorage): Router {
  const router = Router();

  /**
   * POST /api/export
   * Exporte les données dans différents formats
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const exportRequest: ExportRequest = req.body;
      const { format, filters, includeRelationships } = exportRequest;

      const configStore = getConfigStore();
      const repositoryId =
        (req.query.repositoryId as string) || configStore.getConfig().bizzdesign.repositoryId;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'Repository ID is required',
        });
      }

      // Récupérer les données selon les filtres
      const pageSize = 10000; // Limite élevée pour l'export
      let allObjects: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { objects, total } = await storage.getObjects(
          repositoryId,
          page,
          pageSize,
          {
            type: filters?.type,
            search: filters?.search,
          }
        );

        allObjects = allObjects.concat(objects);

        if (objects.length < pageSize || allObjects.length >= total) {
          hasMore = false;
        } else {
          page++;
        }

        // Limite de sécurité pour éviter les exports trop volumineux
        if (allObjects.length >= 50000) {
          break;
        }
      }

      // Récupérer les relations si demandé
      let relationships: any[] = [];
      if (includeRelationships) {
        relationships = await storage.getRelationshipsForExport(repositoryId, filters);
      }

      // Générer le fichier selon le format
      const includeRelationshipsFlag = includeRelationships ?? false;
      switch (format) {
        case 'csv':
          return exportCSV(res, allObjects, relationships, includeRelationshipsFlag);
        case 'json':
          return exportJSON(res, allObjects, relationships, includeRelationshipsFlag);
        case 'excel':
          return exportExcel(res, allObjects, relationships, includeRelationshipsFlag);
        default:
          return res.status(400).json({
            success: false,
            error: `Format ${format} not supported yet`,
          });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}

/**
 * Export CSV
 */
function exportCSV(
  res: Response,
  objects: any[],
  relationships: any[],
  includeRelationships: boolean
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `bizzanalyze-export-${timestamp}.csv`;

  // Générer le CSV
  const headers = ['ID', 'Type', 'Name', 'Description', 'Category', 'SubCategory'];
  const rows = objects.map((obj) => [
    obj.id || '',
    obj.type || '',
    obj.name || obj.objectName || '',
    obj.description || '',
    obj.category || '',
    obj.subCategory || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csvContent); // BOM pour Excel
}

/**
 * Export JSON
 */
function exportJSON(
  res: Response,
  objects: any[],
  relationships: any[],
  includeRelationships: boolean
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `bizzanalyze-export-${timestamp}.json`;

  const exportData: any = {
    exportedAt: new Date().toISOString(),
    objects,
  };

  if (includeRelationships) {
    exportData.relationships = relationships;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(exportData);
}

/**
 * Export Excel (fallback vers CSV pour l'instant)
 */
function exportExcel(
  res: Response,
  objects: any[],
  relationships: any[],
  includeRelationships: boolean
) {
  // Pour l'instant, on retourne un CSV
  // L'export Excel réel nécessitera la bibliothèque xlsx
  console.warn('Excel export requested, falling back to CSV. Install xlsx package for full Excel support.');
  return exportCSV(res, objects, relationships, includeRelationships);
}





