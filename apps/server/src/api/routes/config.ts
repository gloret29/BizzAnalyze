import { Router, Request, Response } from 'express';
import { getConfigStore } from '../../services/config/configStore';
import { BizzDesignClient } from '../../services/bizzdesign/client';

export function createConfigRouter(): Router {
  const router = Router();
  const configStore = getConfigStore();

  /**
   * GET /api/config
   * Récupère la configuration actuelle (sans les secrets)
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const config = configStore.getBizzDesignConfigSafe();
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      console.error('Get config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * PUT /api/config
   * Met à jour la configuration
   */
  router.put('/', async (req: Request, res: Response) => {
    try {
      const { apiUrl, clientId, clientSecret, repositoryId } = req.body;

      configStore.updateConfig({
        bizzdesign: {
          apiUrl: apiUrl || '',
          clientId: clientId || '',
          clientSecret: clientSecret || '',
          repositoryId: repositoryId || '',
        },
      });

      res.json({
        success: true,
        message: 'Configuration mise à jour',
        data: configStore.getBizzDesignConfigSafe(),
      });
    } catch (error: any) {
      console.error('Update config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/config/repositories
   * Récupère la liste des repositories disponibles depuis BizzDesign
   * Vérifie d'abord que l'authentification fonctionne
   */
  router.get('/repositories', async (req: Request, res: Response) => {
    try {
      const config = configStore.getConfig();

      if (!config.bizzdesign.apiUrl || !config.bizzdesign.clientId || !config.bizzdesign.clientSecret) {
        return res.status(400).json({
          success: false,
          error: 'Configuration BizzDesign incomplète. Veuillez configurer l\'API URL, le Client ID et le Client Secret.',
        });
      }

      const client = new BizzDesignClient(config.bizzdesign);

      // Vérifier d'abord que l'authentification fonctionne en obtenant un token
      try {
        await client.getToken();
      } catch (error: any) {
        return res.status(401).json({
          success: false,
          error: `Impossible d'obtenir un token d'authentification: ${error.message}. Vérifiez vos identifiants.`,
        });
      }

      // Si le token est obtenu avec succès, récupérer la liste des repositories
      const repositories = await client.getRepositories();

      res.json({
        success: true,
        data: repositories,
      });
    } catch (error: any) {
      console.error('Get repositories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération des repositories',
      });
    }
  });

  /**
   * GET /api/config/repositories
   * Récupère la liste des repositories disponibles depuis BizzDesign
   * Vérifie d'abord que l'authentification fonctionne
   */
  router.get('/repositories-list', async (req: Request, res: Response) => {
    try {
      const config = configStore.getConfig();
      const filterId = req.query.filterId ? parseInt(req.query.filterId as string) : undefined;

      if (!config.bizzdesign.apiUrl || !config.bizzdesign.clientId || !config.bizzdesign.clientSecret) {
        return res.status(400).json({
          success: false,
          error: 'Configuration BizzDesign incomplète. Veuillez configurer l\'API URL, le Client ID et le Client Secret.',
        });
      }

      const client = new BizzDesignClient(config.bizzdesign);

      // Vérifier d'abord que l'authentification fonctionne en obtenant un token
      try {
        await client.getToken();
      } catch (error: any) {
        return res.status(401).json({
          success: false,
          error: `Impossible d'obtenir un token d'authentification: ${error.message}. Vérifiez vos identifiants.`,
        });
      }

      // Si le token est obtenu avec succès, récupérer la liste des repositories
      const repositories = await client.getRepositoriesList(filterId);

      res.json({
        success: true,
        data: repositories,
      });
    } catch (error: any) {
      console.error('Get repositories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération des repositories',
      });
    }
  });

  /**
   * PUT /api/config/repository
   * Sélectionne un repository
   */
  router.put('/repository', async (req: Request, res: Response) => {
    try {
      const { repositoryId } = req.body;

      if (!repositoryId) {
        return res.status(400).json({
          success: false,
          error: 'repositoryId est requis',
        });
      }

      configStore.setRepositoryId(repositoryId);

      res.json({
        success: true,
        message: 'Repository sélectionné',
        data: { repositoryId },
      });
    } catch (error: any) {
      console.error('Set repository error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * POST /api/config/test-connection
   * Teste la connexion à l'API BizzDesign
   */
  router.post('/test-connection', async (req: Request, res: Response) => {
    try {
      const { apiUrl, clientId, clientSecret } = req.body;

      if (!apiUrl || !clientId || !clientSecret) {
        return res.status(400).json({
          success: false,
          error: 'apiUrl, clientId et clientSecret sont requis',
        });
      }

      const client = new BizzDesignClient({
        apiUrl,
        clientId,
        clientSecret,
        repositoryId: '',
      });

      // Tenter d'obtenir un token pour valider la connexion
      await client.getToken();

      res.json({
        success: true,
        message: 'Connexion réussie à l\'API BizzDesign',
      });
    } catch (error: any) {
      console.error('Test connection error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Échec de la connexion à l\'API BizzDesign',
      });
    }
  });

  return router;
}

