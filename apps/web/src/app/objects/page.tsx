'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ObjectItem {
  id: string;
  type: string;
  name: string;
  objectName?: string;
  description?: string;
  properties?: Record<string, any>;
}

export default function ObjectsPage() {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [types, setTypes] = useState<string[]>([]);

  useEffect(() => {
    loadObjects();
    loadTypes();
  }, [page, search, typeFilter]);

  const loadTypes = async () => {
    try {
      const statsResponse = await api.getStats();
      if (statsResponse.success && statsResponse.data?.objectsByType) {
        setTypes(Object.keys(statsResponse.data.objectsByType));
      }
    } catch (err) {
      // Ignore errors for types
    }
  };

  const loadObjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getObjects({
        page,
        pageSize,
        search: search || undefined,
        type: typeFilter || undefined,
      });

      if (response.success && response.data) {
        setObjects(response.data);
        setTotal(response.pagination?.total || 0);
      } else {
        setError(response.error || 'Erreur lors du chargement des objets');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadObjects();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Objets</h1>
        <Link
          href="/dashboard"
          style={{
            padding: '0.5rem 1rem',
            color: '#0070f3',
            textDecoration: 'none',
          }}
        >
          ← Tableau de bord
        </Link>
      </div>

      {/* Filtres */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          >
            <option value="">Tous les types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Rechercher
          </button>
        </form>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Chargement...</p>
        </div>
      ) : objects.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '2px dashed #ddd',
            borderRadius: '4px',
          }}
        >
          <p>Aucun objet trouvé.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', color: '#666' }}>
            {total} objet{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {objects.map((obj) => (
              <Link
                key={obj.id}
                href={`/objects/${obj.id}`}
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.5rem',
                  }}
                >
                  <h3 style={{ margin: 0, color: '#0070f3' }}>{obj.objectName || obj.name}</h3>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {obj.type}
                  </span>
                </div>
                {obj.description && (
                  <p
                    style={{
                      margin: '0.5rem 0 0 0',
                      color: '#666',
                      fontSize: '0.9rem',
                    }}
                  >
                    {obj.description.length > 200
                      ? `${obj.description.substring(0, 200)}...`
                      : obj.description}
                  </p>
                )}
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#999',
                  }}
                >
                  ID: {obj.id}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: page === 0 ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Précédent
              </button>
              <span>
                Page {page + 1} sur {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: page >= totalPages - 1 ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

