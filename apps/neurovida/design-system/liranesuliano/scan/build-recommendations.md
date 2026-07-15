# Build Recommendations — liranesuliano.com.br

> Scanned: 2026-07-13 · Source: https://liranesuliano.com.br/
> Use this to rebuild the design system as reusable components (React/Tailwind or any stack).

---

## Component Priority Matrix

| Priority | Component | Why |
|----------|-----------|-----|
| **HIGH** | Button (3 variants) | 32 instances — highest reuse, drives conversion |
| **HIGH** | Heading (serif scale) | 51 instances — core brand voice |
| **HIGH** | Product / Book card | Revenue surface (books/courses) |
| **HIGH** | Lead-capture form | E-book funnel = primary lead engine |
| **MEDIUM** | Nav / Header w/ dropdown | 38 menu items, complex but 1 instance |
| **MEDIUM** | Stat counter | Authority/credibility strip |
| **MEDIUM** | Carousel | Course/content browsing (2 carousels) |
| **MEDIUM** | Testimonial card | Social proof |
| **LOW** | Video embed | Standard responsive wrapper |
| **LOW** | Footer | Composition of existing atoms |

## 4-Phase Build Order

### Phase 1 — Foundations + Core Atoms (Week 1)
1. **Design tokens** → CSS variables from `design-tokens.yaml` (colors, type scale, spacing, radius)
2. **Typography** → load Roboto + Roboto Slab + Lora; set heading=Roboto Slab, body=Roboto
3. **Button** → `primary` (gold fill), `outline`, `link` — 8px radius, 200ms transitions, hover→gold-deep `#9C7F53`
4. **Heading** → serif, sizes 20/24/32/36/40, petrol-on-light / white-on-dark
5. **Image** → 8px radius framed variant

### Phase 2 — Common Molecules (Week 2)
6. **Product/Book card** (cover + title + desc + price + Comprar CTA)
7. **Stat counter** (animated number + label)
8. **Lead form** (email input + consent checkbox/text + gold submit)
9. **Nav item + dropdown**

### Phase 3 — Organisms (Week 3)
10. **Header/Nav** (logo + menu + CTA, mobile drawer, full-width mobile buttons)
11. **Hero** (heading + subheading + CTA + portrait)
12. **Carousel** (Embla/Swiper) for courses/content
13. **Testimonials** section

### Phase 4 — Templates & Polish (Week 4)
14. **Landing page template** (assemble 9-section long-scroll)
15. **Blog post-loop template** (title + featured image + content)
16. **Footer**
17. QA pass against Pre-Delivery Checklist below

---

## Design direction to preserve (the "expensive" feel)

- **Palette discipline:** petrol/teal canvas, **gold `#BE9B64` as the single accent**, cream neutrals. Never introduce plugin greens/reds outside form validation.
- **Serif headings + sans body** — the Roboto Slab/Roboto contrast is the brand signature; keep it.
- **Flat elevation** — favor color blocks, hairline borders (`mist #D4DADE`) and generous whitespace over drop shadows.
- **Gold CTAs** — one dominant action color; keep secondary actions as outline/link so the gold pops.
- **Generous vertical rhythm** — section padding 48–80px matches the calm, premium feel.

## Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Lucide/Heroicons; icon fonts → SVG)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms); gold → gold-deep on hover
- [ ] Text contrast ≥ 4.5:1 (check slate `#81929F` on cream — verify, it is borderline)
- [ ] Focus states visible for keyboard nav (gold ring)
- [ ] `prefers-reduced-motion` respected (counters/carousels)
- [ ] Responsive: 375 / 768 / 1024 / 1440px; buttons full-width on mobile (matches current)
- [ ] Load only 3 font families; strip unused bundled CSS
- [ ] No horizontal scroll on mobile; carousels swipe-enabled

## ⚠️ Contrast flag to verify

`slate #81929F` on `cream-light #F5EEE4` and small gold `#BE9B64` text on light backgrounds may fall **below 4.5:1**. Verify and, if failing, reserve those colors for large text / decorative use only, or darken to `gold-deep #9C7F53` for body-size text.

---

## Next steps (optional)

- **Generate tokens in all formats** → hand off to Brad (`*tokenize`) to emit CSS/Tailwind/SCSS/DTCG from `design-tokens.yaml`.
- **Screenshot pass** → re-scan with browser screenshots to capture hover/focus states and exact section layouts (static HTML can't see JS/interaction states).
