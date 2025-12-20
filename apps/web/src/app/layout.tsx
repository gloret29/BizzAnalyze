import type { Metadata } from 'next';
import Link from 'next/link';
import { ToasterProvider } from '@/components/Toaster';
import { BizzDesignConsole } from '@/components/BizzDesignConsole';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizzAnalyze - Plateforme d\'analyse d\'architecture',
  description: 'Analyse et visualisation des objets BizzDesign',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ToasterProvider>
          <nav
          style={{
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 2rem',
            backgroundColor: 'var(--bg-card)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--shadow-md)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Link
              href="/"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              BizzAnalyze
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/dashboard">Tableau de bord</Link>
              <Link href="/objects">Objets</Link>
              <Link href="/graph">📊 Graphe</Link>
              <Link href="/export">💾 Export</Link>
              <Link href="/analyze">🔍 Analyses</Link>
              <Link href="/settings">⚙️ Paramètres</Link>
            </div>
          </div>
        </nav>
        {children}
        <BizzDesignConsole />
        </ToasterProvider>
      </body>
    </html>
  );
}

