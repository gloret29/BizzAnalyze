'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ObjectDetails {
  id: string;
  type: string;
  name: string;
  description?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  relationships?: {
    outgoing?: Array<{ id: string; name: string; type: string }>;
    incoming?: Array<{ id: string; name: string; type: string }>;
  };
}

export default function ObjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [object, setObject] = useState<ObjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadObject();
    }
  }, [id]);

  const loadObject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getObject(id);

      if (response.success && response.data) {
        setObject(response.data);
      } else {
        setError(response.error || 'Objet non trouvé');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <strong>Erreur :</strong> {error || 'Objet non trouvé'}
        </div>
        <Link
          href="/objects"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            color: '#0070f3',
            textDecoration: 'none',
          }}
        >
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/objects"
          style={{
            display: 'inline-block',
            marginBottom: '1rem',
            color: '#0070f3',
            textDecoration: 'none',
          }}
        >
          ← Retour à la liste
        </Link>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>{object.name}</h1>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '12px',
                fontSize: '0.875rem',
              }}
            >
              {object.type}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Description */}
        {object.description && (
          <section>
            <h2>Description</h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {object.description}
            </p>
          </section>
        )}

        {/* Tags */}
        {object.tags && object.tags.length > 0 && (
          <section>
            <h2>Tags</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {object.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Relations sortantes */}
        {object.relationships?.outgoing && object.relationships.outgoing.length > 0 && (
          <section>
            <h2>Relations sortantes</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {object.relationships.outgoing.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/objects/${rel.id}`}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {rel.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Type: {rel.type}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Relations entrantes */}
        {object.relationships?.incoming && object.relationships.incoming.length > 0 && (
          <section>
            <h2>Relations entrantes</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {object.relationships.incoming.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/objects/${rel.id}`}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {rel.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    Type: {rel.type}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Propriétés */}
        {object.properties && Object.keys(object.properties).length > 0 && (
          <section>
            <h2>Propriétés</h2>
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9f9f9' }}>
                  <tr>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Clé
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Valeur
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(object.properties).map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        {key}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Métadonnées */}
        {object.metadata && Object.keys(object.metadata).length > 0 && (
          <section>
            <h2>Métadonnées</h2>
            <pre
              style={{
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(object.metadata, null, 2)}
            </pre>
          </section>
        )}

        {/* ID */}
        <section>
          <h2>Informations techniques</h2>
          <div style={{ color: '#666', fontFamily: 'monospace' }}>
            ID: {object.id}
          </div>
        </section>
      </div>
    </div>
  );
}


















