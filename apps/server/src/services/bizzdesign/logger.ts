/**
 * Logger pour les appels API BizzDesign
 * Permet de tracer tous les appels et leurs réponses
 */

export interface ApiCallLog {
  timestamp: Date;
  method: string;
  url: string;
  params?: Record<string, any>; // Paramètres de requête (query params)
  body?: any; // Body de la requête (pour POST, PUT, etc.)
  curl?: string; // Commande curl équivalente
  status?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

class BizzDesignLogger {
  private logs: ApiCallLog[] = [];
  private maxLogs = 100; // Garder les 100 derniers logs

  /**
   * Génère une commande curl équivalente à partir d'un appel API
   */
  generateCurl(
    method: string,
    url: string,
    params?: Record<string, any>,
    body?: any,
    token?: string
  ): string {
    try {
      // Construire l'URL avec les paramètres de requête
      const urlObj = new URL(url);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlObj.searchParams.append(key, String(value));
          }
        });
      }
      const fullUrl = urlObj.toString();

      // Commencer la commande curl
      let curlCmd = `curl -X ${method}`;

      // Ajouter les headers
      curlCmd += ` \\\n  -H "Content-Type: application/json"`;
      if (token) {
        curlCmd += ` \\\n  -H "Authorization: Bearer ${token}"`;
      }

      // Ajouter le body si présent
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
        // Échapper les caractères spéciaux pour le shell
        const escapedBody = bodyStr
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "'\\''")
          .replace(/\n/g, '\\n')
          .replace(/\$/g, '\\$')
          .replace(/`/g, '\\`');
        curlCmd += ` \\\n  -d '${escapedBody}'`;
      }

      // Ajouter l'URL
      curlCmd += ` \\\n  "${fullUrl}"`;

      return curlCmd;
    } catch (error) {
      // Si l'URL n'est pas valide, retourner une commande curl basique
      return `curl -X ${method} "${url}"`;
    }
  }

  /**
   * Met à jour le curl d'un log avec le token
   */
  updateCurl(log: ApiCallLog, token: string): void {
    log.curl = this.generateCurl(log.method, log.url, log.params, log.body, token);
  }

  logCall(
    method: string, 
    url: string, 
    startTime: Date, 
    params?: Record<string, any>,
    body?: any,
    token?: string
  ) {
    const curl = this.generateCurl(method, url, params, body, token);
    const log: ApiCallLog = {
      timestamp: startTime,
      method,
      url,
      params,
      body,
      curl,
      success: false,
    };
    this.logs.push(log);
    return log;
  }

  logSuccess(log: ApiCallLog, status: number, endTime: Date) {
    log.status = status;
    log.success = true;
    log.duration = endTime.getTime() - log.timestamp.getTime();
    this.trimLogs();
    console.log(`✓ [BizzDesign API] ${log.method} ${log.url} - ${status} (${log.duration}ms)`);
    if (log.curl) {
      console.log(`\n📋 [CURL]\n${log.curl}\n`);
    }
  }

  logError(log: ApiCallLog, error: string, endTime: Date) {
    log.success = false;
    log.error = error;
    log.duration = endTime.getTime() - log.timestamp.getTime();
    this.trimLogs();
    console.error(`✗ [BizzDesign API] ${log.method} ${log.url} - ${error} (${log.duration}ms)`);
    if (log.curl) {
      console.error(`\n📋 [CURL]\n${log.curl}\n`);
    }
  }

  getLogs(): ApiCallLog[] {
    return [...this.logs];
  }

  getRecentLogs(limit: number = 10): ApiCallLog[] {
    return this.logs.slice(-limit);
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

export const bizzDesignLogger = new BizzDesignLogger();

