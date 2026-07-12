# Testing & QA gates

Green ≠ done (house rule). The gates below are the definition of done for any change; `/qa` runs them, `/release` refuses without them.

## Gate 1 — syntax & units (every change)
- `node --check` on every touched JS file.
- Pure-module tests: `node tools/test-manifest.js` (ID derivation, seed canonicalisation, README rendering vs fixtures, dates-in-words), `node tools/test-zip.js` (write → `tar -tf` listing → CRC self-check; read-back round-trip from v0.2), `node tools/test-token.js` (both art generations — gen 2 in token.js and the frozen gen 1 in token-legacy.js: fixture seeds ⇒ byte-identical SVG per generation, cross-run determinism, no scripts/filters/external refs, forbidden-token source scan of both files: `Math.random`, `Date`, `toLocale`), `node tools/test-state.js` (storage shape, `migrate()` seam: v1 blob → schema 4 with sealKey, role, then inReplyTo backfill, registry CRUD), `node tools/test-open.js` (verification core: clean folder verifies, tampered letter warns without blocking, README fallback when the manifest is missing, writeback lineage survives the zip round-trip), `node tools/test-ics.js` (pure RFC 5545 builder: CRLF, all-day DTSTART, DTSTAMP from `written` not `Date.now`, 75-octet folding, text escaping, determinism, fixture `reminder-fix1.ics` byte-identical), `node tools/test-booklet.js` (pure saddle-stitch imposition: `impose(n)` sheet arrays, padding to a multiple of 4 with null blanks, `sequential()` identity).
- Fixtures are committed. **A fixture diff is a format event**: it requires a spec-version note and a decisions.md entry, never a silent regeneration.

## Gate 2 — prose (any change touching letter-facing copy)
- `node tools/prose-check.js` over UI strings, `data/occasions.js`, and README-template output: em-dashes (banned outside interrupted speech), negation-anaphora stacks, banned AI-tell words, urgency patterns, therapy-speak (open-when.md copy rules).
- WARNs are read, not skimmed — a green run with unread WARNs is not a pass.

## Gate 3 — browser (every feature change)
Preview server (`.claude/launch.json`, "tessera"), then:
- Full loop: compose → seal → zip downloads → print view renders → registry row appears → reload persists.
- **375px first** (house rule: most readers arrive on phones; screenshot, don't trust computed styles), then desktop.
- Offline: dev-tools offline after first load; compose/seal/print still work.
- Print preview at A4 **and** US Letter: page breaks between sheets, footers on every sheet, no clipped content, ink-light rule holds.
- Both themes (paper / lamplight), `prefers-reduced-motion` on the sealing flourish.

## Gate 4 — the century walkthrough (per release)
The five-step protocol in [../spec/century-test.md](../spec/century-test.md): compose real, print real (a physical printer), cut, seal (cover sheet out), reopen the folder with only a text editor, cold-reader test on the cover sheet first, then the instructions page. Results recorded in the release notes; an unexplained ✗ blocks the release.

## Gate 5 — docs (per release)
- `docs/README.md` indexes every doc; no unresolved placeholder markers anywhere in docs/ (the release gate greps for them, so this line must not contain one itself).
- Any decision made during the work is in decisions.md; any format change is reflected in SPEC.md *and* schema doc *and* app the same day (`/spec-sync` is the detector).

## CI (mirror of local, once the repo is public)
Push to `dev`/`main` runs Gate 1 + prose scan. Gates 3–5 stay human-run — a browser walkthrough and a physical printer don't belong in CI, and pretending they do is how green ≠ clean happens.
