import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OsApp, createOsClient } from '@os/core';
import { dobroManifest } from './manifest';
import { registry } from './registry';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

// Cliente de API do app: fala com a API Hono (/api/query, /api/auth/*) via o
// proxy do Vite. Config vem de `manifest.dataApi` (só base URL pública — a
// connection string da Neon vive server-side, NUNCA aqui/no bundle).
const client = createOsClient(dobroManifest.dataApi);

// O app monta o manifesto (dados) + o registry (blocos) + o client (API) e
// entrega ao core. O core valida o manifesto (fail-fast), exige sessão se
// auth.enabled (AuthGate) e renderiza tudo.
createRoot(root).render(
  <StrictMode>
    <OsApp manifest={dobroManifest} registry={registry} client={client} />
  </StrictMode>,
);
