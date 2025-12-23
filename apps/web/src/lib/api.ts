import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  PaginatedApiResponse,
  SyncRequest,
  ObjectQuery,
  StatsResponse,
} from '@bizzanalyze/types';

// En production avec reverse proxy (SWAG/Nginx), utiliser une URL relative (le proxy gère le routage)
// En développement local, utiliser localhost:3001
// Détecte automatiquement l'URL de l'API en fonction du contexte
const getApiUrl = () => {
  // Si on a une URL explicite dans les env vars, l'utiliser (priorité absolue)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Côté serveur (SSR), utiliser l'URL locale si disponible
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }
  
  // Côté client (browser) : détecter automatiquement l'URL de l'API
  const currentUrl = window.location;
  const currentPort = currentUrl.port;
  const protocol = currentUrl.protocol;
  const hostname = currentUrl.hostname;
  
  // PRIORITÉ 1: Si on accède via HTTPS (port 443 ou pas de port spécifié avec HTTPS)
  // C'est probablement via un reverse proxy (SWAG, Nginx, etc.)
  // Utiliser une URL relative pour que le proxy route
  if (protocol === 'https:') {
    // Avec HTTPS, toujours utiliser une URL relative (SWAG/Nginx route)
    return '';
  }
  
  // PRIORITÉ 2: Si on accède via HTTP sur le port 80 (standard) ou sans port
  // C'est probablement via un reverse proxy
  // Utiliser une URL relative
  if (protocol === 'http:' && (currentPort === '80' || currentPort === '')) {
    return '';
  }
  
  // PRIORITÉ 3: Si on accède directement au port 3002 (sans reverse proxy)
  // Utiliser le même host mais port 3001 pour l'API
  if (currentPort === '3002') {
    return `${protocol}//${hostname}:3001`;
  }
  
  // PRIORITÉ 4: Si on accède via un port personnalisé (autre que 80/443/3002)
  // et que ce n'est pas un port standard, essayer le port 3001
  // Cela fonctionne pour les accès locaux (192.168.x.x:3002 -> 192.168.x.x:3001)
  if (currentPort && currentPort !== '80' && currentPort !== '443') {
    return `${protocol}//${hostname}:3001`;
  }
  
  // Par défaut, utiliser une URL relative pour que le reverse proxy route
  // Cela fonctionne avec SWAG, Nginx, Traefik, etc.
  // Le reverse proxy route /api vers le serveur backend
  return '';
};

const API_URL = getApiUrl();

// Log de debug pour comprendre quelle URL est utilisée
if (typeof window !== 'undefined') {
  console.log('[API] URL détectée:', API_URL || '(URL relative - routée par proxy)');
  console.log('[API] Location actuelle:', window.location.href);
  console.log('[API] Protocol:', window.location.protocol);
  console.log('[API] Port:', window.location.port || '(défaut)');
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout augmenté pour les requêtes depuis internet
  timeout: 60000,
});

// Callback pour les toasters (sera défini par le composant qui utilise l'API)
let toastCallback: ((message: string, type: 'info' | 'success' | 'error' | 'warning') => void) | null = null;

