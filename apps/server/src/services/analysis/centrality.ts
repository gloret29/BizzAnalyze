import type { Neo4jClient } from '@bizzanalyze/database';
import { int } from 'neo4j-driver';

export interface CentralityResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  score: number;
}

export class CentralityAnalyzer {
  constructor(private client: Neo4jClient) {}

  /**
   * Calcule la centralité de degré (nombre de connexions)
   */
  async calculateDegreeCentrality(repositoryId: string): Promise<CentralityResult[]> {
    const query = `
      MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
      OPTIONAL MATCH (o)-[rel1:RELATES_TO]->(:Object)
      OPTIONAL MATCH (:Object)-[rel2:RELATES_TO]->(o)
      WITH o, 
           size(collect(DISTINCT rel1)) + size(collect(DISTINCT rel2)) as degree
      RETURN o.id as nodeId,
             coalesce(o.displayName, o.name, o.objectName, o.id) as nodeName,
             o.type as nodeType,
             degree as score
      ORDER BY degree DESC
      LIMIT 100
    `;

    const result = await this.client.executeQuery(query, { repositoryId });
    return result.map((record: any) => ({
      nodeId: record.nodeId,
      nodeName: record.nodeName || record.nodeId,
      nodeType: record.nodeType || '',
      score: typeof record.score === 'number' ? record.score : parseInt(String(record.score), 10) || 0,
    }));
  }

  /**
   * Calcule le PageRank (simplifié)
   */
  async calculatePageRank(repositoryId: string, iterations: number = 20): Promise<CentralityResult[]> {
    // Note: Neo4j GDS (Graph Data Science) serait idéal ici, mais pour l'instant
    // on utilise un algorithme simplifié basé sur les connexions
    const query = `
      MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(o:Object)
      OPTIONAL MATCH (o)-[:RELATES_TO]->(outgoing:Object)
      OPTIONAL MATCH (incoming:Object)-[:RELATES_TO]->(o)
      WITH o, 
           size(collect(DISTINCT outgoing)) as outDegree,
           size(collect(DISTINCT incoming)) as inDegree
      WITH o, 
           outDegree + inDegree as totalDegree,
           inDegree * 1.5 + outDegree as weightedScore
      RETURN o.id as nodeId,
             coalesce(o.displayName, o.name, o.objectName, o.id) as nodeName,
             o.type as nodeType,
             weightedScore as score
      ORDER BY weightedScore DESC
      LIMIT 100
    `;

    const result = await this.client.executeQuery(query, { repositoryId });
    return result.map((record: any) => ({
      nodeId: record.nodeId,
      nodeName: record.nodeName || record.nodeId,
      nodeType: record.nodeType || '',
      score: typeof record.score === 'number' ? record.score : parseFloat(String(record.score)) || 0,
    }));
  }
}

























