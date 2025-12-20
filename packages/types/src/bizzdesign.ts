/**
 * Types pour l'intégration avec l'API BizzDesign v3
 */

export interface BizzDesignConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  repositoryId: string;
}

export interface BizzDesignToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface Repository {
  id: string;
  name: string;
  description?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Structure de nom multilingue retournée par l'API BizzDesign
 */
export interface ObjectName {
  [languageCode: string]: string; // ex: { "en": "Bizzdesign", "fr": "Bizzdesign" }
}

/**
 * Document (data block) attaché à un objet
 */
export interface ObjectDocument {
  objectId: string;
  schemaNamespace: string;
  schemaName: string;
  values: Record<string, any>;
  updatedAt: string;
}

/**
 * Alias pour DataBlock (même structure que ObjectDocument)
 */
export type DataBlock = ObjectDocument;

/**
 * Data Block Definition (schéma d'un data block)
 */
export interface DataBlockDefinition {
  namespace: string;
  name: string;
  label?: string;
  fields: DataBlockField[];
  schemas?: DataBlockSchemaDefinition[];
  types: string[]; // Types d'objets applicables
  createdAt?: string;
  updatedAt?: string;
  publishedForRepository?: number;
}

export interface DataBlockField {
  name: string;
  schema: string; // "string", "number", "money", etc.
  label?: string;
  constraints?: {
    currency?: string;
    [key: string]: any;
  };
}

export type DataBlockSchemaDefinition = 
  | EnumSchemaDefinition 
  | ReferenceSchemaDefinition 
  | ListSchemaDefinition;

export interface EnumSchemaDefinition {
  kind: 'enum';
  name: string;
  literals: Array<{ name: string; label?: string }>;
}

export interface ReferenceSchemaDefinition {
  kind: 'reference';
  name: string;
  types: string[];
}

export interface ListSchemaDefinition {
  kind: 'list';
  name: string;
  elementSchema: string;
}

/**
 * Objet retourné par l'API BizzDesign
 */
export interface BizzDesignObject {
  id: string;
  externalId?: string;
  type: string; // ex: "ArchiMate:ApplicationComponent"
  objectName?: ObjectName; // Nom multilingue : { "en": "Bizzdesign" }
  name?: string; // Nom simple (fallback ou alternative)
  description?: string;
  documents?: ObjectDocument[]; // Data blocks attachés
  properties?: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, any>;
  metrics?: Record<string, any>;
  profiles?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  updatedAtAggregated?: string;
}

/**
 * Relation retournée par l'API BizzDesign
 */
export interface BizzDesignRelation {
  relationId: string;
  externalId?: string;
  relationType: string; // ex: "ArchiMate:TriggeringRelation"
  relationName?: ObjectName; // Nom multilingue de la relation
  fromId: string;
  fromExternalId?: string;
  fromType: string;
  fromName?: ObjectName;
  toId: string;
  toExternalId?: string;
  toType: string;
  toName?: ObjectName;
  updatedAt: string;
}

/**
 * Relation normalisée pour notre modèle interne
 */
export interface Relationship {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  repositoryId: string;
  objectsCount: number;
  relationshipsCount: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors?: string[];
}

