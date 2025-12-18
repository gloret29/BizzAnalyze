import { Router, Request, Response } from 'express';
import progressEmitter from '../../services/bizzdesign/progressEmitter';

export function createProgressRouter(): Router {
  const router = Router();

  /**
   * GET /api/progress
   * Endpoint Server-Sent Events pour suivre la progression en temps réel
   */
  router.get('/', (req: Request, res: Response) => {
    // Configurer les headers pour SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering pour nginx

    // Envoyer un message de connexion
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connexion établie' })}\n\n`);

    // Écouter les événements de progression
    const onProgress = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`);
    };

    const onStart = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'start', ...data })}\n\n`);
    };

    const onComplete = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'complete', ...data })}\n\n`);
    };

    const onError = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'error', ...data })}\n\n`);
    };

    progressEmitter.on('progress', onProgress);
    progressEmitter.on('start', onStart);
    progressEmitter.on('complete', onComplete);
    progressEmitter.on('error', onError);

    // Nettoyer quand la connexion est fermée
    req.on('close', () => {
      progressEmitter.off('progress', onProgress);
      progressEmitter.off('start', onStart);
      progressEmitter.off('complete', onComplete);
      progressEmitter.off('error', onError);
      res.end();
    });
  });

  return router;
}


















