/**
 * Types pour Neo4j
 */

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  database?: string;
}

export interface Neo4jNode {
  identity: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface Neo4jRelationship {
  identity: string;
  start: string;
  end: string;
  type: string;
  properties: Record<string, any>;
}

export interface Neo4jQueryResult {
  records: Array<{
    keys: string[];
    values: any[];
    toObject(): Record<string, any>;
  }>;
  summary: {
    query: {
      text: string;
      parameters: Record<string, any>;
    };
    queryType: string;
    counters: {
      nodesCreated?: number;
      nodesDeleted?: number;
      relationshipsCreated?: number;
      relationshipsDeleted?: number;
    };
  };
}

export interface GraphObject {
  id: string;
  type: string;
  name: string;
  description?: string;
  properties?: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GraphRelationship {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}











