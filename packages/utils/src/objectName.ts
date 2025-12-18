import type { ObjectName } from '@bizzanalyze/types';

/**
 * Extrait le nom de l'objet depuis la structure multilingue objectName
 * @param objectName Structure multilingue (ex: { "en": "Bizzdesign", "fr": "Bizzdesign" })
 * @param preferredLanguage Langue préférée (par défaut: "en")
 * @returns Le nom dans la langue préférée, ou la première langue disponible, ou une chaîne vide
 */
export function extractObjectName(
  objectName?: ObjectName | string,
  preferredLanguage: string = 'en'
): string {
  if (!objectName) {
    return '';
  }

  // Si c'est déjà une string, la retourner directement
  if (typeof objectName === 'string') {
    return objectName;
  }

  // Si c'est un objet multilingue
  if (typeof objectName === 'object') {
    // Essayer d'abord la langue préférée
    if (objectName[preferredLanguage]) {
      return objectName[preferredLanguage];
    }

    // Sinon, prendre la première langue disponible
    const languages = Object.keys(objectName);
    if (languages.length > 0) {
      return objectName[languages[0]];
    }
  }

  return '';
}

/**
 * Obtient toutes les traductions disponibles du nom
 * @param objectName Structure multilingue
 * @returns Objet avec toutes les traductions
 */
export function getAllObjectNameTranslations(objectName?: ObjectName | string): ObjectName {
  if (!objectName) {
    return {};
  }

  if (typeof objectName === 'string') {
    return { default: objectName };
  }

  return objectName;
}


















