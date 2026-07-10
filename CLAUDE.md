# Tessera — agent instructions

Letters across time: write, seal, print, keep. The docs are canon; when code and docs disagree, fix one the same day.

## Read first (by task)

- Anything at all: [docs/README.md](docs/README.md) — the map, with reading orders per task.
- Feature work: `docs/features/<feature>.md` → `docs/engineering/architecture.md` → `docs/design-language.md`.
- Format work: `SPEC.md` → `docs/spec/manifest-schema.md` → run `/spec-sync` after.
- Executing prepared work: `docs/PROGRESS.md` → the matching plan in `docs/plans/`.

## Hard rules

- **No build step, no framework, no dependencies, no CDNs, no webfonts, no analytics.** The app must work from `file://` and any static host (the century test). Third-party code enters only whole-file into `js/vendor/` with a `docs/decisions.md` entry.
- **Pure modules** (`manifest.js`, `token.js`, `zip.js`, later `ics.js`, `crypt.js`) are dual-environment (browser global + `module.exports` guard) and contain no DOM, `Date.now`, `Math.random`, or locale calls.
- **One seal path**: everything that seals a letter ends in the same `export.js` sequence.
- **Storage**: single localStorage key `tessera_v1`; shape changes only via `state.migrate()`.
- **Versioning triple**: `version.json` + `LOCAL_VERSION` (`js/main.js`) + `CACHE_VERSION` (`sw.js`) move together, only via `/release`, never by hand.
- **Fixtures are law**: a fixture diff is a format event → spec version note + `decisions.md` entry, never a silent regeneration.
- **Letter-facing copy** follows the prose rules in `docs/design-language.md`; prompt sets calibrate against `docs/features/open-when.md`. Run `node tools/prose-check.js` on any copy change.

## Workflow

- `dev` is the working branch; `main` is release-only (Netlify deploys from it).
- Definition of done = the gates in `docs/engineering/testing.md`. Green ≠ done; the browser pass starts at 375px.
- Decisions made while working go in `docs/decisions.md` (append-only), same day.
- Progress: update `docs/PROGRESS.md` when a task lands; update the Ariadne vault (`projects/tessera.md`) at session end.

## Commands

- Dev server: `node tools/serve.js` → http://localhost:8137/ (also `.claude/launch.json`, name "tessera").
- Gate 1: `node --check <file>` on touched JS, then `node tools/test-manifest.js`, `node tools/test-zip.js`, `node tools/test-token.js`, `node tools/test-state.js`, `node tools/test-open.js`, `node tools/test-ics.js`.
- Gate 2 (copy changes): `node tools/prose-check.js`.
- Skills: `/qa` · `/century-audit` · `/spec-sync` · `/occasion` · `/token-lab` · `/release`.
