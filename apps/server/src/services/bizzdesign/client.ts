import axios, { AxiosInstance } from 'axios';
import type {
  BizzDesignConfig,
  BizzDesignToken,
  Repository,
  BizzDesignObject,
  BizzDesignRelation,
  Relationship,
  DataBlock,
  DataBlockDefinition,
} from '@bizzanalyze/types';
import { retry, delay } from '@bizzanalyze/utils';
import { bizzDesignLogger } from './logger';
import { TokenStore } from './tokenStore';

/**
 * Vérifie si un objet est en fait une relation (basé sur son type)
 * Les relations dans BizzDesign ont généralement des types qui contiennent "Relation"
 */
function isRelationType(type: string): boolean {
  // Les types de relations contiennent généralement "Relation" dans leur nom
  // ex: "ArchiMate:UseRelation", "ArchiMate:AggregationRelation", etc.
  return /Relation/i.test(type);
}

/**
 * Client pour l'API BizzDesign v3
 */
export class BizzDesignClient {
  private axiosInstance: AxiosInstance;
  private config: BizzDesignConfig;
  private token: BizzDesignToken | null = null;

  constructor(config: BizzDesignConfig) {
    this.config = config;
    // S'assurer que l'URL se termine par /api/3.0
    const baseURL = config.apiUrl.endsWith('/api/3.0')
      ? config.apiUrl
      : config.apiUrl.replace(/\/$/, '') + '/api/3.0';
    
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
    });

    // Charger le token sauvegardé au démarrage pour cette URL
    const savedToken = TokenStore.loadToken(config.apiUrl);
    if (savedToken) {
      this.token = savedToken;
      console.log('✓ Token BizzDesign chargé depuis le stockage');
    }
  }

  /**
   * Obtient un token OAuth2
   * Réutilise le token sauvegardé s'il est encore valide
   */
  async getToken(): Promise<string> {
    // Vérifier si le token en mémoire est valide
    if (this.token && this.token.expires_at) {
      const expiresAt = new Date(this.token.expires_at);
      const now = new Date();
      
      // Si le token expire dans plus de 60 secondes, le réutiliser
      if (expiresAt.getTime() - now.getTime() > 60000) {
        return this.token.access_token;
      }
    }

      // Essayer de charger un token sauvegardé pour cette URL
      const savedToken = TokenStore.loadToken(this.config.apiUrl);
      if (savedToken) {
        this.token = savedToken;
        const expiresAt = new Date(savedToken.expires_at!);
        const now = new Date();
        
        // Vérifier que le token sauvegardé est encore valide
        if (expiresAt.getTime() - now.getTime() > 60000) {
          console.log('✓ Token réutilisé depuis le stockage');
          return this.token.access_token;
        }
      }

    // Obtenir un nouveau token
    console.log('🔄 Génération d\'un nouveau token OAuth2...');
    const oauthUrl = this.config.apiUrl.replace('/api/3.0', '') + '/oauth/token';
    
    try {
      const response = await axios.post(
        oauthUrl,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const expiresIn = response.data.expires_in || 3600;
      const newToken: BizzDesignToken = {
        ...response.data,
        expires_at: new Date(Date.now() + expiresIn * 1000),
      };
      
      this.token = newToken;

      // Sauvegarder le token pour cette URL
      TokenStore.saveToken(this.config.apiUrl, newToken);
      console.log(`✓ Nouveau token obtenu (expire dans ${expiresIn}s)`);

      return newToken.access_token;
    } catch (error: any) {
      console.error('Error getting BizzDesign token:', error.message);
      // Si l'erreur est liée à l'authentification, supprimer le token invalide
      if (error.response?.status === 401 || error.response?.status === 403) {
        TokenStore.clearToken(this.config.apiUrl);
        this.token = null;
      }
      throw new Error(`Failed to get BizzDesign token: ${error.message}`);
    }
  }

  /**
   * Effectue une requête authentifiée
   */
  private async request<T>(config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    const startTime = new Date();
    const fullUrl = `${this.axiosInstance.defaults.baseURL}${config.url}`;
    const log = bizzDesignLogger.logCall(config.method, fullUrl, startTime, config.params, config.data);

    // Log détaillé des paramètres et body de requête
    const paramsStr = config.params 
      ? Object.entries(config.params).map(([k, v]) => `${k}=${v}`).join(', ')
      : 'none';
    
    const bodyStr = config.data 
      ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data))
      : 'none';
    
    console.log(`📤 [API] ${config.method} ${config.url} | params: ${paramsStr}${config.data ? ` | body: ${bodyStr}` : ''}`);
    
    // Le curl sera mis à jour après avoir obtenu le token

    return retry(
      async () => {
        const token = await this.getToken();
        
        // Mettre à jour le curl avec le token réel
        bizzDesignLogger.updateCurl(log, token);
        
        const response = await this.axiosInstance.request<T>({
          ...config,
          headers: {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        });
        
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        bizzDesignLogger.logSuccess(log, response.status, endTime);
        
        // Log de la réponse
        const itemsCount = (response.data as any)?._items?.length;
        if (itemsCount !== undefined) {
          console.log(`📥 [API] ${config.method} ${config.url} | status: ${response.status} | items: ${itemsCount} | duration: ${duration}ms`);
        } else {
          console.log(`📥 [API] ${config.method} ${config.url} | status: ${response.status} | duration: ${duration}ms`);
        }
        
        return response.data;
      },
      {
        retries: 3,
        delay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
        onRetry: (error, attempt) => {
          console.warn(`BizzDesign API retry ${attempt}:`, error.message);
        },
      }
    ).catch((error) => {
      const endTime = new Date();
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      bizzDesignLogger.logError(log, errorMessage, endTime);
      throw error;
    });
  }

  /**
   * Récupère la liste des repositories disponibles
   */
  async getRepositories(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response = await this.request<{
        _items: Array<{ id: number; name: string }>;
        _offset: number;
        _limit: number;
      }>({
        method: 'GET',
        url: '/repositories',
        params: {
          limit: 1000, // Récupérer tous les repositories
        },
      });

      return response._items || [];
    } catch (error: any) {
      console.error('Error fetching repositories:', error.message);
      throw new Error(`Erreur lors de la récupération des repositories: ${error.message}`);
    }
  }

  /**
   * Récupère la liste des repositories
   * Utilise GET /repositories
   */
  async getRepositoriesList(filterId?: number): Promise<Repository[]> {
    try {
      // Utiliser GET /repositories
      const response = await this.request<{
        _items: Array<{
          id: number;
          name: string;
          masterCollaborationName?: string;
          description?: string;
          [key: string]: any;
        }>;
        _offset: number;
        _limit: number;
      }>({
        method: 'GET',
        url: '/repositories',
        params: {
          limit: 1000,
        },
      });

      // Convertir les repositories
      const repositories: Repository[] = (response._items || [])
        .filter((repo) => {
          // Si un filterId est spécifié, ne prendre que ce repository
          if (filterId !== undefined) {
            return repo.id === filterId;
          }
          return true;
        })
        .map((repo) => ({
          id: repo.id.toString(),
          name: repo.masterCollaborationName || repo.name || `Repository ${repo.id}`,
          description: repo.description,
        }));

      return repositories;
    } catch (error: any) {
      console.error('Error fetching repositories:', error.message);
      throw new Error(`Erreur lors de la récupération des repositories: ${error.message}`);
    }
  }

  /**
   * Récupère les informations d'un repository
   */
  async getRepository(repositoryId: number): Promise<Repository> {
    const repositories = await this.getRepositoriesList(repositoryId);
    const found = repositories.find((r) => r.id === repositoryId.toString());
    
    if (!found) {
      throw new Error(`Repository ${repositoryId} non trouvé`);
    }
    
    return found;
  }

  /**
   * Récupère les informations d'un repository par son ID (string)
   */
  async getRepositoryById(repositoryId: string): Promise<Repository> {
    const repositories = await this.getRepositoriesList();
    const found = repositories.find((r) => r.id === repositoryId);
    
    if (!found) {
      throw new Error(`Repository ${repositoryId} non trouvé`);
    }
    
    return found;
  }

  /**
   * Récupère les objets d'un repository avec pagination
   * L'API utilise offset et limit pour la pagination
   */
  async getObjects(
    repositoryId: number,
    offset: number = 0,
    limit: number = 10000,
    options?: {
      includeMetrics?: boolean;
      includeProfiles?: boolean;
      includeExternalIds?: boolean;
    }
  ): Promise<{ items: BizzDesignObject[]; hasMore: boolean; total?: number }> {
    const params: Record<string, any> = {
      offset: offset,
      limit: limit,
    };

    if (options?.includeMetrics) {
      params.includeMetrics = true;
    }

    if (options?.includeProfiles) {
      params.includeProfiles = true;
    }

    if (options?.includeExternalIds) {
      params.includeExternalIds = true;
    }

    const response = await this.request<{
      _items: BizzDesignObject[];
      _offset: number;
      _limit: number;
    }>({
      method: 'GET',
      url: `/repositories/${repositoryId}/objects`,
      params,
    });

    const items = response._items || [];
    
    // Log pour debug - afficher la structure du premier objet
    if (items.length > 0) {
      const firstItem = items[0];
      console.log(`[getObjects] Exemple objet reçu - id: ${firstItem.id}, objectName:`, JSON.stringify(firstItem.objectName), 'type:', firstItem.type);
    }
    
    // Si on a récupéré moins d'items que la limite demandée, il n'y en a plus
    // Si on a récupéré exactement la limite, il y en a probablement plus
    const hasMore = items.length >= limit;

    return {
      items,
      hasMore,
      total: undefined, // L'API ne retourne pas toujours le total
    };
  }

  /**
   * Récupère tous les objets d'un repository (gestion automatique de la pagination)
   */
  async getAllObjects(
    repositoryId: number,
    onProgress?: (offset: number, current: number, total?: number) => void,
    options?: {
      includeMetrics?: boolean;
      includeProfiles?: boolean;
      includeExternalIds?: boolean;
    }
  ): Promise<BizzDesignObject[]> {
    const allObjects: BizzDesignObject[] = [];
    let offset = 0;
    let hasMore = true;
    const limit = 10000; // Limite maximale pour la pagination

    console.log(`\n📥 ========== RÉCUPÉRATION DES OBJETS ==========`);
    console.log(`📥 Repository: ${repositoryId} | Limit par page: ${limit}`);

    let filteredCount = 0;

    while (hasMore) {
      console.log(`\n📤 [PAGINATION] Requête avec offset=${offset}, limit=${limit}`);
      const response = await this.getObjects(repositoryId, offset, limit, options);
      const itemsCount = response.items.length;
      
      // Filtrer les objets qui sont en fait des relations
      // Les relations sont déjà récupérées via getAllRelationships()
      const filteredItems = response.items.filter((obj) => {
        const isRelation = isRelationType(obj.type);
        if (isRelation) {
          filteredCount++;
        }
        return !isRelation;
      });
      
      allObjects.push(...filteredItems);
      
      // Notifier la progression AVANT de mettre à jour hasMore
      if (onProgress) {
        onProgress(offset, allObjects.length, response.total);
      }

      console.log(`📊 [PAGINATION] Réponse: ${itemsCount} objets reçus (${filteredItems.length} après filtrage) | Total accumulé: ${allObjects.length} | hasMore: ${response.hasMore}`);

      const previousOffset = offset;
      // Incrémenter l'offset par le nombre d'items récupérés (pas par la limite)
      // Cela garantit qu'on ne saute aucun objet
      offset += itemsCount;
      console.log(`📊 [PAGINATION] Offset: ${previousOffset} → ${offset}`);
      
      // Si on a récupéré moins d'items que la limite, il n'y en a plus
      hasMore = response.hasMore && itemsCount > 0;

      // Rate limiting: attendre un peu entre les requêtes
      if (hasMore) {
        await delay(100);
      }
    }

    console.log(`✓ ${allObjects.length} objets récupérés au total (${filteredCount} objets-relations filtrés car déjà présents dans relationships.json)`);
    return allObjects;
  }

  /**
   * Récupère tous les data blocks d'un repository
   * Parcourt tous les objets et extrait leurs data blocks
   */
  async getAllDataBlocks(
    repositoryId: number,
    onProgress?: (current: number, total?: number) => void
  ): Promise<DataBlock[]> {
    console.log(`\n📦 ========== RÉCUPÉRATION DES DATA BLOCKS ==========`);
    console.log(`📦 Repository: ${repositoryId}`);

    // Récupérer tous les objets avec leurs data blocks (documents)
    const objects = await this.getAllObjects(repositoryId, undefined, {
      includeMetrics: false,
      includeProfiles: false,
      includeExternalIds: false,
    });

    const allDataBlocks: DataBlock[] = [];
    let processed = 0;

    for (const obj of objects) {
      if (obj.documents && obj.documents.length > 0) {
        obj.documents.forEach((doc) => {
          allDataBlocks.push({
            objectId: obj.id,
            schemaNamespace: doc.schemaNamespace,
            schemaName: doc.schemaName,
            values: doc.values,
            updatedAt: doc.updatedAt,
          });
        });
      }
      processed++;
      if (onProgress) {
        onProgress(processed, objects.length);
      }
    }

    console.log(`✓ ${allDataBlocks.length} data blocks récupérés au total`);
    return allDataBlocks;
  }

  /**
   * Récupère TOUTES les relations d'un repository
   * Utilise GET /repositories/{repositoryId}/relations
   */
  async getAllRelationships(repositoryId: number): Promise<Relationship[]> {
    console.log(`\n🔗 ========== RÉCUPÉRATION DES RELATIONS ==========`);
    console.log(`🔗 Repository: ${repositoryId}`);
    
    const allRelations: Relationship[] = [];
    let offset = 0;
    let hasMore = true;
    const limit = 10000; // Limite maximale pour la pagination

    while (hasMore) {
      console.log(`\n📤 [RELATIONS] Requête avec offset=${offset}, limit=${limit}`);
      
      const response = await this.request<{
        _items: BizzDesignRelation[];
        _offset: number;
        _limit: number;
      } | Array<{
        _items: BizzDesignRelation[];
        _offset: number;
        _limit: number;
      }>>({
        method: 'GET',
        url: `/repositories/${repositoryId}/relations`,
        params: {
          offset: offset,
          limit: limit,
        },
      });

      // Gérer le cas où la réponse est un tableau (comme dans l'exemple) ou un objet direct
      let items: BizzDesignRelation[] = [];
      if (Array.isArray(response)) {
        // Si c'est un tableau, extraire tous les _items de tous les éléments
        items = response.flatMap((item) => item._items || []);
      } else if (response && typeof response === 'object' && '_items' in response) {
        // Si c'est un objet direct avec _items
        items = response._items || [];
      }
      const itemsCount = items.length;
      
      // Mapper les relations de l'API vers notre structure interne
      const mappedRelations: Relationship[] = items.map((rel) => ({
        id: rel.relationId,
        type: rel.relationType,
        sourceId: rel.fromId,
        targetId: rel.toId,
        properties: {
          externalId: rel.externalId,
          relationName: rel.relationName,
          fromExternalId: rel.fromExternalId,
          fromType: rel.fromType,
          fromName: rel.fromName,
          toExternalId: rel.toExternalId,
          toType: rel.toType,
          toName: rel.toName,
        },
        metadata: {
          updatedAt: rel.updatedAt,
        },
      }));
      
      allRelations.push(...mappedRelations);
      
      console.log(`📊 [RELATIONS] Réponse: ${itemsCount} relations reçues | Total accumulé: ${allRelations.length}`);

      // Incrémenter l'offset par le nombre d'items récupérés
      offset += itemsCount;
      
      // Si on a récupéré moins d'items que la limite, il n'y en a plus
      hasMore = itemsCount >= limit && itemsCount > 0;

      // Rate limiting: attendre un peu entre les requêtes
      if (hasMore) {
        await delay(100);
      }
    }

    console.log(`✓ ${allRelations.length} relations récupérées au total`);
    return allRelations;
  }

  /**
   * Récupère les relations d'un objet spécifique
   * TODO: Implémenter selon le swagger de l'API BizzDesign v3
   */
  async getObjectRelationships(
    repositoryId: number,
    objectId: string
  ): Promise<Relationship[]> {
    console.warn(`⚠️ getObjectRelationships n'est pas encore implémentée selon le swagger`);
    return [];
  }

  /**
   * Récupère tous les data blocks d'un objet
   */
  async getObjectDataBlocks(
    repositoryId: number,
    objectId: string
  ): Promise<DataBlock[]> {
    try {
      const response = await this.request<{
        _items: DataBlock[];
      }>({
        method: 'GET',
        url: `/repositories/${repositoryId}/objects/${objectId}/datablocks`,
      });

      return response._items || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Récupère un data block spécifique d'un objet
   */
  async getObjectDataBlock(
    repositoryId: number,
    objectId: string,
    namespace: string,
    name: string
  ): Promise<DataBlock | null> {
    try {
      const response = await this.request<DataBlock>({
        method: 'GET',
        url: `/repositories/${repositoryId}/objects/${objectId}/datablocks/${namespace}/${name}`,
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }


  /**
   * Récupère une data block definition spécifique
   */
  async getDataBlockDefinition(
    repositoryId: number,
    namespace: string,
    name: string
  ): Promise<DataBlockDefinition | null> {
    try {
      const response = await this.request<DataBlockDefinition>({
        method: 'GET',
        url: `/repositories/${repositoryId}/schemas/${namespace}/${name}`,
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

