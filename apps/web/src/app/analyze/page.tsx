'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToaster } from '@/components/Toaster';
import Link from 'next/link';

interface CentralityResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  score: number;
}

export default function AnalyzePage() {
  const { addToast } = useToaster();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'centrality' | 'paths'>('centrality');
  const [centralityType, setCentralityType] = useState<'degree' | 'pagerank'>('degree');
  const [centralityResults, setCentralityResults] = useState<CentralityResult[] | null>(null);
  
  // Pour l'analyse de chemins
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [maxDepth, setMaxDepth] = useState(10);
  const [findAll, setFindAll] = useState(false);
  const [pathResults, setPathResults] = useState<any>(null);

  const handleCentralityAnalysis = async () => {
    try {
      setAnalyzing(true);
      addToast({ message: `Analyse de centralité (${centralityType}) en cours...`, type: 'info' });

      const response = await api.analyzeCentrality(centralityType);

      if (response.success && response.data) {
        setCentralityResults(response.data.results);
        addToast({
          message: `Analyse terminée : ${response.data.results.length} nœuds analysés`,
          type: 'success',
        });
      } else {
        addToast({
          message: response.error || 'Erreur lors de l\'analyse',
          type: 'error',
        });
      }
    } catch (error: any) {
      addToast({
        message: `Erreur: ${error.message || 'Erreur inconnue'}`,
        type: 'error',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePathAnalysis = async () => {
    if (!sourceId || !targetId) {
      addToast({ message: 'Veuillez saisir les IDs source et target', type: 'error' });
      return;
    }

    try {
      setAnalyzing(true);
      addToast({ message: 'Recherche des chemins en cours...', type: 'info' });

      const response = await api.analyzePaths(sourceId, targetId, {
        findAll,
        maxDepth,
      });

      if (response.success && response.data) {
        setPathResults(response.data);
        addToast({
          message: findAll
            ? `${response.data.paths?.length || 0} chemins trouvés`
            : response.data.path
            ? 'Chemin trouvé'
            : 'Aucun chemin trouvé',
          type: response.data.path || response.data.paths?.length ? 'success' : 'warning',
        });
      } else {
        addToast({
          message: response.error || 'Erreur lors de l\'analyse',
          type: 'error',
        });
      }
    } catch (error: any) {
      addToast({
        message: `Erreur: ${error.message || 'Erreur inconnue'}`,
        type: 'error',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Analyses de graphe</h1>

      {/* Sélection du type d'analyse */}
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button
          onClick={() => setAnalysisType('centrality')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: analysisType === 'centrality' ? '#0070f3' : '#f0f0f0',
            color: analysisType === 'centrality' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: analysisType === 'centrality' ? 'bold' : 'normal',
          }}
        >
          📊 Centralité
        </button>
        <button
          onClick={() => setAnalysisType('paths')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: analysisType === 'paths' ? '#0070f3' : '#f0f0f0',
            color: analysisType === 'paths' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: analysisType === 'paths' ? 'bold' : 'normal',
          }}
        >
          🛤️ Chemins
        </button>
      </div>

      {/* Analyse de centralité */}
      {analysisType === 'centrality' && (
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Analyse de centralité</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Identifie les objets les plus importants dans votre architecture selon différents critères.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Type d'analyse
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem 1rem',
                  border: centralityType === 'degree' ? '2px solid #0070f3' : '2px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: centralityType === 'degree' ? '#e6f2ff' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="centralityType"
                  value="degree"
                  checked={centralityType === 'degree'}
                  onChange={(e) => setCentralityType(e.target.value as 'degree')}
                />
                Degree (nombre de connexions)
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem 1rem',
                  border: centralityType === 'pagerank' ? '2px solid #0070f3' : '2px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: centralityType === 'pagerank' ? '#e6f2ff' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="centralityType"
                  value="pagerank"
                  checked={centralityType === 'pagerank'}
                  onChange={(e) => setCentralityType(e.target.value as 'pagerank')}
                />
                PageRank (importance globale)
              </label>
            </div>
          </div>

          <button
            onClick={handleCentralityAnalysis}
            disabled={analyzing}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: analyzing ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {analyzing ? '⏳ Analyse en cours...' : '▶️ Lancer l\'analyse'}
          </button>

          {/* Résultats */}
          {centralityResults && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Résultats (Top 20)</h3>
              <div
                style={{
                  marginTop: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '600px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Rang
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Nom
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Type
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                        Score
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {centralityResults.slice(0, 20).map((result, index) => (
                      <tr
                        key={result.nodeId}
                        style={{
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>#{index + 1}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                          {result.nodeName}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
                          {result.nodeType}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                          {result.score.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <Link
                            href={`/objects/${result.nodeId}`}
                            style={{
                              color: '#0070f3',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                            }}
                          >
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analyse de chemins */}
      {analysisType === 'paths' && (
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Analyse de chemins</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Trouve les chemins entre deux objets dans votre architecture.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                ID Source
              </label>
              <input
                type="text"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                placeholder="ID de l'objet source"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                ID Target
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="ID de l'objet cible"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Profondeur max
              </label>
              <input
                type="number"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value) || 10)}
                min="1"
                max="20"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={findAll}
                  onChange={(e) => setFindAll(e.target.checked)}
                />
                <strong>Trouver tous les chemins</strong>
              </label>
            </div>
          </div>

          <button
            onClick={handlePathAnalysis}
            disabled={analyzing || !sourceId || !targetId}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: analyzing || !sourceId || !targetId ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: analyzing || !sourceId || !targetId ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {analyzing ? '⏳ Recherche en cours...' : '▶️ Chercher le(s) chemin(s)'}
          </button>

          {/* Résultats */}
          {pathResults && (
            <div style={{ marginTop: '2rem' }}>
              {findAll && pathResults.paths ? (
                <>
                  <h3>{pathResults.paths.length} chemin(s) trouvé(s)</h3>
                  {pathResults.paths.map((path: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    >
                      <strong>Chemin #{index + 1}</strong> (longueur: {path.length})
                      <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                        {path.nodes.map((node: any, i: number) => (
                          <span key={node.id}>
                            {i > 0 && ' → '}
                            <Link
                              href={`/objects/${node.id}`}
                              style={{ color: '#0070f3', textDecoration: 'none' }}
                            >
                              {node.name || node.id}
                            </Link>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : pathResults.path ? (
                <>
                  <h3>Chemin trouvé</h3>
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <strong>Longueur:</strong> {pathResults.path.length} relation(s)
                    <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                      {pathResults.path.nodes.map((node: any, i: number) => (
                        <span key={node.id}>
                          {i > 0 && ' → '}
                          <Link
                            href={`/objects/${node.id}`}
                            style={{ color: '#0070f3', textDecoration: 'none' }}
                          >
                            {node.name || node.id}
                          </Link>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    color: '#856404',
                  }}
                >
                  Aucun chemin trouvé entre ces deux objets.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}






