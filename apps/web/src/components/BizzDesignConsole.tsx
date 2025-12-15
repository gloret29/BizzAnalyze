'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ApiCallLog {
  timestamp: string;
  method: string;
  url: string;
  params?: Record<string, any>;
  body?: any;
  curl?: string;
  status?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

export function BizzDesignConsole() {
  const [logs, setLogs] = useState<ApiCallLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      // Rafraîchir les logs toutes les 2 secondes quand la console est ouverte
      const interval = setInterval(loadLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll vers le bas quand de nouveaux logs arrivent
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const response = await api.getBizzDesignLogs(50);
      
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (log: ApiCallLog) => {
    if (!log.success) return '#dc3545';
    if (log.status) {
      if (log.status >= 200 && log.status < 300) return '#28a745';
      if (log.status >= 300 && log.status < 400) return '#ffc107';
      if (log.status >= 400) return '#dc3545';
    }
    return '#6c757d';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return '#0070f3';
      case 'POST': return '#28a745';
      case 'PUT': return '#ffc107';
      case 'DELETE': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <>
      {/* Bouton pour ouvrir/fermer la console */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: isOpen ? '300px' : '20px',
          right: '20px',
          zIndex: 9999,
          padding: '0.75rem 1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          transition: 'bottom 0.3s ease',
        }}
      >
        {isOpen ? '▼' : '▲'} Console API BizzDesign {logs.length > 0 && `(${logs.length})`}
      </button>

      {/* Console */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '300px',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            borderTop: '2px solid #0070f3',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {/* En-tête */}
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#252526',
              borderBottom: '1px solid #3e3e42',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#0070f3' }}>
                🔌 Console API BizzDesign
              </span>
              {isLoading && <span style={{ color: '#6c757d' }}>Chargement...</span>}
              <button
                onClick={loadLogs}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#3e3e42',
                  color: '#d4d4d4',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                🔄 Actualiser
              </button>
            </div>
            <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>
              {logs.length} appel{logs.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Liste des logs */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ padding: '1rem', color: '#6c757d', textAlign: 'center' }}>
                Aucun appel API BizzDesign pour le moment
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    backgroundColor: index % 2 === 0 ? '#252526' : '#1e1e1e',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${getStatusColor(log)}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Timestamp */}
                    <span style={{ color: '#6c757d', minWidth: '100px' }}>
                      {formatTimestamp(log.timestamp)}
                    </span>

                    {/* Méthode */}
                    <span
                      style={{
                        color: getMethodColor(log.method),
                        fontWeight: 'bold',
                        minWidth: '60px',
                      }}
                    >
                      {log.method}
                    </span>

                    {/* URL */}
                    <span
                      style={{
                        flex: 1,
                        color: '#d4d4d4',
                        wordBreak: 'break-all',
                        minWidth: '200px',
                      }}
                    >
                      {log.url}
                    </span>

                    {/* Paramètres offset et limit */}
                    {log.params && (log.params.offset !== undefined || log.params.limit !== undefined) && (
                      <span
                        style={{
                          color: '#9cdcfe',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#2d2d30',
                          borderRadius: '4px',
                          minWidth: '120px',
                        }}
                      >
                        {log.params.offset !== undefined && `offset: ${log.params.offset}`}
                        {log.params.offset !== undefined && log.params.limit !== undefined && ' | '}
                        {log.params.limit !== undefined && `limit: ${log.params.limit}`}
                      </span>
                    )}

                    {/* Statut */}
                    {log.status && (
                      <span
                        style={{
                          color: getStatusColor(log),
                          fontWeight: 'bold',
                          minWidth: '50px',
                          textAlign: 'right',
                        }}
                      >
                        {log.status}
                      </span>
                    )}

                    {/* Durée */}
                    <span
                      style={{
                        color: log.duration && log.duration > 1000 ? '#ffc107' : '#6c757d',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}
                    >
                      {formatDuration(log.duration)}
                    </span>

                    {/* Icône de statut */}
                    <span style={{ fontSize: '1rem' }}>
                      {log.success ? '✓' : '✗'}
                    </span>
                  </div>

                  {/* Body de la requête */}
                  {log.body && (
                    <div
                      style={{
                        marginTop: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#1e3a5f',
                        color: '#9cdcfe',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      <strong>Body:</strong>{' '}
                      {typeof log.body === 'string' 
                        ? log.body 
                        : JSON.stringify(log.body, null, 2)}
                    </div>
                  )}

                  {/* Commande curl équivalente */}
                  {log.curl && (
                    <div
                      style={{
                        marginTop: '0.25rem',
                        padding: '0.5rem',
                        backgroundColor: '#2d2d2d',
                        color: '#d4d4d4',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #555',
                      }}
                    >
                      <strong style={{ color: '#4ec9b0' }}>📋 curl:</strong>
                      <div style={{ marginTop: '0.25rem' }}>{log.curl}</div>
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {log.error && (
                    <div
                      style={{
                        marginTop: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#3a1f1f',
                        color: '#ff6b6b',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {log.error}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  );
}

