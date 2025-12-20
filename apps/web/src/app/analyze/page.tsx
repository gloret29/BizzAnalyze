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
      <h1 style={{ color: 'var(--text-primary)' }}>Analyses de graphe</h1>

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
            backgroundColor: analysisType === 'centrality' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: analysisType === 'centrality' ? 'white' : 'var(--text-primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: analysisType === 'centrality' ? 'bold' : 'normal',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (analysisType !== 'centrality') {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (analysisType !== 'centrality') {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }
          }}
        >
          📊 Centralité
        </button>
        <button
          onClick={() => setAnalysisType('paths')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: analysisType === 'paths' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: analysisType === 'paths' ? 'white' : 'var(--text-primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: analysisType === 'paths' ? 'bold' : 'normal',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (analysisType !== 'paths') {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (analysisType !== 'paths') {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }
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
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Analyse de centralité</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Identifie les objets les plus importants dans votre architecture selon différents critères.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
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
                  border: centralityType === 'degree' ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: centralityType === 'degree' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
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
                  border: centralityType === 'pagerank' ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: centralityType === 'pagerank' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
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
              backgroundColor: analyzing ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!analyzing) {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!analyzing) {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
              }
            }}
          >
            {analyzing ? '⏳ Analyse en cours...' : '▶️ Lancer l\'analyse'}
          </button>

          {/* Résultats */}
          {centralityResults && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Résultats (Top 20)</h3>
              <div
                style={{
                  marginTop: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'auto',
                  maxHeight: '600px',
                  backgroundColor: 'var(--bg-tertiary)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-card)', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        Rang
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        Nom
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        Type
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        Score
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {centralityResults.slice(0, 20).map((result, index) => (
                      <tr
                        key={result.nodeId}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: index % 2 === 0 ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                        }}
                      >
                        <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>#{index + 1}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {result.nodeName}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {result.nodeType}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {result.score.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <Link
                            href={`/objects/${result.nodeId}`}
                            style={{
                              color: 'var(--accent-primary)',
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
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Analyse de chemins</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Trouve les chemins entre deux objets dans votre architecture.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
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
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
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
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
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
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
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
                  color: 'var(--text-primary)',
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
              backgroundColor: analyzing || !sourceId || !targetId ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: analyzing || !sourceId || !targetId ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!analyzing && sourceId && targetId) {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!analyzing && sourceId && targetId) {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
              }
            }}
          >
            {analyzing ? '⏳ Recherche en cours...' : '▶️ Chercher le(s) chemin(s)'}
          </button>

          {/* Résultats */}
          {pathResults && (
            <div style={{ marginTop: '2rem' }}>
              {findAll && pathResults.paths ? (
                <>
                  <h3 style={{ color: 'var(--text-primary)' }}>{pathResults.paths.length} chemin(s) trouvé(s)</h3>
                  {pathResults.paths.map((path: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)' }}>Chemin #{index + 1}</strong> (longueur: {path.length})
                      <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {path.nodes.map((node: any, i: number) => (
                          <span key={node.id}>
                            {i > 0 && ' → '}
                            <Link
                              href={`/objects/${node.id}`}
                              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
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
                  <h3 style={{ color: 'var(--text-primary)' }}>Chemin trouvé</h3>
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>Longueur:</strong> {pathResults.path.length} relation(s)
                    <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {pathResults.path.nodes.map((node: any, i: number) => (
                        <span key={node.id}>
                          {i > 0 && ' → '}
                          <Link
                            href={`/objects/${node.id}`}
                            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
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
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid var(--accent-warning)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent-warning)',
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

















