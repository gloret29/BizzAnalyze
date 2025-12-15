import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>BizzAnalyze</h1>
        <p style={{ fontSize: '1.25rem', color: '#666' }}>
          Plateforme d&apos;analyse et de modélisation d&apos;architecture d&apos;entreprise
        </p>
      </div>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}
      >
        <FeatureCard
          icon="📥"
          title="Synchronisation"
          description="Récupération automatique des objets depuis BizzDesign API v3 avec gestion de la pagination"
        />
        <FeatureCard
          icon="🗄️"
          title="Stockage Graph"
          description="Stockage dans Neo4j pour une modélisation naturelle des relations entre objets"
        />
        <FeatureCard
          icon="📊"
          title="Visualisation"
          description="Interface web interactive pour explorer et analyser les données"
        />
        <FeatureCard
          icon="📈"
          title="Analyses"
          description="Analyses de graphe avancées (centralité, communautés, chemins)"
        />
        <FeatureCard
          icon="📤"
          title="Export"
          description="Export des données dans différents formats (CSV, JSON, Excel, PDF)"
        />
        <FeatureCard
          icon="🔌"
          title="API REST"
          description="API complète pour intégrer BizzAnalyze dans vos outils"
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1.125rem',
            fontWeight: 'bold',
          }}
        >
          Accéder au tableau de bord →
        </Link>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: '2rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#666', lineHeight: '1.6' }}>{description}</p>
    </div>
  );
}

