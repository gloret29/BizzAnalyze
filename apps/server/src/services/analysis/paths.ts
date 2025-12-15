import type { Neo4jClient } from '@bizzanalyze/database';

export interface PathResult {
  path: string[];
  length: number;
  nodes: Array<{ id: string; name: string; type: string }>;
}

export class PathAnalyzer {
  constructor(private client: Neo4jClient) {}

  /**
   * Trouve le plus court chemin entre deux nœuds
   */
  async findShortestPath(
    repositoryId: string,
    sourceId: string,
    targetId: string,
    maxDepth: number = 10
  ): Promise<PathResult | null> {
    const query = `
      MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(source:Object {id: $sourceId})
      MATCH (r)-[:CONTAINS]->(target:Object {id: $targetId})
      MATCH path = shortestPath((source)-[:RELATES_TO*1..${maxDepth}]->(target))
      WHERE ALL(node IN nodes(path) WHERE (r)-[:CONTAINS]->(node))
      RETURN path
      LIMIT 1
    `;

    const result = await this.client.executeQuery(query, { repositoryId, sourceId, targetId });

    if (result.length === 0) {
      return null;
    }

    const path = result[0].path;
    const pathNodes = path.nodes || [];
    const pathRels = path.relationships || [];

    return {
      path: pathNodes.map((node: any) => node.id),
      length: pathRels.length,
      nodes: pathNodes.map((node: any) => ({
        id: node.id,
        name: node.displayName || node.name || node.objectName || node.id,
        type: node.type || '',
      })),
    };
  }

  /**
   * Trouve tous les chemins entre deux nœuds (limité)
   */
  async findAllPaths(
    repositoryId: string,
    sourceId: string,
    targetId: string,
    maxDepth: number = 5,
    limit: number = 50
  ): Promise<PathResult[]> {
    const query = `
      MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(source:Object {id: $sourceId})
      MATCH (r)-[:CONTAINS]->(target:Object {id: $targetId})
      MATCH path = (source)-[:RELATES_TO*1..${maxDepth}]->(target)
      WHERE ALL(node IN nodes(path) WHERE (r)-[:CONTAINS]->(node))
      WITH path, length(path) as pathLength
      ORDER BY pathLength
      LIMIT $limit
      RETURN path
    `;

    const result = await this.client.executeQuery(query, {
      repositoryId,
      sourceId,
      targetId,
      limit: limit,
    });

    return result.map((record: any) => {
      const path = record.path;
      const pathNodes = path.nodes || [];
      const pathRels = path.relationships || [];

      return {
        path: pathNodes.map((node: any) => node.id),
        length: pathRels.length,
        nodes: pathNodes.map((node: any) => ({
          id: node.id,
          name: node.displayName || node.name || node.objectName || node.id,
          type: node.type || '',
        })),
      };
    });
  }
}







