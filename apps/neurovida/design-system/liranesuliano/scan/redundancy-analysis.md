# Redundancy Analysis — liranesuliano.com.br

> Scanned: 2026-07-13 · Source: https://liranesuliano.com.br/
> Method: frequency clustering over the combined LiteSpeed CSS (505 KB) + DOM widget census.

---

## 1. Font families — 80% reduction

```
Families declared in combined CSS: 15
  'Roboto' (162), "Gilroy" (72), 'Roboto Slab' (63),
  'Loren Blake Serif' (4), 'JustVectorRegular' (2), Georgia,
  FontAwesome, eicons, swiper-icons, inherit, ...

Actually authored (Elementor globals + Google Fonts loaded): 3
  → Roboto Slab (headings) · Lora (editorial) · Roboto (body/UI)

Reduction: 15 → 3  (80%)
```
**Cause:** Gilroy, Loren Blake Serif, JustVector, etc. ship inside bundled Elementor widget / theme fallback CSS but are never rendered. **Action on rebuild:** load only Roboto, Roboto Slab, Lora (icon fonts → SVG).

## 2. Buttons — ~91% instance reduction to 3 variants

```
Button widget instances in DOM: 32
Distinct visual styles needed:      3
  1. Primary   — gold #BE9B64 fill, 8px radius, Roboto 600 (Comprar / Cadastrar / Quero saber mais)
  2. Outline   — bordered on dark (secondary actions)
  3. Link/Nav  — text-only (Home / Blog / menu)

Reduction: 32 instances → 3 reusable variants  (~91%)
```

## 3. Colors — ~48% reduction to a governed palette

```
Distinct brand-ish hex in author styles: ~25
Governed brand palette:                    9
  petrol #0B2432 · teal #003349 · gold #BE9B64 · gold-deep #9C7F53
  cream-light #F5EEE4 · cream #EBDDC9 · white #FFF · slate #81929F · mist #D4DADE
Plus 4 form state colors (success/danger/warning) — quarantine to forms only.

Reduction: ~25 → 9 brand (+4 state)  (~48%)
```
**Cause:** plugin/widget defaults (Bootstrap greens/reds/oranges, greys like #69727D, #325165, #3F444B) leak into the combined CSS. Only the 9 Elementor globals are author-intentional.

## 4. Border radius — 4 → clean scale

```
Values: 8px (23) · 4px (11) · 0 (16) · 200px pill (6) · 50% circle (5) · 3px/5px/6px/10px (noise)
Optimal token set: 4  → sm 4px · md 8px · pill 200px · full 50%
Noise (3px, 5px, 6px, 10px) should snap to the 4/8 scale.
```

## 5. Spacing — already near-optimal (4px system)

```
Padding values: 16(31) · 24(28) · 32(27) · 64(15) · 12(12) · 8(10) · 48(5) · 80(2)
→ Already a clean 4px-base scale. Snap stragglers (5px,15px,18px,20px→ nearest token).
Optimal token set: 9  (4·8·12·16·24·32·48·64·80)
Reduction: minor — this dimension is healthy.
```

---

## Summary table

| Pattern | Raw | Optimal | Reduction | Priority |
|---------|-----|---------|-----------|----------|
| Font families | 15 | 3 | 80% | HIGH (perf) |
| Button styles | 32 inst. | 3 variants | ~91% | HIGH |
| Brand colors | ~25 | 9 (+4 state) | ~48% | MEDIUM |
| Border radius | ~8 | 4 | ~50% | LOW |
| Spacing | ~12 | 9 | ~25% | LOW (already good) |

## Biggest wins

1. **Kill unused font payloads** — 12 of 15 families are dead weight; loading only 3 cuts CSS/font transfer significantly (this is a LiteSpeed-cached WP site, so unused CSS is the main bloat).
2. **Consolidate buttons to 3 variants** — the single highest-leverage component token.
3. **Quarantine Bootstrap state colors** — keep the brand palette to the 9 gold/petrol/cream tokens; never let plugin greens/reds bleed into brand UI.
