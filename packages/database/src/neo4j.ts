import neo4j, { Driver, Session, Transaction } from 'neo4j-driver';
import type { Neo4jConfig } from '@bizzanalyze/types';

/**
 * Client Neo4j pour BizzAnalyze
 */
export class Neo4jClient {
  private driver: Driver;
  private config: Neo4jConfig;

  constructor(config: Neo4jConfig) {
    this.config = config;
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password)
    );
  }

  /**
   * Vérifie la connexion à Neo4j
   */
  async verifyConnectivity(): Promise<boolean> {
    try {
      await this.driver.verifyConnectivity();
      return true;
    } catch (error) {
      console.error('Neo4j connection error:', error);
      return false;
    }
  }

  /**
   * Exécute une requête Cypher
   */
  async executeQuery<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const session = this.driver.session({
      database: this.config.database || 'neo4j',
    });

    try {
      const result = await session.run(query, parameters);
      return result.records.map((record) => record.toObject() as T);
    } catch (error) {
      console.error('Neo4j query error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Exécute une requête dans une transaction
   */
  async executeTransaction<T = any>(
    callback: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const session = this.driver.session({
      database: this.config.database || 'neo4j',
    });

    const tx = session.beginTransaction();

    try {
      const result = await callback(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      console.error('Neo4j transaction error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Obtient une session Neo4j
   */
  getSession(): Session {
    return this.driver.session({
      database: this.config.database || 'neo4j',
    });
  }

  /**
   * Ferme la connexion
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}

/**
 * Crée une instance du client Neo4j
 */
export function createNeo4jClient(config: Neo4jConfig): Neo4jClient {
  return new Neo4jClient(config);
}
