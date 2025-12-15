'use client';

import { useEffect, useState } from 'react';
import { api, setToastCallback } from '@/lib/api';
import { useToaster } from '@/components/Toaster';
import type { StatsResponse } from '@bizzanalyze/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { addToast } = useToaster();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [hasExtraction, setHasExtraction] = useState(false);

  useEffect(() => {
    // Configurer le callback pour les toasters
    setToastCallback((message, type) => {
      addToast({ message, type, duration: type === 'error' ? 7000 : 5000 });
    });
    
    loadStats();
    checkImportStatus();
  }, [addToast]);

  const checkImportStatus = async () => {
    try {
      const response = await api.getImportStatus();
      if (response.success && response.data) {
        setHasExtraction(response.data.hasExtraction || false);
      }
    } catch (err) {
      // Ignorer les erreurs silencieusement
      console.error('Error checking import status:', err);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    try {
      setExtracting(true);
      setError(null);

      // Écouter les événements de progression
      const closeProgress = api.listenToProgress((data) => {
        if (data.type === 'progress' && data.offset !== undefined) {
          const message = data.total
            ? `📥 Récupération: offset ${data.offset}, ${data.current}/${data.total} objets`
            : `📥 Récupération: offset ${data.offset}, ${data.current} objets`;
          addToast({ message, type: 'info', duration: 3000 });
        } else if (data.type === 'start') {
          addToast({ message: data.message || 'Démarrage...', type: 'info', duration: 2000 });
        } else if (data.type === 'complete') {
          addToast({ message: data.message || 'Terminé', type: 'success', duration: 3000 });
        } else if (data.type === 'error') {
          addToast({ message: data.message || 'Erreur', type: 'error', duration: 5000 });
        }
      });

      try {
        const response = await api.sync();
        if (response.success) {
          // Vérifier le statut d'import après l'extraction
          await checkImportStatus();
          // Le toast sera affiché automatiquement par l'intercepteur
        } else {
          setError(response.error || 'Erreur lors de l\'extraction');
        }
      } finally {
        // Fermer la connexion SSE après un délai pour laisser le temps aux derniers événements
        setTimeout(() => {
          closeProgress();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'extraction');
    } finally {
      setExtracting(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setError(null);

      const response = await api.import();
      if (response.success) {
        // Recharger les stats après l'import
        await loadStats();
        // Le toast sera affiché automatiquement par l'intercepteur
      } else {
        setError(response.error || 'Erreur lors de l\'import');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div style={{ padding: '2rem' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
        <button
          onClick={loadStats}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Tableau de bord</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleExtract}
            disabled={extracting || importing}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: extracting || importing ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: extracting || importing ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {extracting ? 'Extraction...' : '📥 Extraction BizzDesign'}
          </button>
          <button
            onClick={handleImport}
            disabled={!hasExtraction || importing || extracting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: !hasExtraction || importing || extracting ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !hasExtraction || importing || extracting ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {importing ? 'Import...' : '💾 Import Neo4j'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {stats ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <StatCard
              title="Objets totaux"
              value={typeof stats.totalObjects === 'number' ? stats.totalObjects.toLocaleString() : String(stats.totalObjects || 0)}
              icon="📦"
            />
            <StatCard
              title="Relations"
              value={typeof stats.totalRelationships === 'number' ? stats.totalRelationships.toLocaleString() : String(stats.totalRelationships || 0)}
              icon="🔗"
            />
            <StatCard
              title="Types d'objets"
              value={Object.keys(stats.objectsByType || {}).length}
              icon="🏷️"
            />
            {stats.lastSync && (
              <StatCard
                title="Dernière sync"
                value={new Date(stats.lastSync).toLocaleString('fr-FR')}
                icon="🕐"
              />
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2>Répartition par type</h2>
            {stats.objectsByType && Object.keys(stats.objectsByType).length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                {Object.entries(stats.objectsByType).map(([type, count]) => (
                  <div
                    key={type}
                    style={{
                      padding: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {type}
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#0070f3' }}>
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', marginTop: '1rem' }}>
                Aucun objet synchronisé pour le moment
              </p>
            )}
          </div>

          <div>
            <Link
              href="/objects"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              Voir tous les objets →
            </Link>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '2px dashed #ddd',
            borderRadius: '4px',
          }}
        >
          <p style={{ marginBottom: '1rem' }}>
            Aucune donnée importée pour le moment.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleExtract}
              disabled={extracting || importing}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: extracting || importing ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: extracting || importing ? 'not-allowed' : 'pointer',
              }}
            >
              {extracting ? 'Extraction...' : '📥 Extraction BizzDesign'}
            </button>
            <button
              onClick={handleImport}
              disabled={!hasExtraction || importing || extracting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: !hasExtraction || importing || extracting ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !hasExtraction || importing || extracting ? 'not-allowed' : 'pointer',
              }}
            >
              {importing ? 'Import...' : '💾 Import Neo4j'}
            </button>
          </div>
          {!hasExtraction && (
            <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
              Effectuez d'abord une extraction BizzDesign pour pouvoir importer dans Neo4j.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: '1.5rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {value}
      </div>
      <div style={{ color: '#666', fontSize: '0.9rem' }}>{title}</div>
    </div>
  );
}

