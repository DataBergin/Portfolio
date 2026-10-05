# anti-slop provenance

This directory is a vendored copy of the anti-slop Oxlint plugin. This repository owns it; edit it freely.

- Source: https://github.com/dmmulroy/anti-slop
- Source commit: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b` (merge of PR #36)
- Copied from: `skills/install-anti-slop/assets/anti-slop/` via its `scripts/install.mjs`. At that commit the bundle is byte-identical to upstream `src/` (minus `*.test.ts`), checked with `node scripts/sync-skill-assets.mjs --check`.
- Installed at: `tools/oxlint/anti-slop/`, registered in `oxlint.config.ts`.
- Enabled: every generic rule, plus native `oxc/no-accumulating-spread`.
- Vendored but not enabled: `effect/`, the opt-in Effect rule group. This repository has no direct `effect` dependency.
- Versions: `oxlint` and `@oxlint/plugins` are pinned to the same exact version (1.86.0). Upstream's own CI pins 1.78.0.
- Intentional deviations from upstream: none.

To update, follow upstream's `install-anti-slop` skill (`references/update.md`): stage the new source separately and merge rather than overwriting this directory.
