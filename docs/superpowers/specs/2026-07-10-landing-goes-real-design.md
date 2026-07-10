# Landing goes real — design

*2026-07-10 · promotes the landing to the front door and replaces its ceremonial
sealing with the one real seal path · **approved** — author cleared the image
licensing gate (decisions.md), resolving open decision A to A1 (one release);
B resolved to the recommended migrate() bump; C settled at the plan's prose gate*

## Intent

The landing (`landing.html` + `landing/`) is a design study: its typewriter
ceremony mints a random token, keeps sealed letters in memory until the next
reload, and its "Download the folder" / "Print the kit" buttons are self-declared
no-ops (landing.js:54). The app (`index.html`) is real but plain. This design
makes the beautiful surface real and the real surface reachable: the ceremony
ends in `TesseraExport.seal()`, the shelf reads `tessera_v1`, and the landing
becomes the front door with the current app kept as the quiet path.

Grounding: the full landing inventory (wizard fields, ceremony hook, shelf data,
gap table) was taken 2026-07-10 against `landing/landing.js`, `landing.html`,
`js/export.js`, `js/state.js`, `js/compose.js`. Key line refs cited inline.

## Design

### 1. One seal path — the ceremony becomes presentation

`sealNow()` (landing.js:453–476) is rebuilt to end in the same sequence as
`compose.js` `doSeal()` (compose.js:298–338):

1. Build the exact `fields` object `export.js` documents: `{ to, from,
   written: todayIso(), openOn, occasion, language: 'en',
   custody: [{holder, note}], letter, openWhenNeeded }`.
2. `TesseraExport.seal(fields)` — ID and token seed become content-derived
   (`sha256(tokenSeedString(fields))`), replacing the landing's random 32-byte
   seed and hand-rolled `'TSR-' + slice` ID (landing.js:456–461, deleted along
   with its `Math.random` fallback).
3. `TesseraState.addRegistryEntry(...)` — same entry shape as compose.js:313–326,
   `keptText` honoring the wizard's keep-a-copy checkbox (`#keep-copy`, currently
   collected then discarded, landing.js:990).
4. `TesseraExport.download(sealed)` wired to the "Download the folder" button;
   the inert-note path (landing.js:54, 992–993) is deleted.

The theatrics — sounds, carriage, token reveal, shelf animation — are untouched;
they now present `sealed.token` instead of a souvenir. The landing loads four
more scripts (`js/manifest.js`, `js/zip.js`, `js/state.js`, `js/export.js` —
today it loads only `data/occasions.js` + `js/token.js`, landing.html:375–377).

Field normalization (from the gap table):

| Field | Landing today | Real path | Resolution |
|---|---|---|---|
| `occasion` | can be `null` | always a slug, default `'custom'` | normalize `null → 'custom'` at seal time |
| custom occasion label (`#setup-custom`) | display-only, dropped at seal | no such field in the format | stays display-only (shelf card title); never enters `fields` — **no format event** |
| `written` / `language` | absent | `todayIso()` / `'en'` | supplied at seal time, as compose.js does |
| keep-a-copy | collected, discarded | `keptText` on the registry entry | honored |
| wax-seal choice (`sealKey`) | in-memory cosmetic | no equivalent | see §2 — registry entry gains an optional field via `state.migrate()` |

### 2. The shelf reads `tessera_v1` — demo letters retire

`shelfLetters()` (landing.js:719–738) reads `TesseraState.getRegistry()` instead
of `state.sealedList.concat(DEMO)`. The `DEMO` array (landing.js:43–49) is
deleted, not merely hidden: its five fixed IDs include the exact IDs of the four
real founding letters already in the author's registry (TSR-471a-31bf,
TSR-1e9e-906d, TSR-74fc-cee9, TSR-8d24-fc8f) with *different* recipients — a
concatenated shelf would show the same ID twice with contradictory labels.

- **Empty state**: a first visit shows one quiet invitation card in the house
  voice (letter-facing copy — goes through the prose gate and the open-when
  calibration).
