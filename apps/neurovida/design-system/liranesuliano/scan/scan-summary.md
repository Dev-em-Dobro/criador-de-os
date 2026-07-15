# Scan Summary — liranesuliano.com.br

> **Task:** `ux-ds-scan-artifact` (UX-Design Expert)
> **Artifact type:** Live URL
> **Source:** https://liranesuliano.com.br/
> **Scanned:** 2026-07-13
> **Stack detected:** WordPress + Elementor Pro + theme "read" · LiteSpeed cache · Yoast SEO

---

## What this site is

Personal-brand / info-product site for **Lirane Suliano** — cirurgiã-dentista, Mestre e Doutora (UFPR), especialista em **Auriculoterapia Neurofisiológica**. The site sells books, courses, a post-graduation program and mentorship, plus an e-book lead magnet. It is a **luxury wellness / medical-educator** brand.

## Design language (one line)

Dark petrol/teal canvas + **gold/bronze** accent + warm cream/beige neutrals, with a **serif-heading / sans-body** pairing (Roboto Slab + Lora over Roboto). Flat, editorial, elegant — elevation comes from color blocks and borders, not shadows.

---

## Design tokens extracted (source of truth = Elementor Global settings)

| Dimension | Finding |
|-----------|---------|
| **Colors** | 9 brand tokens (petrol, teal, **gold `#BE9B64`** = dominant accent, deep-gold, 2× cream, white, slate, mist) + Bootstrap-style state colors injected by form/plugin CSS |
| **Typography** | 3 real families: **Roboto Slab** (serif headings) · **Lora** (editorial serif) · **Roboto** (body/UI). ~12 bundled families in combined CSS are unused plugin defaults |
| **Type scale** | 12 · 13 · 14 · 15 · 16 (base) · 18 · 20 · 24 · 32 · 36 · 40 px |
| **Spacing** | Clean 4px base: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80 px |
| **Radius** | 4px · **8px (dominant)** · 200px (pill) · 50% (circle) |
| **Shadows** | Predominantly `none` — flat design. A few decorative insets from bundled widgets only |

## Components found (Atomic Design)

- **Atoms (7 types):** Heading ×51, Button ×32, Image ×20, Icon/Social, Counter ×4, Text-editor, Spacer
- **Molecules (6 types):** Nav item + dropdown (38 menu items), Social cluster ×2, Stat/Counter ×4, Form field (4 forms), Product/Book card, Video embed ×3
- **Organisms (8 types):** Header/Nav, Hero, Lead-capture (e-book) section, Book/Product grid, Course media-carousel + loop-carousel, Testimonials, Footer, Blog post-loop template

## Headline redundancy

| Pattern | Raw | Optimal | Reduction |
|---------|-----|---------|-----------|
| Font families (combined CSS) | 15 | 3 | 80% |
| Button widget instances | 32 | 3 variants | ~91% |
| Brand colors vs all hex in CSS | ~25 distinct | 9 brand + 4 state | ~48% |

---

## Caveat (Live-URL limitation)

The combined LiteSpeed CSS (505 KB) bundles CSS for **every** Elementor widget and theme fallback shipped by the site — including fonts (Gilroy, Loren Blake Serif, JustVector) and colors that are **not actually rendered** on this page. The tokens below are filtered to the **Elementor Global settings** (the real, author-defined design system) plus what is verifiably used in the DOM. Static analysis cannot read `:hover`/`:focus` states or JS-driven styles — validate interactive states in a browser before finalizing.

## Files produced

| File | Contents |
|------|----------|
| `scan-summary.md` | This document |
| `design-tokens.yaml` | Colors, typography, spacing, radius, shadows (token-ready) |
| `component-inventory.md` | Atomic Design inventory with specs |
| `redundancy-analysis.md` | Reduction opportunities |
| `build-recommendations.md` | Priority matrix + 4-phase build order |
