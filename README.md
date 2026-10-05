# Portfolio
Fun portfolio for showing off personal projects

## Development

Built with [Vite](https://vite.dev) and TypeScript. Needs Node 20.19+ or 22.12+.

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck, then production build into dist/
npm run preview   # serve the production build locally
npm run check     # lint + typecheck
```

- `index.html` holds the markup, `src/styles/main.css` the styles, and `src/` the TypeScript (one module per page feature, wired up in `src/main.ts`).
- Deployed on Vercel. `vercel.json` pins the Vite preset and the `dist/` output directory.

## Linting with anti-slop

`npm run lint` runs [Oxlint](https://oxc.rs) with a vendored copy of [anti-slop](https://github.com/dmmulroy/anti-slop) in `tools/oxlint/anti-slop/`: opinionated rules that reject low-evidence TypeScript patterns (chained `as` casts, `unknown` parameters, `typeof` narrowing, and so on).

- `npm run lint -- --fix` applies the spacing autofix. Everything else should be fixed in the code rather than silenced. A type assertion needs a `// SAFETY:` comment explaining why it holds.
- The plugin is vendored, so the rules are ours to edit. `tools/oxlint/anti-slop/UPSTREAM.md` records the source commit and how to pull in upstream changes.
- Rules are enabled in `oxlint.config.ts`. The optional Effect rule group is vendored but off, since this project doesn't use Effect.
