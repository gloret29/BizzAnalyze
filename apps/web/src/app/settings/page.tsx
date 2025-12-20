'use client';

import { useEffect, useState } from 'react';
import { api, setToastCallback } from '@/lib/api';
import { useToaster } from '@/components/Toaster';
import Link from 'next/link';

interface Repository {
  id: string;
  name: string;
  description?: string;
}

export default function SettingsPage() {
  const { addToast } = useToaster();
  
  // Configuration state
  const [apiUrl, setApiUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [hasSecret, setHasSecret] = useState(false);
  const [repositoryId, setRepositoryId] = useState('');

  // Repositories list
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepositories, setLoadingRepositories] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Configurer le callback pour les toasters
    setToastCallback((message, type) => {
      addToast({ message, type, duration: type === 'error' ? 7000 : 5000 });
    });
    
    loadConfig();
  }, [addToast]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getConfig();

      if (response.success && response.data) {
        setApiUrl(response.data.apiUrl || 'https://arkea.horizzon.cloud/api/3.0');
        setClientId(response.data.clientId || '');
        setHasSecret(response.data.hasSecret || false);
        setRepositoryId(response.data.repositoryId || '');

        // Ne pas charger automatiquement les repositories
        // L'utilisateur devra cliquer sur le bouton de rafraîchissement
        // après avoir vérifié que la connexion fonctionne
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = async () => {
    try {
      setLoadingRepositories(true);
      setError(null);
      
      // Vérifier d'abord que la configuration est complète
      if (!apiUrl || !clientId || (!clientSecret && !hasSecret)) {
        setError('Veuillez d\'abord configurer et sauvegarder vos identifiants API BizzDesign');
        return;
      }

      const response = await api.getRepositories();

      if (response.success && response.data) {
        setRepositories(response.data);
      } else {
        // Afficher l'erreur si l'authentification a échoué
        if (response.error?.includes('token') || response.error?.includes('authentification')) {
          setError(response.error);
        } else {
          console.warn('Impossible de charger les repositories:', response.error);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors du chargement des repositories';
      if (errorMessage.includes('token') || errorMessage.includes('authentification')) {
        setError(errorMessage);
      } else {
        console.warn('Erreur lors du chargement des repositories:', errorMessage);
      }
    } finally {
      setLoadingRepositories(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiUrl || !clientId || (!clientSecret && !hasSecret)) {
      setError('Veuillez remplir tous les champs de connexion');
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const response = await api.testConnection({
        apiUrl,
        clientId,
        clientSecret: clientSecret || 'EXISTING_SECRET',
      });

      if (response.success) {
        setSuccess('✓ Connexion réussie à l\'API BizzDesign');
        // Charger les repositories après une connexion réussie
        await loadRepositories();
      } else {
        setError(response.error || 'Échec de la connexion');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du test de connexion');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await api.updateConfig({
        apiUrl,
        clientId,
        clientSecret: clientSecret || undefined,
        repositoryId,
      });

      if (response.success) {
        setSuccess('✓ Configuration sauvegardée');
        setHasSecret(true);
        setClientSecret(''); // Clear the secret field after save
      } else {
        setError(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectRepository = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setRepositoryId(selectedId);

    if (selectedId) {
      try {
        const response = await api.selectRepository(selectedId);
        if (response.success) {
          setSuccess('✓ Repository sélectionné');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la sélection');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>⚙️ Paramètres</h1>
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

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#c00',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#060',
          }}
        >
          {success}
        </div>
      )}

      {/* Section Configuration API BizzDesign */}
      <section
        style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          🔌 Configuration de l'API BizzDesign
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
            }}
          >
            URL de l'API
          </label>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://arkea.horizzon.cloud/api/3.0"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
            }}
          >
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Votre Client ID OAuth2"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
            }}
          >
            Client Secret
            {hasSecret && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  color: 'var(--accent-success)',
                  fontWeight: 'normal',
                  fontSize: '0.875rem',
                }}
              >
                (déjà configuré)
              </span>
            )}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={hasSecret ? '••••••••••••••••' : 'Votre Client Secret OAuth2'}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          />
          {hasSecret && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Laissez vide pour conserver le secret actuel
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleTestConnection}
            disabled={testing || !apiUrl || !clientId}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: testing ? 'var(--bg-tertiary)' : 'var(--accent-success)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: testing || !apiUrl || !clientId ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!testing && apiUrl && clientId) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!testing && apiUrl && clientId) {
                e.currentTarget.style.backgroundColor = 'var(--accent-success)';
              }
            }}
          >
            {testing ? 'Test en cours...' : '🔗 Tester la connexion'}
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving || !apiUrl || !clientId}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: saving ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: saving || !apiUrl || !clientId ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!saving && apiUrl && clientId) {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && apiUrl && clientId) {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
              }
            }}
          >
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </section>

      {/* Section Sélection du Repository */}
      <section
        style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          📦 Sélection du Repository
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
            }}
          >
            Repository
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={repositoryId}
              onChange={handleSelectRepository}
              disabled={loadingRepositories || repositories.length === 0}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">
                {loadingRepositories
                  ? 'Chargement...'
                  : repositories.length === 0
                  ? 'Configurez d\'abord l\'API BizzDesign'
                  : 'Sélectionnez un Repository'}
              </option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name} {repo.description ? `- ${repo.description}` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={loadRepositories}
              disabled={loadingRepositories || !apiUrl || !clientId || !hasSecret}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: loadingRepositories ? 'var(--bg-tertiary)' : 'var(--bg-hover)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: loadingRepositories ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
              }}
            >
              🔄
            </button>
          </div>
        </div>

        {repositoryId && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1rem',
            }}
          >
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              <strong>Repository sélectionné :</strong>{' '}
              {repositories.find((repo) => repo.id === repositoryId)?.name || repositoryId}
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ID: <code style={{ color: 'var(--accent-primary)' }}>{repositoryId}</code>
            </p>
          </div>
        )}

        {!hasSecret && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--accent-warning)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1rem',
            }}
          >
            <p style={{ margin: 0, color: 'var(--accent-warning)' }}>
              ⚠️ Pour charger la liste des Repositories, veuillez d'abord configurer
              et sauvegarder vos identifiants API BizzDesign.
            </p>
          </div>
        )}
      </section>

      {/* Actions rapides */}
      {repositoryId && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            }}
          >
            Aller au tableau de bord →
          </Link>
        </div>
      )}
    </div>
  );
}

