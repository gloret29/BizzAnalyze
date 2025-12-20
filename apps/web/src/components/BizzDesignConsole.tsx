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
    if (!log.success) return 'var(--accent-error)';
    if (log.status) {
      if (log.status >= 200 && log.status < 300) return 'var(--accent-success)';
      if (log.status >= 300 && log.status < 400) return 'var(--accent-warning)';
      if (log.status >= 400) return 'var(--accent-error)';
    }
    return 'var(--text-tertiary)';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'var(--accent-primary)';
      case 'POST': return 'var(--accent-success)';
      case 'PUT': return 'var(--accent-warning)';
      case 'DELETE': return 'var(--accent-error)';
      default: return 'var(--text-secondary)';
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
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
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
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            borderTop: '2px solid var(--accent-primary)',
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
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                🔌 Console API BizzDesign
              </span>
              {isLoading && <span style={{ color: 'var(--text-tertiary)' }}>Chargement...</span>}
              <button
                onClick={loadLogs}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
              >
                🔄 Actualiser
              </button>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
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
              <div style={{ padding: '1rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Aucun appel API BizzDesign pour le moment
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    backgroundColor: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${getStatusColor(log)}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Timestamp */}
                    <span style={{ color: 'var(--text-tertiary)', minWidth: '100px' }}>
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
                        color: 'var(--text-primary)',
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
                          color: 'var(--accent-info)',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
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
                        color: log.duration && log.duration > 1000 ? 'var(--accent-warning)' : 'var(--text-tertiary)',
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
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent-info)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-color)',
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
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <strong style={{ color: 'var(--accent-success)' }}>📋 curl:</strong>
                      <div style={{ marginTop: '0.25rem' }}>{log.curl}</div>
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {log.error && (
                    <div
                      style={{
                        marginTop: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--accent-error)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        border: '1px solid var(--accent-error)',
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