- **Wax seal on real entries**: registry entries gain an optional `sealKey`
  (the 12-seal picker's choice) so the shelf can dress real letters. Single
  additive field on registry entries, done via a `state.migrate()` schema bump —
  the storage rule (single key, shape changes only through migrate) is honored;
  old entries fall back to the default seal. *(Alternative if the author
  prefers zero schema motion: derive the seal deterministically from the ID
  hash and store nothing. Flagged as open decision B.)*
- The `fresh: true` just-sealed animation flag stays in-memory, never persisted.

### 3. Printing at the ceremony — the print engine is shared, not duplicated

"Print the kit" must work at the moment of sealing (the sealed object with
`letterText` is in memory; handing off to the app's registry would lose the
letter sheet whenever keep-a-copy is off, since `rebuildSealed` — registry.js:24–51
— cannot resurrect unkept text). So the landing prints in place:

- The print-overlay / `.sheet` / `@media print` rules (style.css, the "print
  engine" section) move to a new top-level **`print.css`**, loaded by both
  surfaces. No rule text changes — a file move, so the print base look just
  shipped stays byte-identical in effect.
- The front door gains the `#print-overlay` / `#print-root` container markup
  and loads `js/print.js`. One engine, two doors, zero duplication.

### 4. Front-door swap

- `index.html` → **`app.html`** — byte-identical rename. It remains the
  plain-paper fallback and utility surface (drafts, registry, reprint, the
  quiet accessible flow), reachable from the front door's nav ("the writing
  room, plain" link wording to be settled at prose gate).
- `landing.html` → **`index.html`**. All its internal anchors are in-page
  (verified: no cross-surface hrefs exist in either direction), and its asset
  paths (`landing/…`, `data/…`, `js/…`) are root-relative from the same
  directory, so the rename is mechanical.
- The new front door registers the same `sw.js` with the same three-line
  guarded pattern main.js uses (main.js:38–40) — `js/main.js` itself is not
  loaded there (its hash router is app-coupled, expects `#screen-*` DOM).
  `LOCAL_VERSION` display stays app-side; the versioning triple is untouched.

### 5. Offline — SW precache rework

`CORE` (sw.js:7–27) adds: `app.html`, the renamed `index.html` (front door),
`landing/landing.css`, `landing/landing.js`, `print.css`. The heavy watercolor
art (`landing/assets/`, 4.4 MB) stays **runtime-cached** by the existing fetch
handler — first visit warms it; compose→seal→print must not depend on it.
Fonts are already precached (print base look). `CACHE_VERSION` moves only via
`/release`, which is the release event this lands in.

Century gate: offline compose→seal→download→print must pass **from the front
door** after a single online visit, art or no art.

## Ship sequencing — read before approving

Standing author gate #6 (decisions.md): the four watercolor backgrounds are
placeholder-sourced and the twelve wax-seal images are third-party product
photos — **the landing may not ship publicly until licensing is cleared or the
images are swapped**. `/release` merges `dev` → `main`, and Netlify deploys
`main`; once this design lands on `dev`, the next `/release` ships the landing
as the front door — including to the unlisted URL.

So one of these must be chosen (open decision A):

- **A1 — clear/swap images first**, then land this and ship v0.1 with the new
  front door. One release, no interim state.
- **A2 — ship v0.1 with the current front door first** (founding letters +
  `/release` as already planned), land this design after, ship it as v0.2-era
  work once gate #6 clears.

The code work is identical either way; only the landing order changes.

## Not changing

- `js/manifest.js`, `js/zip.js`, `js/token.js`, `js/export.js` internals,
  fixtures, SPEC.md — the format does not move. `/spec-sync` must return clean.
- The landing's visual design, typewriter mechanics, audio, backgrounds, and
  375px behavior (all author-approved work).
- `js/compose.js` — the app's own wizard keeps working unchanged on `app.html`.
- The versioning triple, until `/release`.

## Open decisions (author)

- **A. Ship sequencing** — A1 (images first, one release) or A2 (v0.1 ships
  as-is, front door follows). See above.
- **B. Wax-seal persistence** — registry entries gain optional `sealKey` via
  `state.migrate()` bump (recommended: it is user-chosen data), or derive the
  seal from the ID hash and persist nothing.
- **C. Front-door nav wording** for the link to `app.html` — letter-facing
  copy, prose gate; proposal comes with the plan.

## Verification

1. Gate 1: `node --check` on every touched JS; all three module suites green;
   fixtures byte-identical.
2. Gate 2: `node tools/prose-check.js` (empty-shelf copy, nav wording).
3. Gate 3 browser, 375px first: seal a letter through the front-door ceremony →
   folder downloads and its checksums verify independently → entry appears in
   `tessera_v1` → same entry visible in `app.html#letters` → reload persists →
   reprint from registry works. Print preview faces correct on both doors
   (print.css move is behavior-neutral). Offline pass from the front door.
4. `/spec-sync` clean; `/century-audit` full run (the offline story changed).
5. State migration: a registry written before this change loads unharmed
   (migrate() round-trip with a pre-change fixture blob).
