/**
 * apps/dobro — registro de carrosséis. Cada carrossel novo entra aqui (uma linha)
 * e passa a ser renderizável por `pnpm carrossel:render <slug>`.
 */
import type { Carrossel } from './types';
import { gta6 } from './carrosseis/gta6';
import { gtaAntipirataria } from './carrosseis/gta-antipirataria';
import { viciar } from './carrosseis/viciar';
import { lerCodigoIa } from './carrosseis/ler-codigo-ia';
import { erroIa30min } from './carrosseis/erro-ia-30min';
import { skynet } from './carrosseis/skynet';
import { iaPensar } from './carrosseis/ia-pensar';
import { ohMyGit } from './carrosseis/oh-my-git';
import { ufcRobosChina } from './carrosseis/ufc-robos-china';
import { elevatorSaga } from './carrosseis/elevator-saga';

const CARROSSEIS: Record<string, Carrossel> = {
  [gta6.slug]: gta6,
  [gtaAntipirataria.slug]: gtaAntipirataria,
  [viciar.slug]: viciar,
  [lerCodigoIa.slug]: lerCodigoIa,
  [erroIa30min.slug]: erroIa30min,
  [skynet.slug]: skynet,
  [iaPensar.slug]: iaPensar,
  [ohMyGit.slug]: ohMyGit,
  [ufcRobosChina.slug]: ufcRobosChina,
  [elevatorSaga.slug]: elevatorSaga,
};

export function getCarrossel(slug: string): Carrossel | undefined {
  return CARROSSEIS[slug];
}

export function listSlugs(): string[] {
  return Object.keys(CARROSSEIS);
}
