import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OsApp, createOsClient } from '@os/core';
import { neurovidaManifest } from './manifest';
import { registry } from './registry';
import { SkinSwitcher } from './SkinSwitcher';
import './index.css';

// Aplica o tema salvo ANTES de renderizar (evita flash). Par Claro/Escuro na
// linguagem orgânica: 'cream' (padrão) e 'dusk'. Qualquer valor antigo → 'cream'.
const savedSkin = localStorage.getItem('neurovida-skin');
document.documentElement.setAttribute('data-skin', savedSkin === 'dusk' ? 'dusk' : 'cream');

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

// Cliente de API do app: fala com a API Hono (/api/auth/*, /api/settings, /api/agents/*)
// via o proxy do Vite. Config vem de `manifest.dataApi` (só base URL pública — os
// segredos vivem server-side). Com `settings.auth.enabled`, o core exige login (AuthGate).
const client = createOsClient(neurovidaManifest.dataApi);

createRoot(root).render(
  <StrictMode>
    {/* O copiloto financeiro flutuante agora é config-driven: declarado no menu
        Financeiro (manifest.assistant) e montado pelo core (FloatingAgent).
        O toggle de tema vai no rodapé da sidebar via o slot `navFooter` do shell. */}
    <OsApp manifest={neurovidaManifest} registry={registry} client={client} navFooter={<SkinSwitcher />} />
  </StrictMode>,
);
