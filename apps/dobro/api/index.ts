/**
 * apps/dobro — entrypoint SERVERLESS da API (Vercel Function).
 *
 * O mesmo app Hono definido em `server/app.ts` roda aqui como UMA função
 * serverless no runtime Node (Better Auth + os drivers precisam de Node). O
 * `vercel.json` reescreve `/api/*` para esta função; o Hono casa a rota
 * internamente pelo path original, que o Vercel preserva.
 *
 * Em DEV isto NÃO roda — o Vite faz proxy de `/api` para `server/server.ts`
 * (@hono/node-server). Este arquivo é o adaptador de PRODUÇÃO (Vercel).
 *
 * IMPORTANTE (estrutura): o Vercel trata cada arquivo em `api/` como uma função.
 * Por isso os módulos da API vivem em `server/` (não em `api/`) e `api/` contém
 * SÓ este entry — senão `api/conteudo.ts`, `api/query`, etc. virariam rotas
 * soltas e atropelariam as rotas do Hono.
 */
import { handle } from 'hono/vercel';
import { app } from '../server/app';

// Runtime Node (não Edge): Better Auth e os drivers Neon usam APIs de Node.
export const runtime = 'nodejs';

export default handle(app);
