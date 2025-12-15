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
            borderBottom: '1px solid #ddd',
            padding: '1rem 2rem',
            backgroundColor: 'white',
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
                color: '#0070f3',
                textDecoration: 'none',
              }}
            >
              BizzAnalyze
            </Link>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <Link
                href="/dashboard"
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                }}
              >
                Tableau de bord
              </Link>
              <Link
                href="/objects"
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                }}
              >
                Objets
              </Link>
              <Link
                href="/graph"
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                }}
              >
                📊 Graphe
              </Link>
              <Link
                href="/export"
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                }}
              >
                💾 Export
              </Link>
              <Link
                href="/analyze"
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                }}
              >
                🔍 Analyses
              </Link>
              <Link
                href="/settings"
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                }}
              >
                ⚙️ Paramètres
              </Link>
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

