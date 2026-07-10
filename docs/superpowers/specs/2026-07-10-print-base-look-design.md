# Print base look — design

*2026-07-10 · aligns the print kit with the landing redesign · approach approved by the author (full alignment with a paper test); lands before the v0.1 ship*

## Intent

The landing redesign (commit `087e300` and successors) established the product's
typographic identity: Young Serif for display, Courier Prime for the typewriter
voice, both vendored as OFL files. The print kit — the product, per
design-language.md — still prints in whatever system serif the machine has, so
the same letter looks different on every printer. This design vendors the two
faces into the app and makes them the print kit's base look. The v0.2 print
themes then restyle on top of this base (their plan is unchanged).

This exercises the revisit clause already recorded in `docs/design-language.md`
§Typography: vendoring a single OFL face is permissible because vendored ≠
dependent; the decision is made by print-output quality. The v0.1 physical
walkthrough supplies the print evidence; the specimen sheet below supplies the
rest.

## Design

### 1. Fonts become app-owned

New top-level `fonts/` directory: `YoungSerif-Regular.ttf`,
`CourierPrime-Regular.ttf`, `CourierPrime-Bold.ttf`, `CourierPrime-Italic.ttf`,
plus both OFL license files — copied from `landing/fonts/` (the landing keeps
its copies; it remains a separable surface until "landing goes real" lands).
`@font-face` rules go in `style.css` with `font-display: swap` and local file
URLs only — no network fetch ever (century check A).

### 2. Face mapping (base look, all sheets)

- **Young Serif** — cover sheet display (kicker, title, plea) and sheet
  headings ("The token", register heading).
- **Courier Prime** — the instructions page `readme-pre` (replacing generic
  `ui-monospace`) and the small self-identifying sheet footers (IDs + dates).
  This is the landing's typewriter voice on the kit's typewriter-flavored
  surfaces.
- **Letter body** — decided on paper, not in this spec (see §3). Candidates:
  Young Serif at 11.5pt vs the current system serif stack. Fallback candidate
  if both disappoint on paper: EB Garamond (the face design-language.md names).
- **Token SVG — untouched.** `token.svg` keeps generic fonts only; fixtures
  are law and `tools/test-token.js` enforces it. No format event anywhere in
  this design: README template, manifest, zip, fixtures all unchanged.
- Fallback stacks: every `@font-face` usage keeps the current system stacks as
  CSS fallbacks, so a copy of the tool with fonts stripped still prints sanely
  (century check C: SPEC alone is enough; fonts are comfort, not requirement).

### 3. The specimen sheet (author judgment step)

The implementation adds a temporary specimen page (not shipped: a scratch HTML
served by the dev server, not part of the kit) setting the same two letter
paragraphs at 11.5pt/65ch in (a) Young Serif, (b) the system serif stack. The
author prints it once and picks the letter-body face. The choice is recorded in
decisions.md and applied; the specimen file is then deleted. If the author
picks "neither", EB Garamond Regular is vendored for the body as the recorded
fallback and the specimen re-run once.

### 4. Screen preview parity

The on-screen print preview (`#screen-print` paper cards) uses the same faces —
the preview stays faithful to paper. App UI chrome elsewhere is unchanged in
this design (screens belong to the "landing goes real" project).

### 5. Offline

The font files join the `sw.js` precache list (offline compose→seal→print is a
release gate). `CACHE_VERSION` is NOT bumped by hand — the versioning triple
moves together via the imminent `/release`, which is the very next release
event. Until then, dev browsers need the usual SW unregister after shell edits.

## Not changing

- `js/manifest.js`, `js/zip.js`, `js/token.js`, `js/export.js`, fixtures — no
  format surface moves. `/spec-sync` must come back clean.
- The v0.2 envelope-themes plan: themes still restyle within the print rules on
  top of this base; the instructions page still never changes voice or layout
  across themes (its base face is now Courier Prime; themes may not override
  it).
- The landing surface itself.

## Verification

1. Gate 1: `node --check` on touched JS (none expected beyond possibly
   print.js class hooks), all three module test suites green.
2. Gate 2: `node tools/prose-check.js` (no letter-facing copy changes
   expected; run anyway).
3. Gate 3 browser: print preview at A4 + Letter — correct faces on every
   sheet, no clipped content, ink-light holds, page breaks intact; 375px
   screen preview; offline pass (fonts served from SW cache with network
   disabled).
4. The specimen print (author, real printer) decides the letter body;
   decisions.md entry records it.
5. `/century-audit` spot-check: no external requests at compose/export/print
   (fonts are local), token checks unchanged.
