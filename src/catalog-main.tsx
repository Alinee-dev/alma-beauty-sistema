import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PublicCatalogApp } from './components/PublicCatalogApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PublicCatalogApp />
  </StrictMode>,
);
