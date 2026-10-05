# Portfolio

Personal portfolio site — [databergin.vercel.app](https://databergin.vercel.app)

Built with [Vite](https://vite.dev) and TypeScript. The page that ships is plain HTML, CSS and JS with no runtime dependencies.

## Projects Featured

| Project | Type | Stack |
|---|---|---|
| RetroStockPredictor | AI-Assisted | Python, FastAPI, React, PostgreSQL |
| Betting-Agents | AI-Assisted | FastAPI, React, TypeScript, Claude AI |
| UFCpredictor | HandCoded | Python, ML, Web Scraping |
| CompressionZ827 | HandCoded | C, Systems Programming |
| Rasterizer | HandCoded | C++, Software Rendering |
| LinkedIn Resume Tailor | AI-Assisted | Chrome Extension, JavaScript, Claude AI |
| Fee Calculator | HandCoded | React, Python, Recharts |
| Moltbook Assistant | AI-Assisted | Python, Claude AI, Flask |
| Portfolio Tracker | AI-Assisted | FastAPI, React, TypeScript, SQLAlchemy |

## Development

Run it locally with Node 20.19+ or 22.12+. Opening `index.html` straight from disk no longer works, because the page loads its script and styles through Vite.

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck, then production build into dist/
npm run preview   # serve the production build locally
npm run check     # lint + typecheck
```

- `index.html` holds the markup and `src/` the TypeScript (one module per page feature, wired up in `src/main.ts`). Styles live in `src/styles/`, one file per page section, pulled together by `main.css`.
- Deployed on Vercel. `vercel.json` pins the Vite preset and the `dist/` output directory.

## Design and graphics

The page is split into two visual languages that meet at a seam, matching the two kinds of project it shows:

- **Forge** (orange and amber) is the hand-coded work: blueprint lines, compass arcs, drifting embers, butt line caps.
- **Circuit** (violet and cyan) is the AI-assisted work: routed traces, nodes and pulses, round line caps.

Where things live:

- `src/hero-art.ts` draws the hero on a `<canvas>`: a forge half and a circuit half with a seeded trace layout, animated pulses and embers. It pauses off-screen and in a hidden tab, and renders a single still frame when the visitor prefers reduced motion.
- `src/graphics/*.svg` holds one illustration per project (320×200 viewBox). `src/art.ts` inlines each into the card whose `data-art` attribute matches the file name, and `src/styles/art.css` styles them through a small class vocabulary (strokes, fills, pulses, bars that grow when the card scrolls in). They are plain SVG, so they can be edited by hand.
- `src/styles/tokens.css` is the palette, type and spacing scale. All three text colours pass WCAG AA contrast on every surface.
- Fonts (Space Grotesk, Inter, JetBrains Mono) are self-hosted from `@fontsource-variable/*`, Latin subset only, so the page makes no third-party font requests.
- `public/` holds the favicon, the Apple touch icon and `og.png`, the 1200×630 social preview. `og.png` is a screenshot of the hero, so regenerate it when the hero art changes.

Accessibility: a skip link, labelled landmarks, `aria-pressed` filter buttons and visible focus rings. Animation respects `prefers-reduced-motion` in both CSS and script. Without JavaScript the project cards, skills and contact links still show; only the hero canvas and the typed terminal intro need it.

## Linting with anti-slop

`npm run lint` runs [Oxlint](https://oxc.rs) with a vendored copy of [anti-slop](https://github.com/dmmulroy/anti-slop) in `tools/oxlint/anti-slop/`: opinionated rules that reject low-evidence TypeScript patterns (chained `as` casts, `unknown` parameters, `typeof` narrowing, and so on).

- `npm run lint -- --fix` applies the spacing autofix. Everything else should be fixed in the code rather than silenced. A type assertion needs a `// SAFETY:` comment explaining why it holds.
- The plugin is vendored, so the rules are ours to edit. `tools/oxlint/anti-slop/UPSTREAM.md` records the source commit and how to pull in upstream changes.
- Rules are enabled in `oxlint.config.ts`. The optional Effect rule group is vendored but off, since this project doesn't use Effect.
