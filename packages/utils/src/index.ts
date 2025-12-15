/**
 * Utilitaires partagés
 */

export * from './objectName';

/**
 * Divise un tableau en chunks de taille donnée
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Délai en millisecondes
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry avec backoff exponentiel
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number | ((attempt: number) => number);
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay: delayFn = 1000, onRetry } = options;

  let lastError: Error;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const waitTime =
          typeof delayFn === 'function' ? delayFn(attempt) : delayFn;
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError!;
}

