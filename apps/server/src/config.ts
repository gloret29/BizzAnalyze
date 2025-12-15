import dotenv from 'dotenv';

dotenv.config();

export const config = {
  bizzdesign: {
    apiUrl: process.env.BIZZDESIGN_API_URL || 'https://arkea.horizzon.cloud/api/3.0',
    clientId: process.env.BIZZDESIGN_CLIENT_ID || '',
    clientSecret: process.env.BIZZDESIGN_CLIENT_SECRET || '',
    repositoryId: process.env.BIZZDESIGN_REPOSITORY_ID || '',
  },
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || '',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY || '',
  },
};

// Validation des variables critiques
if (!config.bizzdesign.apiUrl) {
  console.warn('⚠️  BIZZDESIGN_API_URL n\'est pas défini');
}

if (!config.bizzdesign.clientId || !config.bizzdesign.clientSecret) {
  console.warn('⚠️  BIZZDESIGN_CLIENT_ID ou BIZZDESIGN_CLIENT_SECRET manquants');
}

if (!config.neo4j.password) {
  console.warn('⚠️  NEO4J_PASSWORD n\'est pas défini');
}

