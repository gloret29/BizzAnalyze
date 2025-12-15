'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToaster } from '@/components/Toaster';

export default function ExportPage() {
  const { addToast } = useToaster();
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [includeRelationships, setIncludeRelationships] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleExport = async () => {
    try {
      setExporting(true);
      addToast({ message: `Export ${format.toUpperCase()} en cours...`, type: 'info' });

      const filters: any = {};
      if (typeFilter) filters.type = typeFilter;
      if (searchQuery) filters.search = searchQuery;

      const blob = await api.export({
        format,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        includeRelationships,
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const extension = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'xlsx';
      a.download = `bizzanalyze-export-${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast({
        message: `Export ${format.toUpperCase()} réussi !`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Export error:', error);
      addToast({
        message: `Erreur lors de l'export: ${error.message || 'Erreur inconnue'}`,
        type: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Export de données</h1>

      <div
        style={{
          marginTop: '2rem',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Options d'export</h2>

        {/* Format */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            Format d'export
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                border: format === 'csv' ? '2px solid #0070f3' : '2px solid #ddd',
                borderRadius: '4px',
                backgroundColor: format === 'csv' ? '#e6f2ff' : 'white',
              }}
            >
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'csv')}
                style={{ cursor: 'pointer' }}
              />
              CSV
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                border: format === 'json' ? '2px solid #0070f3' : '2px solid #ddd',
                borderRadius: '4px',
                backgroundColor: format === 'json' ? '#e6f2ff' : 'white',
              }}
            >
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json')}
                style={{ cursor: 'pointer' }}
              />
              JSON
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                border: format === 'excel' ? '2px solid #0070f3' : '2px solid #ddd',
                borderRadius: '4px',
                backgroundColor: format === 'excel' ? '#e6f2ff' : 'white',
              }}
            >
              <input
                type="radio"
                name="format"
                value="excel"
                checked={format === 'excel'}
                onChange={(e) => setFormat(e.target.value as 'excel')}
                style={{ cursor: 'pointer' }}
              />
              Excel (CSV pour l'instant)
            </label>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Filtres (optionnels)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                }}
              >
                Type d'objet
              </label>
              <input
                type="text"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                placeholder="Ex: ArchiMate:BusinessProcess"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                }}
              >
                Recherche
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les noms..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            <input
              type="checkbox"
              checked={includeRelationships}
              onChange={(e) => setIncludeRelationships(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <strong>Inclure les relations</strong>
          </label>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem', marginLeft: '1.5rem' }}>
            Si coché, les relations entre objets seront incluses dans l'export (pour JSON uniquement)
          </p>
        </div>

        {/* Bouton d'export */}
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: exporting ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          {exporting ? '⏳ Export en cours...' : `📥 Exporter en ${format.toUpperCase()}`}
        </button>
      </div>

      {/* Informations */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          border: '1px solid #b3d9ff',
        }}
      >
        <h3 style={{ marginTop: 0 }}>ℹ️ Informations</h3>
        <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
          <li>
            <strong>CSV</strong> : Format tableur, parfait pour Excel ou Google Sheets
          </li>
          <li>
            <strong>JSON</strong> : Format structuré, inclut toutes les propriétés et relations
          </li>
          <li>
            <strong>Excel</strong> : Actuellement exporté en CSV (support Excel complet à venir)
          </li>
          <li>
            Les exports peuvent prendre quelques secondes selon la taille des données
          </li>
          <li>
            Limite de sécurité : 50 000 objets maximum par export
          </li>
        </ul>
      </div>
    </div>
  );
}






