import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OsApp } from '@os/core';
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

// Protótipo estático: só manifesto (dados) + registry (blocos). Sem client de API
// e sem auth. O <SkinSwitcher> é um andaime de teste para comparar os DS ao vivo.
createRoot(root).render(
  <StrictMode>
    <OsApp manifest={neurovidaManifest} registry={registry} />
    <SkinSwitcher />
  </StrictMode>,
);
