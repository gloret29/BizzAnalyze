/**
 * Types pour l'API REST
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncRequest {
  repositoryId?: string;
  incremental?: boolean;
}

export interface ObjectQuery {
  page?: number;
  pageSize?: number;
  type?: string;
  search?: string;
  tags?: string[];
}

export interface AnalysisRequest {
  type: 'centrality' | 'communities' | 'paths' | 'cycles' | 'dependencies';
  parameters?: Record<string, any>;
}

export interface AnalysisResult {
  id: string;
  type: string;
  parameters: Record<string, any>;
  result: any;
  createdAt: Date;
  duration: number;
}

export interface ExportRequest {
  format: 'csv' | 'json' | 'excel' | 'pdf' | 'graphml';
  filters?: ObjectQuery;
  includeRelationships?: boolean;
}

export interface StatsResponse {
  totalObjects: number;
  totalRelationships: number;
  objectsByType: Record<string, number>;
  lastSync?: Date;
  repositoryId?: string;
}

