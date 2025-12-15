'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useToaster } from '@/components/Toaster';
import { VisNetworkGraph } from '@/components/VisNetworkGraph';
import Link from 'next/link';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category?: string;
  subCategory?: string;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  label?: string;
  fromName?: string;
  toName?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function GraphPage() {
  const { addToast } = useToaster();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(500);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Ref pour éviter les appels multiples
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadGraph = useCallback(async (showToast = true) => {
    // Éviter les appels concurrents
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const params: any = { limit };
      if (typeFilter) params.type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await api.getGraph(params);

      if (response.success && response.data) {
        setGraphData(response.data);
        if (showToast && !hasLoadedRef.current) {
          addToast({
            message: `Graphe chargé: ${response.data.nodes.length} nœuds, ${response.data.edges.length} relations`,
            type: 'success',
          });
          hasLoadedRef.current = true;
        }
      } else {
        setError(response.error || 'Erreur lors du chargement du graphe');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur');
      addToast({ message: 'Erreur lors du chargement du graphe', type: 'error' });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [limit, typeFilter, searchQuery, addToast]);

  // Charger une seule fois au montage
  useEffect(() => {
    loadGraph(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNodeNeighbors = useCallback(
    async (nodeId: string) => {
      if (isLoadingRef.current) return;
      
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setSelectedNode(nodeId);
        const response = await api.getNodeNeighbors(nodeId, 1);
        if (response.success && response.data) {
          setGraphData(response.data);
          addToast({
            message: `Voisins chargés: ${response.data.nodes.length} nœuds`,
            type: 'success',
          });
        }
      } catch (err: any) {
        addToast({ message: 'Erreur lors du chargement des voisins', type: 'error' });
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [addToast]
  );

  const resetView = useCallback(() => {
    setSelectedNode(null);
    setSearchQuery('');
    setTypeFilter('');
    hasLoadedRef.current = false;
    loadGraph(true);
  }, [loadGraph]);

  // Handler pour appliquer les filtres manuellement
  const applyFilters = useCallback(() => {
    hasLoadedRef.current = false;
    loadGraph(true);
  }, [loadGraph]);

  return (
    <div style={{ padding: '2rem', maxWidth: '100%', height: 'calc(100vh - 80px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h1>Visualisation du Graphe</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={resetView}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Recherche
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un nœud..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Type
          </label>
          <input
            type="text"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder="Filtrer par type..."
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
            Limite
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value={100}>100 nœuds</option>
            <option value={250}>250 nœuds</option>
            <option value={500}>500 nœuds</option>
            <option value={1000}>1000 nœuds</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={applyFilters}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔍 Appliquer
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

      {/* Zone de visualisation */}
      <div
        style={{
          width: '100%',
          height: 'calc(100% - 200px)',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white',
          position: 'relative',
        }}
      >
        {loading ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <p>Chargement du graphe...</p>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#666',
            }}
          >
            <p>Aucune donnée à afficher.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Synchronisez d'abord vos données depuis BizzDesign.
            </p>
          </div>
        ) : (
          <VisNetworkGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeClick={setSelectedNode}
            onNodeDoubleClick={loadNodeNeighbors}
          />
        )}
      </div>

      {/* Informations */}
      {!loading && graphData.nodes.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#666',
          }}
        >
          <strong>📊 Statistiques :</strong> {graphData.nodes.length} nœuds,{' '}
          {graphData.edges.length} relations
          {selectedNode && (
            <span>
              {' '}
              | <strong>Nœud sélectionné :</strong>{' '}
              <Link
                href={`/objects/${selectedNode}`}
                style={{ color: '#0070f3', textDecoration: 'none' }}
              >
                {selectedNode}
              </Link>
            </span>
          )}
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            💡 Astuce : Double-cliquez sur un nœud pour voir ses voisins
          </div>
        </div>
      )}
    </div>
  );
}





