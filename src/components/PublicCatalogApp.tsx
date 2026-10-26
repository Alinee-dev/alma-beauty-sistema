import { useCallback, useEffect, useState } from 'react';
import { CustomerCatalog } from './CustomerCatalog';
import { fetchPublicCatalog, type PublicCatalogData } from '../services/publicCatalog';

const REFRESH_INTERVAL_MS = 30_000;

export const PublicCatalogApp = () => {
  const [catalog, setCatalog] = useState<PublicCatalogData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await fetchPublicCatalog();
      setCatalog(data);
      setError(null);
    } catch (cause: unknown) {
      console.error('Error cargando el catálogo público:', cause);
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => void refreshCatalog(), 0);
    const intervalId = window.setInterval(() => void refreshCatalog(), REFRESH_INTERVAL_MS);
    const handleFocus = () => void refreshCatalog();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshCatalog]);

  if (isLoading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando catálogo...</p>
      </main>
    );
  }

  if (error || !catalog) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
        }}
      >
        <section className="glass-panel" style={{ maxWidth: '520px', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '0.75rem' }}>No se pudo cargar el catálogo</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => void refreshCatalog()}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1rem' }}>
      <CustomerCatalog products={catalog.products} settings={catalog.settings} />
    </main>
  );
};
