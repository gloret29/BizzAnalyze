import { EventEmitter } from 'events';

/**
 * Émetteur d'événements pour la progression de l'extraction
 */
export class ProgressEmitter extends EventEmitter {
  /**
   * Émet un événement de progression
   */
  emitProgress(type: 'objects' | 'relationships', current: number, total?: number, offset?: number) {
    this.emit('progress', {
      type,
      current,
      total,
      offset,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Émet un événement de début
   */
  emitStart(message: string) {
    this.emit('start', {
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Émet un événement de fin
   */
  emitComplete(message: string, data?: any) {
    this.emit('complete', {
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Émet un événement d'erreur
   */
  emitError(message: string, error?: any) {
    this.emit('error', {
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    });
  }
}

// Instance globale pour la progression
const progressEmitter = new ProgressEmitter();

export default progressEmitter;




























