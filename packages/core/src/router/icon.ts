/**
 * @os/core — Resolução de ícone por NOME (string do manifesto → componente Lucide).
 *
 * O manifesto declara ícones como strings (ex.: "BarChart3"), porque um manifesto
 * é DADOS (editável por operador), não código. O shell espera um `LucideIcon`.
 *
 * IMPORTANTE (bundle): usamos um REGISTRY CURADO com imports NOMEADOS — NÃO
 * `import * as` — para o tree-shaking funcionar. Só os ícones listados aqui entram
 * no bundle do cliente. `ICON_NAMES` também serve de paleta fechada para o operador
 * (e para validação/autocomplete do manifesto). Nome desconhecido → fallback seguro
 * (`Square`) sem quebrar o render.
 */

import type { LucideIcon } from 'lucide-react';
import {
  // Dashboards / métricas
  LayoutDashboard, BarChart3, BarChart, LineChart, PieChart, TrendingUp, TrendingDown,
  Activity, Gauge, Percent,
  // Metas / crescimento
  Rocket, Target, Compass, Flag, Zap, Lightbulb, Award, Star,
  // Pessoas / relacionamento
  Users, User, UserPlus, UserCheck, Heart, HeartPulse, ThumbsUp,
  // Comercial / financeiro
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Wallet, Receipt, Ticket, Tag,
  // Produto / catálogo
  Package, Boxes, Box, Layers,
  // Documentos / conteúdo
  FileText, File, Files, ClipboardList, ListChecks, BookOpen, Newspaper,
  // Comunicação
  Mail, MessageCircle, MessageSquare, Send, Bell,
  // Tempo
  Calendar, CalendarDays, Clock,
  // Mídia / social
  MonitorPlay, Video, Camera, Image, Mic, Podcast, Share2,
  // Sistema / dados
  Settings, SlidersHorizontal, Filter, Search, Cpu, Database, Server, Cloud, Workflow, GitBranch,
  // Segurança / status
  Shield, ShieldCheck, CheckCircle2, CheckSquare, Kanban,
  // Negócio / lugares
  Briefcase, Building2, Store, Home, MapPin, Truck, GraduationCap,
  // Diversos
  Dna, Globe, Hash,
  // Fallback
  Square,
} from 'lucide-react';

/** Registry curado: nome → componente. Estende conforme os clientes precisarem. */
const ICONS = {
  LayoutDashboard, BarChart3, BarChart, LineChart, PieChart, TrendingUp, TrendingDown,
  Activity, Gauge, Percent,
  Rocket, Target, Compass, Flag, Zap, Lightbulb, Award, Star,
  Users, User, UserPlus, UserCheck, Heart, HeartPulse, ThumbsUp,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Wallet, Receipt, Ticket, Tag,
  Package, Boxes, Box, Layers,
  FileText, File, Files, ClipboardList, ListChecks, BookOpen, Newspaper,
  Mail, MessageCircle, MessageSquare, Send, Bell,
  Calendar, CalendarDays, Clock,
  MonitorPlay, Video, Camera, Image, Mic, Podcast, Share2,
  Settings, SlidersHorizontal, Filter, Search, Cpu, Database, Server, Cloud, Workflow, GitBranch,
  Shield, ShieldCheck, CheckCircle2, CheckSquare, Kanban,
  Briefcase, Building2, Store, Home, MapPin, Truck, GraduationCap,
  Dna, Globe, Hash,
  Square,
} satisfies Record<string, LucideIcon>;

/** Nome de ícone válido (paleta fechada do design system). */
export type CuratedIconName = keyof typeof ICONS;

/** Todos os nomes suportados — útil para validação de manifesto e UIs de seleção. */
export const ICON_NAMES = Object.keys(ICONS) as CuratedIconName[];

/** Avisa UMA vez por nome desconhecido (evita repetir a cada render). */
const warnedIcons = new Set<string>();

/**
 * Resolve um nome de ícone (string do manifesto) para um componente `LucideIcon`.
 * Nome fora do registry curado → placeholder `Square` + aviso único.
 */
export function resolveIcon(name: string | undefined): LucideIcon {
  if (name && name in ICONS) {
    return ICONS[name as CuratedIconName];
  }
  if (name && !warnedIcons.has(name)) {
    warnedIcons.add(name);
    console.warn(
      `[@os/core] Ícone "${name}" não está no registry curado (packages/core/src/router/icon.ts). ` +
        `Usando placeholder. Use um de ICON_NAMES ou adicione o ícone ao registry.`,
    );
  }
  return Square;
}
