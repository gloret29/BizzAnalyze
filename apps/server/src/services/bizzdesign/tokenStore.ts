import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { BizzDesignToken } from '@bizzanalyze/types';

/**
 * Génère un nom de fichier de token basé sur l'URL de l'API pour éviter les conflits
 */
function getTokenFileName(apiUrl: string): string {
  const hash = crypto.createHash('md5').update(apiUrl).digest('hex').substring(0, 8);
  return path.join(process.cwd(), `.bizzdesign-token-${hash}.json`);
}

/**
 * Stockage persistant du token BizzDesign
 */
export class TokenStore {
  /**
   * Charge le token depuis le fichier pour une URL d'API donnée
   */
  static loadToken(apiUrl: string): BizzDesignToken | null {
    try {
      const tokenFile = getTokenFileName(apiUrl);
      if (fs.existsSync(tokenFile)) {
        const data = fs.readFileSync(tokenFile, 'utf-8');
        const token = JSON.parse(data) as BizzDesignToken;
        
        // Vérifier si le token est encore valide
        if (token.expires_at) {
          const expiresAt = new Date(token.expires_at);
          const now = new Date();
          
          // Si le token expire dans moins de 60 secondes, le considérer comme expiré
          if (expiresAt.getTime() - now.getTime() < 60000) {
            console.log('Token expiré ou expirant bientôt, sera régénéré');
            return null;
          }
          
          return token;
        }
      }
    } catch (error) {
      console.warn('Erreur lors du chargement du token:', error);
    }
    
    return null;
  }

  /**
   * Sauvegarde le token dans le fichier pour une URL d'API donnée
   */
  static saveToken(apiUrl: string, token: BizzDesignToken): void {
    try {
      const tokenFile = getTokenFileName(apiUrl);
      fs.writeFileSync(tokenFile, JSON.stringify(token, null, 2), 'utf-8');
      console.log('✓ Token sauvegardé');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  }

  /**
   * Supprime le token sauvegardé pour une URL d'API donnée
   */
  static clearToken(apiUrl?: string): void {
    try {
      if (apiUrl) {
        // Supprimer le token pour une URL spécifique
        const tokenFile = getTokenFileName(apiUrl);
        if (fs.existsSync(tokenFile)) {
          fs.unlinkSync(tokenFile);
          console.log('Token supprimé pour', apiUrl);
        }
      } else {
        // Supprimer tous les tokens (pour compatibilité)
        const tokenFiles = fs.readdirSync(process.cwd())
          .filter(file => file.startsWith('.bizzdesign-token-') && file.endsWith('.json'));
        tokenFiles.forEach(file => {
          fs.unlinkSync(path.join(process.cwd(), file));
        });
        console.log('Tous les tokens supprimés');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
    }
  }
}

