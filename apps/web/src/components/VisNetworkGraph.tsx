'use client';

import { useEffect, useRef, useState } from 'react';

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
}

interface VisNetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
}

export function VisNetworkGraph({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
}: VisNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const visNetworkModuleRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger vis-network une seule fois
  useEffect(() => {
    let mounted = true;

    import('vis-network/standalone')
      .then((module) => {
        if (mounted) {
          visNetworkModuleRef.current = module;
          setIsLoaded(true);
        }
      })
      .catch((error) => {
        console.error('[VIS NETWORK] Erreur lors du chargement de vis-network:', error);
        if (mounted) {
          setIsLoaded(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialiser le graphe
  useEffect(() => {
    if (!isLoaded || !visNetworkModuleRef.current || !containerRef.current || nodes.length === 0) {
      return;
    }

    const visNetwork = visNetworkModuleRef.current;

    // Nettoyer l'instance précédente
    if (networkRef.current) {
      try {
        networkRef.current.destroy();
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }
      networkRef.current = null;
    }

    // Attendre que React termine le rendu
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) {
        console.error('[VIS NETWORK] containerRef.current est null!');
        return;
      }

      try {
        const nodesDataSet = new visNetwork.DataSet(
          nodes.map((node) => ({
            id: node.id,
            label: node.label || node.id.substring(0, 20),
            title: `${node.type}\n${node.category || ''}`,
            group: node.category || node.type,
            shape: 'box',
          }))
        );

        const edgesDataSet = new visNetwork.DataSet(
          edges.map((edge) => ({
            id: edge.id,
            from: edge.from,
            to: edge.to,
            label: edge.type || '',
            arrows: 'to',
          }))
        );

        const options = {
          nodes: {
            shape: 'box',
            font: { size: 14 },
            borderWidth: 2,
            shadow: true,
          },
          edges: {
            arrows: { to: { enabled: true } },
            smooth: { type: 'continuous' },
            font: { size: 12, align: 'middle' },
          },
          physics: {
            enabled: true,
            stabilization: { enabled: true, iterations: 100 },
          },
          interaction: {
            hover: true,
            tooltipDelay: 200,
            zoomView: true,
            dragView: true,
          },
          layout: {
            improvedLayout: true,
          },
        };

        const network = new visNetwork.Network(
          containerRef.current,
          { nodes: nodesDataSet, edges: edgesDataSet },
          options
        );

        if (onNodeClick) {
          network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
              onNodeClick(params.nodes[0]);
            }
          });
        }

        if (onNodeDoubleClick) {
          network.on('doubleClick', (params: any) => {
            if (params.nodes.length > 0) {
              onNodeDoubleClick(params.nodes[0]);
            }
          });
        }

        networkRef.current = network;
      } catch (error) {
        console.error('[VIS NETWORK] Error creating network:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (networkRef.current) {
        try {
          networkRef.current.destroy();
        } catch (e) {
          // Ignorer les erreurs
        }
        networkRef.current = null;
      }
    };
  }, [isLoaded, nodes, edges, onNodeClick, onNodeDoubleClick]);

  // Nettoyage final
  useEffect(() => {
    return () => {
      if (networkRef.current) {
        try {
          networkRef.current.destroy();
        } catch (e) {
          // Ignorer les erreurs
        }
        networkRef.current = null;
      }
    };
  }, []);

  if (!isLoaded) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p>📦 Installation requise</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Installez vis-network pour la visualisation interactive
          </p>
          <code
            style={{
              display: 'block',
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
            }}
          >
            cd apps/web && npm install vis-network
          </code>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#999' }}>
            Vérifiez la console pour plus de détails
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}





