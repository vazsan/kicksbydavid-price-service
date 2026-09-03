# Air Jordan IV — Creative & UX Direction

## Phase 1 — Creative Direction

**Visual narrative.** The shoe is treated as a museum artifact under glass, not a
product on a shelf. The site opens in near-darkness with a single spotlit
object rotating slowly on a reflective plinth — the pacing and restraint of a
gallery opening, not a storefront. Copy speaks in the register of an
archivist ("restoration," not "release"; "artifact," not "item").

**Art direction.** Every section is a dark stage lit by one or two motivated
light sources (key + a red rim light echoing the Bred colorway), so color
appears as accent, never as wallpaper. Panels are edge-to-edge, hairline
borders instead of drop-shadowed cards, and generous negative space carries
the same weight as content — the Saint Laurent/Porsche-configurator
influence.

**Typography system.** Three families, each doing one job:
- **Anton** (display) — oversized, condensed, poster-scale headlines that
  behave like campaign type, not UI type.
- **Fraunces** (serif, italic) — editorial pull-quotes and colorway
  descriptions, giving the copy a magazine voice against the display type's
  aggression.
- **Inter** (sans) — all UI chrome: nav, labels, buttons, body copy. Never
  competes with the display type.

**Color system.** `obsidian` (#0a0908) and `bone` (#f4efe6) carry the whole
site — true black-on-cream, not grey. `jordan` red (#c8102e) is reserved for
CTAs, the midsole trim line and the rim light, so it always reads as a
decision, not decoration. `gold` (#b08d57) marks provenance — eyebrows,
edition numbers, ratings — the "museum label" color. `fog` (#8b8680) is the
only muted tone, used for secondary text.

**Motion language.** Slow, eased, cinematic — `cubic-bezier(0.16,1,0.3,1)`
("expo-out") everywhere, never a linear or bouncy ease. Text reveals clip
upward line-by-line (curtain effect); large sections cross-fade rather than
slide; the hero object's rotation is scroll-coupled, not autoplay-only, so
the user's scroll *is* the camera operator.

**Lighting concept.** A three-point rig around the 3D artifact: a warm bone
key light standing in for a Fresnel spotlight, a jordan-red rim/kicker for
edge separation (the only place red appears volumetrically), and a low gold
point light suggesting case lighting from below — plus scene fog and a
reflective floor so the object never floats in a void.

**Emotional journey.** Awe (hero reveal) → reverence (heritage timeline) →
craft appreciation (materials) → desire (colorway gallery) → confidence
(reviews) → resolved urgency (configurator + sticky CTA + stock scarcity) →
reassurance (FAQ). Every section either builds desire or removes friction —
nothing is decorative filler.

**Materials & textures.** A persistent film-grain overlay (SVG turbulence,
overlay blend) keeps the black from feeling like flat digital void — it
reads as shot-on-film. Material "swatches" in the Craft section use layered
gradients rather than stock photography, standing in for nubuck, mesh,
molded plastic and the visible Air unit.

**Scroll storytelling.** The hero is a 220vh pinned stage — scroll input
drives the 3D artifact's rotation, depth and vertical drift before the page
releases into normal flow. The Heritage section pins again and translates a
horizontal timeline track against vertical scroll (GSAP ScrollTrigger
`scrub`), so four decades of history play out as a single continuous scroll
gesture rather than a click-through carousel.

## Phase 2 — UX Architecture

**Sitemap / section hierarchy (single scrolling page, anchor nav):**
1. `Nav` — fixed, transparent → solid on scroll
2. `Hero` — pinned 3D stage, headline, scroll cue
3. `Heritage` (`#heritage`) — pinned horizontal timeline, 1989 → today
4. `Craft` (`#craft`) — four-material grid, editorial
5. `Gallery` (`#colorways`) — colorway switcher with live description
6. `Configurator` (`#configurator`) — colorway + size + CTA, the conversion core
7. `SocialProof` (`#reviews`) — aggregate rating + verified reviews
8. `FAQ` (`#faq`) — accordion, objection handling
9. `Footer` — sitemap, legal, edition note
10. `StickyPurchaseBar` — persistent below-hero CTA on mobile & desktop

**Scroll flow.** Linear, single-column narrative — no tabs, no early exits.
Every section after Craft nudges toward `#configurator`; the sticky bar
keeps the CTA one tap away for the entire body of the page once the hero has
passed, so desire built anywhere on the page converts without scrolling
back up.

**Desktop UX.** Wide 1600px-capped canvas, generous horizontal padding,
two-column splits (copy vs. interaction) in Gallery and Configurator so the
decision-making UI never competes with the 3D hero for width.

**Mobile UX.** Hero type scales via `vw` units so the headline always fills
the viewport regardless of device width; horizontal-scroll sections (Heritage)
degrade to natural touch-scroll (no custom touch handling needed since the
GSAP pin still drives on touch). The sticky purchase bar becomes the primary
mobile CTA, since a fixed header CTA would compete with limited vertical
space.

**Conversion flow.** Hero (desire) → Heritage/Craft (justify the price) →
Gallery (personalize) → Configurator (colorway pre-selected from Gallery
state pattern, size with stock-scarcity dots, disabled CTA until a size is
chosen to prevent invalid submits) → confirmation micro-copy → SocialProof
(risk reversal after commitment intent, reinforcing the decision) → FAQ
(remove remaining logistical objections) → sticky bar as a persistent
low-friction fallback CTA throughout.

## Phase 3 — Visual Design Spec (summary)

- **Grid:** 12-column, 1600px max width, 24px (mobile) / 48px (desktop) side
  gutters via Tailwind `px-6 md:px-12`.
- **Type scale:** Display `text-5xl → text-[15vw]` (mobile hero) down to
  `md:text-[9.5vw]`; section headings `text-5xl md:text-7xl`; body `text-sm`
  / `text-base`; eyebrows `0.7rem` at `0.35em` tracking.
- **Component library:** `Reveal` / `RevealLines` (scroll-triggered
  entrances), `Magnetic` (cursor-attracted CTA), hairline dividers, swatch
  buttons, accordion rows, stock-level dots — all built once in
  `src/components/ui` and reused rather than one-off styled per section.
- **CTA system:** One primary action styled consistently everywhere
  (`jordan` fill, `bone` text, uppercase, wide tracking): nav "Acquire",
  hero scroll cue, configurator "Reserve", sticky bar "Reserve" — visually
  identical so the eye always recognizes the conversion action.
- **Product gallery / size selector / social proof / FAQ / sticky bar:** see
  `Gallery.tsx`, `Configurator.tsx`, `SocialProof.tsx`, `FAQ.tsx`,
  `StickyPurchaseBar.tsx` — implemented directly as production React, not
  mocked separately from the spec.

## Notes on the 3D artifact

There is no licensed Air Jordan 4 3D scan or photography available to this
build, and using unlicensed Nike/Jumpman product photography or trademarks
would be both a legal and a craft problem. The hero object is instead a
**sculptural abstraction** — sole, midsole trim, visible Air-Sole heel unit,
molded eyestay wings and mesh vamp — assembled from primitives in
`ShoeArtifact.tsx` and lit like a gallery piece. This is a deliberate
creative choice consistent with the "museum artifact" brief, not a
placeholder: it lets the object read as premium and abstract rather than as
a low-fidelity fake of the real shoe. Swap in a licensed GLTF scan via the
same `ShoeArtifact` slot for production use.
