# Component Inventory (Atomic Design) — liranesuliano.com.br

> Scanned: 2026-07-13 · Source: https://liranesuliano.com.br/ · Stack: Elementor Pro
> Counts are Elementor **widget** instances found in the rendered DOM.

---

## Atoms (fundamental building blocks)

| Atom | Instances | Spec notes |
|------|-----------|------------|
| **Heading** | 51 | Roboto Slab serif; scale 20–40px; petrol on light / white on dark. Primary voice of the brand |
| **Button** | 32 | Gold `#BE9B64` fill primary; 8px radius (some pill); Roboto 600; full-width on mobile |
| **Image** | 20 | Portraits, book covers, brand marks; 8px radius on framed images |
| **Icon** | 1 + Social ×2 | FontAwesome + eicons; used in social cluster and inline accents |
| **Counter** | 4 | Animated stat numbers (e.g. "+12 anos", students, protocols) |
| **Text editor** | 1 | Long-form body copy block (Roboto 400, 16px) |
| **Spacer** | 1 | Vertical rhythm helper |

## Molecules (simple combinations)

| Molecule | Instances | Pattern |
|----------|-----------|---------|
| **Nav item + dropdown** | 38 menu items | Horizontal menu; `menu-item-has-children` → dropdown (Loja, Livros, Cursos) |
| **Social cluster** | 2 | Row of social icons (footer + header/contact) |
| **Stat / Counter block** | 4 | Number (emphasis) + label — credibility strip |
| **Form field group** | 4 forms | Email-capture: input + consent text + gold submit button |
| **Product / Book card** | ~3 | Image (cover) + Heading + description + "Comprar" button |
| **Video embed** | 3 | Responsive video widget (course/teaching previews) |

## Organisms (complex sections)

| Organism | Instances | Composition | Complexity |
|----------|-----------|-------------|-----------|
| **Header / Nav** | 1 (global) | Logo + 38-item menu w/ dropdowns + CTA | HIGH |
| **Hero** | 1 | Heading + subheading + gold CTA + portrait image | MEDIUM |
| **Lead-capture (e-book)** | 1 | "Baixe Grátis o E-book" heading + email form + consent | MEDIUM |
| **Book / Product grid** | 1 | 3× Product card (Protocolos Clínicos, Atlas A-Z, Neuroalimentação) | MEDIUM |
| **Course carousel** | 2 | `media-carousel` + `loop-carousel` of course/content cards | HIGH |
| **Testimonials (Depoimentos)** | 1 | Quote cards / social proof | MEDIUM |
| **Footer** | 1 (global) | Menu + social cluster + secondary form | MEDIUM |
| **Blog post-loop template** | 9× post widgets | theme-post-title + featured-image + content (Elementor Theme Builder) | HIGH |

---

## Section / layout structure

- **64** Elementor sections detected — long-scroll landing composition
- Page pattern (top → bottom, inferred from heading order):
  1. Header/Nav
  2. Hero ("O que é a Auriculoterapia Neurofisiológica?")
  3. About / authority ("Quem é Lirane Suliano" + stat counters)
  4. Content/education strip (blog + video)
  5. Books grid (3 products + "Comprar")
  6. Courses / mentorship (carousels — Pós Graduação, Mentoria Prime, Imersões)
  7. Lead magnet ("Baixe Grátis o E-book" — 5 Protocolos Essenciais)
  8. Testimonials
  9. Footer (menu + social + form)

## Key CTAs observed (button labels)

`Comprar` · `Cadastrar` · `Quero saber mais` · `Encontrar um Auriculoterapeuta` · `Loja Online` · `Pós Graduação` · `Mentoria Prime` · `Mais eventos` · `Depoimentos` · `Blog`

## React/rebuild mapping suggestion

| This site (Elementor) | Rebuild component |
|-----------------------|-------------------|
| Heading widget | `<Heading level size>` |
| Button widget | `<Button variant="primary\|outline\|link">` |
| Product card | `<BookCard cover title desc price cta>` |
| Counter | `<StatCounter value label>` |
| media/loop-carousel | `<Carousel>` (Embla/Swiper) |
| Form widget | `<LeadForm>` (email + consent + submit) |
| Nav-menu | `<Navbar>` with `<Dropdown>` |
