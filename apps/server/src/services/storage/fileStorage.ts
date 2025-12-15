import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  Repository,
  BizzDesignObject,
  Relationship,
} from '@bizzanalyze/types';

/**
 * Service de stockage des données extraites dans des fichiers locaux
 */
export class FileStorage {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  /**
   * Initialise le répertoire de données s'il n'existe pas
   */
  async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Impossible de créer le répertoire de données: ${error.message}`);
      }
    }
  }

  /**
   * Sauvegarde les données extraites dans des fichiers JSON
   */
  async saveExtraction(
    repository: Repository,
    objects: BizzDesignObject[],
    relationships: Relationship[]
  ): Promise<{ repositoryPath: string; objectsPath: string; relationshipsPath: string }> {
    await this.ensureDataDir();

    const repositoryDir = path.join(this.dataDir, repository.id);
    await fs.mkdir(repositoryDir, { recursive: true });

    const repositoryPath = path.join(repositoryDir, 'repository.json');
    const objectsPath = path.join(repositoryDir, 'objects.json');
    const relationshipsPath = path.join(repositoryDir, 'relationships.json');

    // Sauvegarder le repository
    await fs.writeFile(
      repositoryPath,
      JSON.stringify(repository, null, 2),
      'utf-8'
    );

    // Sauvegarder les objets
    await fs.writeFile(
      objectsPath,
      JSON.stringify(objects, null, 2),
      'utf-8'
    );

    // Sauvegarder les relations
    await fs.writeFile(
      relationshipsPath,
      JSON.stringify(relationships, null, 2),
      'utf-8'
    );

    console.log(`💾 Données sauvegardées dans ${repositoryDir}`);
    console.log(`  - Repository: ${repositoryPath}`);
    console.log(`  - Objets: ${objectsPath} (${objects.length} objets)`);
    console.log(`  - Relations: ${relationshipsPath} (${relationships.length} relations)`);

    return {
      repositoryPath,
      objectsPath,
      relationshipsPath,
    };
  }

  /**
   * Charge les données depuis les fichiers JSON
   */
  async loadExtraction(
    repositoryId: string
  ): Promise<{
    repository: Repository;
    objects: BizzDesignObject[];
    relationships: Relationship[];
  }> {
    const repositoryDir = path.join(this.dataDir, repositoryId);
    const repositoryPath = path.join(repositoryDir, 'repository.json');
    const objectsPath = path.join(repositoryDir, 'objects.json');
    const relationshipsPath = path.join(repositoryDir, 'relationships.json');

    // Vérifier que les fichiers existent
    try {
      await fs.access(repositoryPath);
      await fs.access(objectsPath);
      await fs.access(relationshipsPath);
    } catch (error) {
      throw new Error(
        `Les fichiers d'extraction pour le repository ${repositoryId} n'existent pas. Veuillez d'abord effectuer une extraction.`
      );
    }

    // Charger les données
    const repositoryContent = await fs.readFile(repositoryPath, 'utf-8');
    const objectsContent = await fs.readFile(objectsPath, 'utf-8');
    const relationshipsContent = await fs.readFile(relationshipsPath, 'utf-8');

    const repository = JSON.parse(repositoryContent) as Repository;
    const objects = JSON.parse(objectsContent) as BizzDesignObject[];
    const relationships = JSON.parse(relationshipsContent) as Relationship[];

    console.log(`📂 Données chargées depuis ${repositoryDir}`);
    console.log(`  - ${objects.length} objets`);
    console.log(`  - ${relationships.length} relations`);

    return {
      repository,
      objects,
      relationships,
    };
  }

  /**
   * Vérifie si une extraction existe pour un repository
   */
  async hasExtraction(repositoryId: string): Promise<boolean> {
    const repositoryDir = path.join(this.dataDir, repositoryId);
    const repositoryPath = path.join(repositoryDir, 'repository.json');
    const objectsPath = path.join(repositoryDir, 'objects.json');
    const relationshipsPath = path.join(repositoryDir, 'relationships.json');

    try {
      await fs.access(repositoryPath);
      await fs.access(objectsPath);
      await fs.access(relationshipsPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Liste tous les repositories pour lesquels une extraction existe
   */
  async listExtractions(): Promise<string[]> {
    await this.ensureDataDir();

    try {
      const entries = await fs.readdir(this.dataDir, { withFileTypes: true });
      const repositoryIds: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const hasExtraction = await this.hasExtraction(entry.name);
          if (hasExtraction) {
            repositoryIds.push(entry.name);
          }
        }
      }

      return repositoryIds;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}










