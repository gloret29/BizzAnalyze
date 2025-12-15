import fs from 'fs';
import path from 'path';
import { TokenStore } from '../bizzdesign/tokenStore';

export interface AppConfig {
  bizzdesign: {
    apiUrl: string;
    clientId: string;
    clientSecret: string;
    repositoryId: string;
  };
}

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

/**
 * Stockage de la configuration de l'application
 */
export class ConfigStore {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Charge la configuration depuis le fichier ou les variables d'environnement
   */
  private loadConfig(): AppConfig {
    // Essayer de charger depuis le fichier
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const fileConfig = JSON.parse(data);
        return this.mergeWithEnv(fileConfig);
      } catch (error) {
        console.warn('Erreur lors du chargement du fichier de configuration:', error);
      }
    }

    // Sinon utiliser les variables d'environnement
    return {
      bizzdesign: {
        apiUrl: process.env.BIZZDESIGN_API_URL || 'https://arkea.horizzon.cloud/api/3.0',
        clientId: process.env.BIZZDESIGN_CLIENT_ID || '',
        clientSecret: process.env.BIZZDESIGN_CLIENT_SECRET || '',
        repositoryId: process.env.BIZZDESIGN_REPOSITORY_ID || '',
      },
    };
  }

  /**
   * Fusionne la configuration du fichier avec les variables d'environnement
   */
  private mergeWithEnv(fileConfig: Partial<AppConfig>): AppConfig {
    return {
      bizzdesign: {
        apiUrl: fileConfig.bizzdesign?.apiUrl || process.env.BIZZDESIGN_API_URL || 'https://arkea.horizzon.cloud/api/3.0',
        clientId: fileConfig.bizzdesign?.clientId || process.env.BIZZDESIGN_CLIENT_ID || '',
        clientSecret: fileConfig.bizzdesign?.clientSecret || process.env.BIZZDESIGN_CLIENT_SECRET || '',
        repositoryId: fileConfig.bizzdesign?.repositoryId || process.env.BIZZDESIGN_REPOSITORY_ID || '',
      },
    };
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Récupère la configuration BizzDesign (sans le secret en clair)
   */
  getBizzDesignConfigSafe(): {
    apiUrl: string;
    clientId: string;
    hasSecret: boolean;
    repositoryId: string;
  } {
    return {
      apiUrl: this.config.bizzdesign.apiUrl,
      clientId: this.config.bizzdesign.clientId,
      hasSecret: !!this.config.bizzdesign.clientSecret,
      repositoryId: this.config.bizzdesign.repositoryId,
    };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(updates: Partial<AppConfig>): void {
    if (updates.bizzdesign) {
      const oldConfig = { ...this.config.bizzdesign };
      
      this.config.bizzdesign = {
        ...this.config.bizzdesign,
        ...updates.bizzdesign,
        // Ne pas écraser le secret s'il n'est pas fourni
        clientSecret: updates.bizzdesign.clientSecret || this.config.bizzdesign.clientSecret,
      };

      // Si les credentials ont changé, invalider le token
      if (
        updates.bizzdesign.apiUrl !== oldConfig.apiUrl ||
        updates.bizzdesign.clientId !== oldConfig.clientId ||
        (updates.bizzdesign.clientSecret && updates.bizzdesign.clientSecret !== oldConfig.clientSecret)
      ) {
        console.log('⚠️  Credentials modifiés, invalidation du token');
        // Invalider l'ancien token si l'URL a changé
        if (oldConfig.apiUrl && updates.bizzdesign.apiUrl !== oldConfig.apiUrl) {
          TokenStore.clearToken(oldConfig.apiUrl);
        }
        // Invalider aussi le nouveau token pour forcer la régénération
        if (updates.bizzdesign.apiUrl) {
          TokenStore.clearToken(updates.bizzdesign.apiUrl);
        }
      }
    }

    this.saveConfig();
  }

  /**
   * Sauvegarde la configuration dans le fichier
   */
  private saveConfig(): void {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
      console.log('✓ Configuration sauvegardée');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw error;
    }
  }

  /**
   * Met à jour le repository sélectionné
   */
  setRepositoryId(repositoryId: string): void {
    this.config.bizzdesign.repositoryId = repositoryId;
    this.saveConfig();
  }
}

// Instance singleton
let configStore: ConfigStore | null = null;

export function getConfigStore(): ConfigStore {
  if (!configStore) {
    configStore = new ConfigStore();
  }
  return configStore;
}