export function setToastCallback(callback: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void) {
  toastCallback = callback;
}

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
  (config) => {
    // Détecter les appels à l'API BizzDesign
    if (config.url?.includes('/api/config') || config.url?.includes('/api/sync') || config.url?.includes('/api/import')) {
      const method = config.method?.toUpperCase() || 'GET';
      const url = config.url;
      
      if (toastCallback) {
        if (url.includes('/test-connection')) {
          toastCallback('🔗 Test de connexion à l\'API BizzDesign...', 'info');
        } else if (url.includes('/repositories-list')) {
          toastCallback('📦 Récupération des Repositories...', 'info');
        } else if (url.includes('/repositories')) {
          toastCallback('🏢 Récupération des Repositories...', 'info');
        } else if (url.includes('/sync')) {
          toastCallback('📥 Extraction BizzDesign en cours...', 'info');
        } else if (url.includes('/import') && method === 'POST') {
          toastCallback('💾 Import Neo4j en cours...', 'info');
        } else if (url.includes('/config') && method === 'PUT') {
          toastCallback('💾 Sauvegarde de la configuration...', 'info');
        }
      }
    }
    return config;
  },
  (error) => {
    // Log détaillé des erreurs réseau
    if (error.response) {
      // Erreur HTTP (4xx, 5xx)
      console.error('[API] ❌ Erreur HTTP:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
    } else if (error.request) {
      // Erreur réseau (pas de réponse du serveur)
      console.error('[API] ❌ Erreur réseau:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
      });
    } else {
      // Erreur de configuration
      console.error('[API] ❌ Erreur de configuration:', error.message);
    }
    
    if (toastCallback) {
      const errorMessage = error.response 
        ? `Erreur ${error.response.status}: ${error.response.statusText}`
        : error.message || 'Erreur réseau';
      toastCallback(`❌ ${errorMessage}`, 'error');
    }
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de debug pour les requêtes réussies
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[API] ✅ Requête réussie:', response.config.method?.toUpperCase(), response.config.url);
    }
    const url = response.config.url || '';
    
    // Détecter les réponses de l'API BizzDesign
    if (url.includes('/api/config') || url.includes('/api/sync') || url.includes('/api/import')) {
      if (toastCallback) {
        if (url.includes('/test-connection')) {
          if (response.data.success) {
            toastCallback('✓ Connexion à l\'API BizzDesign réussie', 'success');
          } else {
            toastCallback(`✗ ${response.data.error || 'Échec de la connexion'}`, 'error');
          }
        } else if (url.includes('/repositories-list')) {
          if (response.data.success) {
            const count = response.data.data?.length || 0;
            toastCallback(`✓ ${count} Repository(s) récupéré(s)`, 'success');
          } else {
            toastCallback(`✗ ${response.data.error || 'Erreur lors de la récupération'}`, 'error');
          }
        } else if (url.includes('/repositories')) {
          if (response.data.success) {
            const count = response.data.data?.length || 0;
            toastCallback(`✓ ${count} Repository(s) récupéré(s)`, 'success');
          } else {
            toastCallback(`✗ ${response.data.error || 'Erreur lors de la récupération'}`, 'error');
          }
        } else if (url.includes('/sync')) {
          if (response.data.success) {
            const data = response.data.data;
            const objectsCount = data?.objectsCount || 0;
            const relationshipsCount = data?.relationshipsCount || 0;
            toastCallback(
              `✓ Extraction réussie: ${objectsCount} objets, ${relationshipsCount} relations`,
              'success'
            );
          } else {
            toastCallback(`✗ ${response.data.error || "Erreur lors de l'extraction"}`, 'error');
          }
        } else if (url.includes('/import') && response.config.method?.toLowerCase() === 'post') {
          if (response.data.success) {
            const data = response.data.data;
            const objectsCount = data?.objectsCount || 0;
            const relationshipsCount = data?.relationshipsCount || 0;
            toastCallback(
              `✓ Import réussi: ${objectsCount} objets, ${relationshipsCount} relations`,
              'success'
            );
          } else {
            toastCallback(`✗ ${response.data.error || "Erreur lors de l'import"}`, 'error');
          }
        } else if (url.includes('/config') && response.config.method === 'put') {
          if (response.data.success) {
            toastCallback('✓ Configuration sauvegardée', 'success');
          } else {
            toastCallback(`✗ ${response.data.error || 'Erreur lors de la sauvegarde'}`, 'error');
          }
        }
      }
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    
    if (toastCallback && (url.includes('/api/config') || url.includes('/api/sync') || (url.includes('/api/import') && error.config?.method?.toLowerCase() === 'post'))) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toastCallback(`✗ ${errorMessage}`, 'error');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Client API pour communiquer avec le backend
 */
export const api = {
  /**
   * Extrait les données depuis BizzDesign et les sauvegarde dans des fichiers locaux
   */
  async sync(repositoryId?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/sync', {
      repositoryId,
    });
    return response.data;
  },

  /**
   * Importe les données depuis les fichiers locaux dans Neo4j
   */
  async import(repositoryId?: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/import', {
      repositoryId,
    });
    return response.data;
  },

  /**
   * Vérifie si une extraction existe pour le repository sélectionné
   */
  async getImportStatus(): Promise<ApiResponse<{ hasExtraction: boolean; repositoryId?: string }>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/import/status');
    return response.data;
  },

  /**
   * Récupère les objets avec pagination et filtres
   */
  async getObjects(
    query: ObjectQuery = {}
  ): Promise<PaginatedApiResponse<any>> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append('page', query.page.toString());
    if (query.pageSize !== undefined)
      params.append('pageSize', query.pageSize.toString());
    if (query.type) params.append('type', query.type);
    if (query.search) params.append('search', query.search);
    if (query.tags) params.append('tags', query.tags.join(','));

    const response = await apiClient.get<PaginatedApiResponse<any>>(
      `/api/objects?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Récupère les détails d'un objet
   */
  async getObject(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/api/objects/${id}`);
    return response.data;
  },

  /**
   * Récupère les statistiques
   */
  async getStats(repositoryId?: string): Promise<ApiResponse<StatsResponse>> {
    const params = repositoryId
      ? `?repositoryId=${repositoryId}`
      : '';
    const response = await apiClient.get<ApiResponse<StatsResponse>>(
      `/api/stats${params}`
    );
    return response.data;
  },

  /**
   * Health check
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('[API] Health check failed:', error);
      throw error;
    }
  },

  /**
   * Test de connectivité API (avec logs détaillés)
   */
  async testConnection(): Promise<{ success: boolean; url: string; error?: string }> {
    const testUrl = API_URL ? `${API_URL}/api/health` : '/api/health';
    console.log('[API] Test de connexion vers:', testUrl);
    
    try {
      const response = await apiClient.get('/api/health');
      console.log('[API] ✅ Test de connexion réussi');
      return {
        success: true,
        url: testUrl,
      };
    } catch (error: any) {
      const errorMsg = error.response 
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message || 'Erreur réseau';
      console.error('[API] ❌ Test de connexion échoué:', errorMsg);
      return {
        success: false,
        url: testUrl,
        error: errorMsg,
      };
    }
  },

  // ============ Configuration ============

  /**
   * Récupère la configuration actuelle
   */
  async getConfig(): Promise<ApiResponse<{
    apiUrl: string;
    clientId: string;
    hasSecret: boolean;
    repositoryId: string;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/config');
    return response.data;
  },

  /**
   * Met à jour la configuration
   */
  async updateConfig(config: {
    apiUrl: string;
    clientId: string;
    clientSecret?: string;
    repositoryId?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>('/api/config', config);
    return response.data;
  },

  /**
   * Récupère la liste des repositories disponibles
   */
  async getRepositories(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description?: string;
  }>>> {
    const response = await apiClient.get<ApiResponse<any>>('/api/config/repositories-list');
    return response.data;
  },

  /**
   * Sélectionne un repository
   */
  async selectRepository(repositoryId: string): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>('/api/config/repository', {
      repositoryId,
    });
    return response.data;
  },

  /**
   * Teste la connexion à l'API BizzDesign
   */
  async testConnection(config: {
    apiUrl: string;
    clientId: string;
    clientSecret: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/config/test-connection', config);
    return response.data;
  },

  /**
   * Récupère les logs des appels API BizzDesign
   */
  async getBizzDesignLogs(limit: number = 50): Promise<ApiResponse<Array<{
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    duration?: number;
    success: boolean;
    error?: string;
  }>>> {
    const response = await apiClient.get<ApiResponse<any>>(`/api/logs/bizzdesign?limit=${limit}`);
    return response.data;
  },

  /**
   * Écoute les événements de progression via Server-Sent Events
   * Note: Ne fonctionne que côté client (EventSource n'est pas disponible côté serveur)
   */
  listenToProgress(
    onProgress: (data: {
      type: 'progress' | 'start' | 'complete' | 'error' | 'connected';
      message?: string;
      current?: number;
      total?: number;
      offset?: number;
      data?: any;
    }) => void
  ): () => void {
    // Vérifier que nous sommes côté client
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      console.warn('EventSource is not available (server-side rendering)');
      return () => {}; // Retourner une fonction no-op
    }

    const eventSource = new EventSource(`${API_URL}/api/progress`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);
      } catch (error) {
        console.error('Error parsing progress event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };

    // Retourner une fonction pour fermer la connexion
    return () => {
      eventSource.close();
    };
  },

  // ============ Export ============

  /**
   * Exporte les données dans différents formats
   */
  async export(data: {
    format: 'csv' | 'json' | 'excel';
    filters?: ObjectQuery;
    includeRelationships?: boolean;
  }): Promise<Blob> {
    const response = await apiClient.post(
      '/api/export',
      {
        format: data.format,
        filters: data.filters,
        includeRelationships: data.includeRelationships,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  // ============ Graph Visualization ============

  /**
   * Récupère les données du graphe pour visualisation
   */
  async getGraph(params?: {
    limit?: number;
    type?: string;
    search?: string;
    nodeId?: string;
    repositoryId?: string;
  }): Promise<ApiResponse<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      category?: string;
      subCategory?: string;
    }>;
    edges: Array<{
      id: string;
      from: string;
      to: string;
      type: string;
      label?: string;
      fromName?: string;
      toName?: string;
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.nodeId) queryParams.append('nodeId', params.nodeId);
    if (params?.repositoryId) queryParams.append('repositoryId', params.repositoryId);

    const url = `/api/graph?${queryParams.toString()}`;
    
    try {
      const response = await apiClient.get<ApiResponse<any>>(url);
      return response.data;
    } catch (error: any) {
      console.error('[API] getGraph - Erreur:', error);
      throw error;
    }
  },

  /**
   * Récupère les voisins d'un nœud
   */
  async getNodeNeighbors(
    nodeId: string,
    depth?: number,
    repositoryId?: string
  ): Promise<ApiResponse<{
    nodes: any[];
    edges: any[];
  }>> {
    const queryParams = new URLSearchParams();
    if (depth) queryParams.append('depth', depth.toString());
    if (repositoryId) queryParams.append('repositoryId', repositoryId);

    const response = await apiClient.get<ApiResponse<any>>(
      `/api/graph/neighbors/${nodeId}?${queryParams.toString()}`
    );
      return response.data;
  },

  // ============ Analysis ============

  /**
   * Calcule la centralité
   */
  async analyzeCentrality(
    type: 'degree' | 'pagerank' = 'degree',
    repositoryId?: string
  ): Promise<ApiResponse<{
    type: string;
    results: Array<{
      nodeId: string;
      nodeName: string;
      nodeType: string;
      score: number;
    }>;
  }>> {
    const params = new URLSearchParams();
    params.append('type', type);
    if (repositoryId) params.append('repositoryId', repositoryId);

    const response = await apiClient.get<ApiResponse<any>>(
      `/api/analyze/centrality?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Analyse les chemins entre deux nœuds
   */
  async analyzePaths(
    sourceId: string,
    targetId: string,
    options?: {
      findAll?: boolean;
      maxDepth?: number;
      repositoryId?: string;
    }
  ): Promise<ApiResponse<{
    sourceId: string;
    targetId: string;
    path?: any;
    paths?: any[];
  }>> {
    const params = new URLSearchParams();
    params.append('sourceId', sourceId);
    params.append('targetId', targetId);
    if (options?.findAll) params.append('findAll', 'true');
    if (options?.maxDepth) params.append('maxDepth', options.maxDepth.toString());
    if (options?.repositoryId) params.append('repositoryId', options.repositoryId);

    const response = await apiClient.get<ApiResponse<any>>(
      `/api/analyze/paths?${params.toString()}`
    );
    return response.data;
  },
};

