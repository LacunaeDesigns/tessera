# Token generation 2 — the watercolor mosaic (design)

**Date:** 2026-07-11 · **Status:** approved (brainstorm), ready for plan
**Format impact:** fixture diff = format event, handled loudly. The manifest
`tessera` spec version stays `0.1` (no manifest/README/zip change; the token
remains "plain SVG 1.1, no scripts, no external refs, no fonts").

## Problem / intent

The author finds the current token disk visually flat and asked for (a) a
richer mosaic and (b) the landing's watercolor-pastel character. Three
candidate directions were rendered against real seeds and judged side by side
(including a grayscale fade simulation); the author chose **A2, the watercolor
underwash**, from the comparison. The break line — the authenticity mechanism —
already cuts uniquely per letter and is explicitly **not** part of this change.

## The art (generation 2)

`js/token.js`'s tile field is replaced by the A2 design (validated candidate:
scratchpad `variant-2.js` from the token-art-candidates workflow, independently
re-verified deterministic):

- A cream substrate disk (`#FBF6EC`) inside the ink rim.
- **3–5 seeded watercolor washes**: blobby polygons (14–20 points, lobed radii
  ~60–163 clamped inside the rim) in light pastels (`#F5E0D5`, `#DFEDE3`,
  `#F3E9D0`, `#E4E9EA`, `#F2C7B6`) at fill-opacity 0.5–0.7, each with a
  shrunken 0.3-opacity core for pigment pooling. Colors cycle via a seeded
  coprime step so washes never repeat within a disk. No gradients, no filters.
- **A finer per-letter ring mosaic above**: 4 or 5 rings (seeded), wobbled band
  boundaries, per-ring sector counts derived from a seeded target tile width
  (~175–208 tiles per disk vs today's 64), per-ring angular phase so rings
  never align, ~3.2 px grout through which the washes show.
- **Grayscale-safe palette**: tiles stay ink-family ~50% / wax ~20% / deep
  pastels ~30% (`#9DBBA6`, `#CDB878`, `#D9A088`, `#A8B4B8`); the pastels live
  mainly in the wash layer beneath. The faded/grayscale skeleton must still
  read (this was checked in the candidate comparison and is re-checked in the
  token-lab visual pass).
- Center: the wax disc with a thin deep-ink rim over a slightly larger blush
  halo. The ink outer boundary circle stays.
- Break stroke color becomes the fixed `#FBF6EC` (substrate showing through —
  reads as a crack), one fixed color, not seeded.

**Unchanged, byte-identical:** `breakLine()`, `polyline()`, `clipPolygon()`,
`half()` construction, `svgOpen()`, and the whole sheet assembly (two halves,
dashed cut line, ID captions, assembled preview). The cut and its interlocking
notches are untouched. Output shape stays `{full, left, right, sheet}`; api
stays `{renderTokenSvg, rngFromSeed}`; dual-env guard stays.

**Determinism contract holds:** every draw from the seeded sfc32 stream in
stable insertion order; all floats through `r2()`; no `Math.random`/`Date`/
locale; same seed ⇒ byte-identical SVG forever.

## Old tokens never become wrong (compatibility)

`verifyLetter` byte-compares the enclosed `token.svg` against a re-drawn one.
A new art generation would make every previously sealed letter (v0.1.0–v0.3.0,
including the five founding letters) warn. Decision:

- The current renderer is preserved **forever** as `js/token-legacy.js`
  (pure, dual-env, byte-identical logic to today's `token.js`).
- `js/open.js` `verifyLetter` tries the **current** renderer first, then the
  **legacy** renderer; a byte-match on either ⇒ `tokenOk: true`, no warning.
  Both re-derivations use the same seed/ID logic. If neither matches, the
  existing gentle warning stands.
- The re-drawn token shown in the verify screen and used by "read it on paper"
  is whichever generation matched (so an old letter's paper reprint matches
  its printed halves); if neither matched, the current generation is shown.
- No manifest field, no format change: trying both renderers needs no version
  marker. `index.html` loads `token-legacy.js` alongside `token.js`.

## Fixtures: a format event, done loudly

- The existing `tools/fixtures/token-fix1.svg` / `token-fix2.svg` bytes are
  **never regenerated**: the files are renamed `token-legacy-fix1.svg` /
  `token-legacy-fix2.svg` and asserted byte-identical against
  `js/token-legacy.js`. Their history is preserved untouched.
- New `token-fix1.svg` / `token-fix2.svg` are born from generation 2 (same two
  reference letters), committed with the change.
- Same day: a dated generation note in `docs/features/token.md` (the family is
  now "mosaic ring (gen 1, 2026-07-10, legacy) → watercolor mosaic (gen 2,
  2026-07-11)"), and a `docs/decisions.md` entry covering what changed, why,
  and what happens to already-printed tokens (nothing — they verify via the
  legacy fallback and still match by eye; paper halves remain valid forever).

## Testing

- `tools/test-token.js`: both generations tested — determinism (render twice,
  byte-identical), seeds differ, fixture byte-match (gen-2 against the new
  fixtures, legacy against the renamed ones), forbidden-source scan
  (`Math.random`, `Date`, `toLocale`) on **both** files, no
  scripts/filters/external refs in output of both.
- `tools/test-open.js`: new case — a folder built with the **legacy** renderer
  verifies `tokenOk: true` through the fallback (proves old letters stay
  clean); existing cases keep passing with gen-2.
- Browser (Gate 3): seal a letter → gen-2 token on the receipt, sheet, and
  print kit; open a freshly sealed letter (matches via current) and a
  pre-change letter (matches via legacy, no warning); token compare and
  "show the break line large" render correctly; 375px first; wallet card and
  register unaffected.
- Token-lab visual pass before commit: fixture seeds + exploratory seeds
  eyeballed at drawer distance, explicitly checking the two flagged concerns —
  wash-core opacity stacking in grout gaps, and break-stroke contrast over
  pastel tiles.

## Release

Ships as **v0.3.1** via `/release` (art change within the token family; no
format change). SW CORE gains `js/token-legacy.js`. The physical-walkthrough
question belongs to the release conversation: the printed token sheet changes
appearance (new art), so printing one gen-2 sheet and cutting it is the
recommended (cheap) physical check.

## Out of scope

The break line and notches (explicitly kept); the sheet layout; manifest,
README, zip, checksums; the wallet card; encryption/envelope-themes plans.
