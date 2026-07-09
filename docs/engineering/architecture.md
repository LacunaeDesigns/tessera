# Architecture

Static site, **no build step, no framework, no bundler, no dependencies** — the Perpetūra engine discipline, hardened by the century test: anything `index.html` can't do from a USB stick doesn't ship.

## Module map

```
index.html          shell: screens (home, write, print, registry, open*, about) + <script> tags in load order
style.css           all styling incl. @media print (the print engine) and lamplight dark theme
sw.js               offline precache; CACHE_VERSION part of the versioning triple
version.json        { "version": "x.y.z" }
js/
  main.js           init, screen router (hash-based), version check, SW registration; LOCAL_VERSION
  state.js          localStorage under key `tessera_v1`: { drafts, registry, settings }, with migrate() seam
  compose.js        the writing-room flow state machine (features/writing-room.md)
  manifest.js       PURE: buildManifest, renderReadme, datesInWords, deriveId, tokenSeedString-input canonicalisation
  token.js          PURE: sfc32 PRNG, renderTokenSvg(seedHex) → {full,left,right,sheet}
  zip.js            PURE: store-method zip writer (+reader from v0.2)
  export.js         orchestration: SHA-256 (WebCrypto), checksums.txt, folder assembly, download, print handoff
  print.js          print-kit sheet renderer + window.print()
  registry.js       ledger views + register sheet
  ics.js*           PURE: ICS builder            (*v0.2)
  open.js*          receive/verify/ceremony      (*v0.2)
  crypt.js*         passphrase privacy           (*v0.2)
data/
  occasions.js      occasion sets as data (open-when.md is the copy source)
tools/
  test-manifest.js  test-zip.js  test-token.js   (+test-ics/crypt/booklet later)
  fixtures/         committed determinism fixtures (token SVGs, zips, ICS)
  prose-check.js    letter-facing copy scans (banned patterns, from the house style)
```

## Rules

- **Pure modules are dual-environment**: browser global + `module.exports` guard (the Perpetūra pattern), so Node tests run the exact shipped code. Purity means: no DOM, no `Date.now`, no `Math.random`, no locale calls in anything that feeds exports or tokens.
- **One seal path**: compose, series wizard (v0.3), and write-back (v0.2) all end in the same `export.js` sequence. Format bugs get exactly one place to live.
- **Vendoring policy**: no CDNs, no package.json dependencies. Third-party code enters only by being copied in whole, licence header intact, into `js/vendor/` — and needs a decisions.md entry justifying it against "write the 120 lines instead."
- **Storage**: everything under the single `tessera_v1` key; shape changes go through `state.migrate()`; the registry stores metadata only (privacy stance in features/registry.md).
- **Versioning triple** (Perpetūra rule, kept): `version.json` + `LOCAL_VERSION` (main.js) + `CACHE_VERSION` (sw.js) bump together, via `/release`, never by hand.
- **Screens**: hash-routed (`#write`, `#letters`, `#about`, `#print` is modal-like), each a `<section>` toggled by `main.js`; no history surprises; back button always works.
- **No analytics.** Not off-by-default — absent. (A century-test A checkbox, and a values statement.)

## Deploy
Netlify from `main` (release-only branch; `dev` is the working branch — house workflow). The site must remain fully functional from `file://` and any static host; Netlify is a convenience, not a home. Service worker: same reliable-update pattern as Perpetūra (version triple + skipWaiting banner).
