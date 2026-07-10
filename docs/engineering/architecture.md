# Architecture

Static site, **no build step, no framework, no bundler, no dependencies** — the Perpetūra engine discipline, hardened by the century test: anything the front door can't do from a USB stick doesn't ship.

## Module map

```
index.html          the front door (since 2026-07-10): the landing — typewriter ceremony, setup
                    wizard, shelf; seals through the same export.js path as the app
app.html            the quiet path: plain-paper shell, screens (home, write, print, registry,
                    open*, about) + <script> tags in load order
style.css           app-shell styling and lamplight dark theme (+ @font-face for fonts/)
print.css           the print engine — overlay, sheets, @media print — shared by both doors
index.html          the whole app: typewriter desk, seal, letters shelf, opening overlay
app.html            a redirect to / (kept so old links still land home)
landing/
  landing.css       the app's styling + the opening overlay/verify/ceremony (@font-face → ../fonts/)
  landing.js        typewriter scene, wizard, sealNow (→ export.js), shelf, write-back entry
                    (TesseraLanding.answerForward/refreshShelf), reminder-button wiring
  opening.js        the opening overlay UI (intake/verify/ceremony/reveal/custody); calls the pure open.js
  reminders.js      calendar/card glue over TesseraIcs + export + print
  assets/           art (runtime-cached, never precached; compose→seal→print can't depend on it)
fonts/              the app-owned OFL faces (Young Serif, Courier Prime) — single source
sw.js               offline precache; CACHE_VERSION part of the versioning triple
version.json        { "version": "x.y.z" }
js/
  version.js        LOCAL_VERSION + the footer version note (SW registration lives in landing.js)
  state.js          localStorage under key `tessera_v1`: { schema, drafts, registry, settings }, with migrate() seam (schema 3: registry sealKey + role)
  manifest.js       PURE: buildManifest, renderReadme, datesInWords, deriveId, tokenSeedString-input canonicalisation
  token.js          PURE: sfc32 PRNG, renderTokenSvg(seedHex) → {full,left,right,sheet}
  zip.js            PURE: store-method zip writer + reader
  export.js         orchestration: SHA-256 (WebCrypto), checksums.txt, folder assembly, download, print handoff
  print.js          print-kit sheet renderer (kit, register, wallet card) + window.print()
  ics.js            PURE: ICS builder
  open.js           PURE: verifyLetter/readmeFacts/parseChecksums (the opening's verification core)
  crypt.js*         passphrase privacy           (*later)
data/
  occasions.js      occasion sets as data (open-when.md is the copy source)
tools/
  test-manifest.js  test-zip.js  test-token.js  test-state.js   (+test-ics/crypt/booklet later)
  fixtures/         committed determinism fixtures (token SVGs, zips, ICS)
  prose-check.js    letter-facing copy scans (banned patterns, from the house style)
```

## Rules

- **Pure modules are dual-environment**: browser global + `module.exports` guard (the Perpetūra pattern), so Node tests run the exact shipped code. Purity means: no DOM, no `Date.now`, no `Math.random`, no locale calls in anything that feeds exports or tokens.
- **One seal path**: the typewriter desk and write-back both end in the same `export.js` sequence (via `landing.js` `sealNow`). Format bugs get exactly one place to live.
- **Vendoring policy**: no CDNs, no package.json dependencies. Third-party code enters only by being copied in whole, licence header intact, into `js/vendor/` — and needs a decisions.md entry justifying it against "write the 120 lines instead."
- **Storage**: everything under the single `tessera_v1` key; shape changes go through `state.migrate()`; the registry stores metadata only (privacy stance in features/registry.md).
- **Versioning triple** (Perpetūra rule, kept): `version.json` + `LOCAL_VERSION` (`js/version.js`) + `CACHE_VERSION` (sw.js) bump together, via `/release`, never by hand.
- **One front end**: `index.html` is a single page — the typewriter desk (writing + seal), the "How it works"/"About" bands, and the letters shelf — with focused overlays for the setup wizard, **opening** (`#open-overlay`), and print (`#print-overlay`). No hash router; nav links are in-page anchors, and "Open a letter" opens the overlay. `app.html` is a redirect to `/`.
- **No analytics.** Not off-by-default — absent. (A century-test A checkbox, and a values statement.)

## Deploy
Netlify from `main` (release-only branch; `dev` is the working branch — house workflow). The site must remain fully functional from `file://` and any static host; Netlify is a convenience, not a home. Service worker: same reliable-update pattern as Perpetūra (version triple + skipWaiting banner).
