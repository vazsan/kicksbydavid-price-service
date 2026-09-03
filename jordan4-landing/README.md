# Air Jordan IV — Landing Experience

A self-contained Next.js/TypeScript/Tailwind/Three.js/GSAP luxury landing
page for a limited Air Jordan 4 reissue. Lives entirely inside
`jordan4-landing/` and is independent of the PHP profit-analytics app in
the rest of this repository — its own `package.json`, its own dev server,
no shared code.

See [`DESIGN.md`](./DESIGN.md) for the creative direction, UX architecture
and visual design spec behind the build.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
GSAP + ScrollTrigger · Three.js via `@react-three/fiber` / `@react-three/drei`

## Run locally

```bash
npm install
npm run dev       # http://localhost:3000
```

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint
```

## Structure

```
src/
  app/                  # root layout, page, global styles
  components/
    hero/                # pinned 3D stage: Canvas, lighting rig, artifact
    sections/            # Heritage, Craft, Gallery, Configurator, SocialProof, FAQ, sticky bar
    layout/               # Nav, Footer
    ui/                   # Reveal/RevealLines, Magnetic — shared motion primitives
  lib/                    # product data, gsap plugin registration
```

## Notes

- The hero's 3D object is a deliberate sculptural abstraction of the
  silhouette (sole, wings, visible Air unit), not a licensed scan or photo
  of an actual Air Jordan 4 — see the "Notes on the 3D artifact" section of
  `DESIGN.md` for why.
- This is a concept build, not affiliated with or endorsed by Nike, Inc.
